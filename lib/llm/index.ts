import type { LlmProvider } from "./types";
import { BeeknoeeProvider } from "./beeknoee";
import { CheaperInferenceProvider } from "./cheaperinference";

let _provider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (_provider) return _provider;
  const id = (process.env.LLM_PROVIDER ?? "cheaperinference").toLowerCase();
  switch (id) {
    case "beeknoee":
      _provider = new BeeknoeeProvider();
      break;
    default:
      _provider = new CheaperInferenceProvider();
  }
  return _provider;
}

export type { LlmProvider } from "./types";
export type { StructuredRequest, StructuredResult, ChatMessage, ContentPart, SystemBlock } from "./types";
export { SchemaMismatchError, StructuredOutputError } from "./errors";
