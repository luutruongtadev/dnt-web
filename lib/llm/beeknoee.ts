import { z, ZodError, type ZodType, type infer as ZodInfer } from "zod";
import type {
  ChatMessage,
  ContentPart,
  LlmProvider,
  StructuredRequest,
  StructuredResult,
} from "./types";
import { assertSystemBudget, logUsage, type Usage } from "./cache";
import { SchemaMismatchError, StructuredOutputError } from "./errors";

const BASE_URL = process.env.BEEKNOEE_BASE_URL ?? "https://platform.beeknoee.com/v1";
const MODEL = process.env.BEEKNOEE_MODEL ?? "claude-sonnet-4-6";

const MAX_CONCURRENCY = Number(process.env.BEEKNOEE_MAX_CONCURRENCY ?? 2);

type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { url: string; mime_type: string } };

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAiContentPart[];
};

function toOpenAiContent(content: ChatMessage["content"]): string | OpenAiContentPart[] {
  if (typeof content === "string") return content;
  return content.map((part: ContentPart): OpenAiContentPart =>
    part.type === "text"
      ? { type: "text", text: part.text }
      : {
          type: "file",
          file: {
            url: `data:${part.mediaType};base64,${part.base64}`,
            mime_type: part.mediaType,
          },
        },
  );
}

function hasDocument(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "document"),
  );
}

/**
 * Per the gateway's own docs (platform.beeknoee.com/docs/chat-completions,
 * "Model hỗ trợ Multimodal"): PDF/audio/video are documented as working
 * only on Gemini-family models — GPT/Claude/DeepSeek routed through this
 * gateway silently drop the media part of the message rather than erroring.
 */
export function assertModelReadsDocuments(model: string): void {
  if (!model.startsWith("gemini")) {
    throw new Error(
      `beeknoee: model "${model}" does not read document input through this ` +
        `gateway — only Gemini-family models do. Set BEEKNOEE_MODEL to a ` +
        `Gemini model, or convert the document to text before calling structured().`,
    );
  }
}

/** Strips a markdown fence some models wrap JSON in despite instructions not to. */
export function extractJson(text: string): string {
  const t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const opener = t.match(/^```(?:json)?\s*([\s\S]*)$/);
  if (opener) return opener[1].trim();
  return t;
}

function jsonModeInstructions(schemaText: string): string {
  return (
    `Respond with ONLY a single JSON object — no markdown code fences, no ` +
    `commentary before or after. The object must validate against this JSON ` +
    `Schema:\n\n${schemaText}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Semaphore {
  private queue: Array<() => void> = [];
  private active = 0;
  constructor(private readonly limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

/**
 * OpenAI-compatible /v1/chat/completions gateway that routes to whichever
 * model BEEKNOEE_MODEL names (DeepSeek, GPT, Claude, Gemini...).
 */
export class BeeknoeeProvider implements LlmProvider {
  readonly id = "beeknoee";
  private readonly semaphore = new Semaphore(MAX_CONCURRENCY);

  constructor(
    private readonly maxThrottleRetries = 4,
    private readonly baseDelayMs = 500,
    private readonly maxParseRetries = 3,
  ) {}

  private apiKey(): string {
    const key = process.env.BEEKNOEE_API_KEY;
    if (!key) throw new Error("Missing BEEKNOEE_API_KEY.");
    return key;
  }

  private async rawCall(
    messages: OpenAiMessage[],
    maxTokens: number,
    attempt: number,
  ): Promise<{ content: string; usage: Usage }> {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `beeknoee: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`,
      );
    }

    const json = await res.json();

    // Zero prompt tokens = gateway throttle, not a real completion.
    const promptTokens = json.usage?.prompt_tokens ?? 0;
    if (promptTokens === 0) {
      if (attempt >= this.maxThrottleRetries) {
        throw new Error(
          `beeknoee: still throttled after ${this.maxThrottleRetries} retries ` +
            `(zero prompt_tokens). Lower BEEKNOEE_MAX_CONCURRENCY or upgrade the plan.`,
        );
      }
      const delay = this.baseDelayMs * 2 ** attempt;
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[llm] beeknoee: throttled (zero prompt_tokens), attempt ${attempt + 1}/` +
            `${this.maxThrottleRetries}, backing off ${delay}ms`,
        );
      }
      await sleep(delay);
      return this.rawCall(messages, maxTokens, attempt + 1);
    }

    const content: unknown = json.choices?.[0]?.message?.content;
    const finishReason: string | null = json.choices?.[0]?.finish_reason ?? null;

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new StructuredOutputError("beeknoee", finishReason);
    }

    return {
      content,
      usage: {
        input: json.usage?.prompt_tokens ?? 0,
        output: json.usage?.completion_tokens ?? 0,
        cacheRead: json.usage?.prompt_cache_hit_tokens ?? 0,
        cacheWrite: 0,
      },
    };
  }

  private call(
    messages: OpenAiMessage[],
    maxTokens: number,
  ): Promise<{ content: string; usage: Usage }> {
    return this.semaphore.run(() => this.rawCall(messages, maxTokens, 0));
  }

  private parse<S extends ZodType>(
    schema: S,
    raw: string,
    label: string,
  ): { success: true; data: ZodInfer<S> } | { success: false; error: ZodError } {
    try {
      return schema.safeParse(JSON.parse(extractJson(raw)));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[llm] beeknoee:${label} response was not parseable JSON: ${String(error)}\n` +
            `--- raw content (first 1000 chars) ---\n${raw.slice(0, 1000)}`,
        );
      }
      return { success: false, error: new ZodError([]) };
    }
  }

  async structured<S extends ZodType>(
    req: StructuredRequest<S>,
  ): Promise<StructuredResult<ZodInfer<S>>> {
    if (hasDocument(req.messages)) assertModelReadsDocuments(MODEL);

    assertSystemBudget(req.label, req.system);

    const schemaText = JSON.stringify(z.toJSONSchema(req.schema), null, 2);
    const system = [...req.system.map((b) => b.text), jsonModeInstructions(schemaText)].join(
      "\n\n---\n\n",
    );

    const base: OpenAiMessage[] = [
      { role: "system", content: system },
      ...req.messages.map((m) => ({
        role: m.role,
        content: toOpenAiContent(m.content),
      })),
    ];

    const maxTokens = req.maxTokens ?? 16000;
    const first = await this.call(base, maxTokens);
    logUsage(`beeknoee:${req.label}`, first.usage);

    let parsed = this.parse(req.schema, first.content, req.label);
    if (parsed.success) return { data: parsed.data, usage: first.usage };

    const retryMessages: OpenAiMessage[] = [
      ...base,
      {
        role: "user",
        content:
          "Your previous response was not valid, complete JSON. Respond again from " +
          "scratch with ONLY a single, complete JSON object matching the schema — " +
          "no commentary, no code fence, and do not truncate the response.",
      },
    ];

    const usage: Usage = { ...first.usage };
    for (let attempt = 1; attempt <= this.maxParseRetries; attempt++) {
      if (attempt > 1) await sleep(this.baseDelayMs * (attempt - 1));

      const retry = await this.call(retryMessages, maxTokens);
      usage.input += retry.usage.input;
      usage.output += retry.usage.output;
      usage.cacheRead += retry.usage.cacheRead;
      usage.cacheWrite += retry.usage.cacheWrite;
      logUsage(`beeknoee:${req.label}:retry:${attempt}`, retry.usage);

      parsed = this.parse(req.schema, retry.content, `${req.label}:retry:${attempt}`);
      if (parsed.success) return { data: parsed.data, usage };
    }

    throw new SchemaMismatchError(req.label, parsed.error);
  }
}
