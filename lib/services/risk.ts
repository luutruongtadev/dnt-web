import { prisma } from "@/lib/db/prisma";
import { roundMoney } from "@/lib/services/money";

// Faithful port of common/services/risk.js.
// Risk limits live on system_configurations.risk_limits (JSON) so they can be
// tuned without a deploy; DEFAULT_LIMITS is the fallback when unset.
//
// "Outgoing" = WITHDRAW_HOLD + TRANSFER (money leaving the user's control).
// Deposits and internal transfers only get the per-tx min/max check.
//
// Call assertWithinLimits() BEFORE invoking any wallet-ledger operation.

export type TxType = "DEPOSIT" | "WITHDRAW_HOLD" | "TRANSFER" | "INTERNAL_TRANSFER";

export interface RiskConfig {
  minAmount: number;
  maxAmount: number;
  dailyOutgoingLimit: number;
  maxOutgoingTxPerDay: number;
}

const DEFAULT_LIMITS: RiskConfig = {
  minAmount: 1000,
  maxAmount: 500_000_000,
  dailyOutgoingLimit: 200_000_000,
  maxOutgoingTxPerDay: 20,
};

const OUTGOING_TYPES: TxType[] = ["WITHDRAW_HOLD", "TRANSFER"];

export async function getRiskConfig(): Promise<RiskConfig> {
  try {
    const row = await prisma.system_configurations.findFirst({ select: { risk_limits: true } });
    const overrides = (row?.risk_limits as Partial<RiskConfig> | null) ?? {};
    return { ...DEFAULT_LIMITS, ...overrides };
  } catch {
    return { ...DEFAULT_LIMITS };
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function assertDailyOutgoingLimit(walletId: number, amount: number, config: RiskConfig) {
  type Row = { total_amount: string | null; tx_count: string | null };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT coalesce(sum(e.amount), 0)::text AS total_amount,
           count(*)::text AS tx_count
    FROM   ledger_entries AS e
    JOIN   ledger_transactions AS t ON e.ledger_transaction_id = t.id
    WHERE  e.wallet_id  = ${walletId}
      AND  e.direction  = 'DEBIT'
      AND  e.account_type = 'DEFAULT'
      AND  t.type       = ANY(ARRAY['WITHDRAW_HOLD','TRANSFER'])
      AND  e.created_at >= ${startOfToday()}
  `;
  const row = rows[0];
  const totalToday = roundMoney(Number(row?.total_amount ?? 0) + amount);
  const countToday = Number(row?.tx_count ?? 0) + 1;

  if (totalToday > config.dailyOutgoingLimit) {
    throw new Error(`Daily outgoing limit exceeded (limit ${config.dailyOutgoingLimit})`);
  }
  if (countToday > config.maxOutgoingTxPerDay) {
    throw new Error(`Daily transaction count limit exceeded (limit ${config.maxOutgoingTxPerDay})`);
  }
}

export async function assertWithinLimits(params: { walletId: number; type: TxType; amount: number }) {
  const { walletId, type, amount } = params;
  const config = await getRiskConfig();

  if (amount < config.minAmount) {
    throw new Error(`Amount must be at least ${config.minAmount}`);
  }
  if (amount > config.maxAmount) {
    throw new Error(`Amount must not exceed ${config.maxAmount} per transaction`);
  }

  if ((OUTGOING_TYPES as string[]).includes(type)) {
    await assertDailyOutgoingLimit(walletId, amount, config);
  }
}
