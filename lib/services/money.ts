// Faithful port of common/services/money.js.
// Balances are stored as decimal(20,2) but manipulated as JS numbers; raw float
// arithmetic can drift (0.1 + 0.2). Every amount written to the ledger is
// normalised to 2dp here.

const SCALE = 2;
const FACTOR = 10 ** SCALE;

// Round to 2dp using half-up. Non-finite → 0.
export function roundMoney(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * FACTOR) / FACTOR;
}

// True when value is finite and strictly positive.
export function isValidAmount(value: unknown): boolean {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

// Compare two monetary values after rounding.
export function moneyEquals(a: number, b: number): boolean {
  return Math.round(a * FACTOR) === Math.round(b * FACTOR);
}
