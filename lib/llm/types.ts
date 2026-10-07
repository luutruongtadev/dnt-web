import type { ZodType, infer as ZodInfer } from "zod";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; base64: string }
  | { type: "document"; mediaType: string; base64: string };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface SystemBlock {
  text: string;
}

export interface StructuredRequest<S extends ZodType> {
  label: string;
  system: SystemBlock[];
  messages: ChatMessage[];
  schema: S;
  maxTokens?: number;
}

export interface StructuredResult<T> {
  data: T;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

export interface LlmProvider {
  readonly id: string;
  structured<S extends ZodType>(req: StructuredRequest<S>): Promise<StructuredResult<ZodInfer<S>>>;
}
