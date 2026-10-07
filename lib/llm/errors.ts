import type { ZodError } from "zod";

export class StructuredOutputError extends Error {
  constructor(provider: string, finishReason: string | null) {
    super(
      `[llm] ${provider}: structured output failed (finish_reason=${finishReason ?? "null"})`,
    );
    this.name = "StructuredOutputError";
  }
}

export class SchemaMismatchError extends Error {
  readonly issues: ZodError["issues"];
  constructor(label: string, zodError: ZodError) {
    super(`[llm] ${label}: response did not match schema — ${zodError.message}`);
    this.name = "SchemaMismatchError";
    this.issues = zodError.issues;
  }
}
