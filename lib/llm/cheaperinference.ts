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
import { extractJson } from "./beeknoee";

const BASE_URL = (
  process.env.CHEAPERINFERENCE_BASE_URL ?? "https://api.cheaperinference.com/v1"
).replace(/\/$/, "");
const MODEL = process.env.CHEAPERINFERENCE_MODEL ?? "gpt-5.6-sol";

type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAiContentPart[];
};

function toOpenAiContent(content: ChatMessage["content"]): string | OpenAiContentPart[] {
  if (typeof content === "string") return content;
  return content.map((part: ContentPart): OpenAiContentPart => {
    if (part.type === "text") return { type: "text", text: part.text };
    return {
      type: "image_url",
      image_url: { url: `data:${part.mediaType};base64,${part.base64}` },
    };
  });
}

function jsonModeInstructions(schemaText: string): string {
  return (
    `Respond with ONLY a single JSON object — no markdown code fences, no ` +
    `commentary before or after. The object must validate against this JSON ` +
    `Schema:\n\n${schemaText}`
  );
}

export class CheaperInferenceProvider implements LlmProvider {
  readonly id = "cheaperinference";

  private apiKey(): string {
    const key = process.env.CHEAPERINFERENCE_API_KEY;
    if (!key) throw new Error("Missing CHEAPERINFERENCE_API_KEY.");
    return key;
  }

  private async rawCall(
    messages: OpenAiMessage[],
    maxTokens: number,
  ): Promise<{ content: string; usage: Usage }> {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `cheaperinference: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`,
      );
    }

    const json = await res.json();
    const content: unknown = json.choices?.[0]?.message?.content;
    const finishReason: string | null = json.choices?.[0]?.finish_reason ?? null;

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new StructuredOutputError("cheaperinference", finishReason);
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
          `[llm] cheaperinference:${label} not parseable JSON: ${String(error)}\n` +
            `--- raw (first 1000 chars) ---\n${raw.slice(0, 1000)}`,
        );
      }
      return { success: false, error: new ZodError([]) };
    }
  }

  async structured<S extends ZodType>(
    req: StructuredRequest<S>,
  ): Promise<StructuredResult<ZodInfer<S>>> {
    assertSystemBudget(req.label, req.system);

    const schemaText = JSON.stringify(z.toJSONSchema(req.schema), null, 2);
    const systemText = [
      ...req.system.map((b) => b.text),
      jsonModeInstructions(schemaText),
    ].join("\n\n---\n\n");

    const messages: OpenAiMessage[] = [
      { role: "system", content: systemText },
      ...req.messages.map((m) => ({
        role: m.role,
        content: toOpenAiContent(m.content),
      })),
    ];

    const maxTokens = req.maxTokens ?? 4096;
    const first = await this.rawCall(messages, maxTokens);
    logUsage(`cheaperinference:${req.label}`, first.usage);

    const parsed = this.parse(req.schema, first.content, req.label);
    if (parsed.success) return { data: parsed.data, usage: first.usage };

    // One correction turn
    const retryMessages: OpenAiMessage[] = [
      ...messages,
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. " +
          "Respond again with ONLY a single complete JSON object matching the schema.",
      },
    ];
    const retry = await this.rawCall(retryMessages, maxTokens);
    const usage: Usage = {
      input: first.usage.input + retry.usage.input,
      output: first.usage.output + retry.usage.output,
      cacheRead: first.usage.cacheRead + retry.usage.cacheRead,
      cacheWrite: 0,
    };
    logUsage(`cheaperinference:${req.label}:retry`, retry.usage);

    const retryParsed = this.parse(req.schema, retry.content, `${req.label}:retry`);
    if (retryParsed.success) return { data: retryParsed.data, usage };

    throw new SchemaMismatchError(req.label, retryParsed.error);
  }
}
