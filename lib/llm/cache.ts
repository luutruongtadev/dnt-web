export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const MAX_SYSTEM_BLOCKS = 5;

export function assertSystemBudget(label: string, system: { text: string }[]): void {
  if (system.length > MAX_SYSTEM_BLOCKS) {
    throw new Error(
      `[llm] ${label}: system prompt has ${system.length} blocks (max ${MAX_SYSTEM_BLOCKS})`,
    );
  }
}

export function logUsage(label: string, usage: Usage): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[llm:usage] ${label} in=${usage.input} out=${usage.output} ` +
        `cacheR=${usage.cacheRead} cacheW=${usage.cacheWrite}`,
    );
  }
}
