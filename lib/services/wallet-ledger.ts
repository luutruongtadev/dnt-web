import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { roundMoney, isValidAmount, moneyEquals } from "@/lib/services/money";
import { notify } from "@/lib/services/notify";
import { genDocumentId } from "@/lib/services/user-wallet";

// Faithful port of common/services/wallet-ledger.js (852 LOC).
//
// Double-entry ledger: every money operation posts a balanced pair of
// ledger_entries (DEBIT + CREDIT) inside an interactive Prisma transaction
// that also row-locks the wallet(s) via SELECT … FOR UPDATE to prevent races.
// Legacy wallet_ledger_entries rows are written in parallel for backwards compat.
// Wallet balance caches (wallets.total / account_of_*) are updated inside the
// same transaction.
//
// Idempotency: each operation checks ledger_transactions for a previously POSTED
// row with the same (type, referenceType, referenceId) or idempotencyKey before
// doing any work.

// ---------------------------------------------------------------------------
// Types (mirrors the DB schema)
// ---------------------------------------------------------------------------

type TrxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface LedgerAccount {
  id: number;
  code: string;
  name: string;
  type: string;
  normal_balance: string;
  currency: string;
  wallet_id: number | null;
  wallet_cccd: string | null;
  account_type: string | null;
  balance: Prisma.Decimal;
  allow_negative: boolean;
  active: boolean;
}

interface WalletRow {
  id: number;
  cccd: string | null;
  name: string | null;
  user_id: bigint | null;
  total: Prisma.Decimal | null;
  account_of_goods: Prisma.Decimal | null;
  account_of_freelancer: Prisma.Decimal | null;
  account_of_ailive: Prisma.Decimal | null;
  pending_amount: Prisma.Decimal | null;
  [key: string]: unknown;
}

interface LedgerTx {
  id: number;
  transaction_id: string;
  type: string;
  status: string;
}

interface LedgerEntry {
  account: LedgerAccount;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  accountType?: AccountType;
  wallet?: WalletRow;
  counterpartyWallet?: WalletRow;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYSTEM_BANK_CODE = "system:bank_cash";

type AccountType = "DEFAULT" | "GOODS_ACCOUNT" | "FREELANCER_ACCOUNT" | "AI_LIVE_ACCOUNT" | "HOLD";

const ACCOUNT_CONFIGS: Record<AccountType, { walletField: string; suffix: string }> = {
  DEFAULT:             { walletField: "total",                  suffix: "main" },
  GOODS_ACCOUNT:       { walletField: "account_of_goods",       suffix: "goods" },
  FREELANCER_ACCOUNT:  { walletField: "account_of_freelancer",  suffix: "freelancer" },
  AI_LIVE_ACCOUNT:     { walletField: "account_of_ailive",      suffix: "ailive" },
  HOLD:                { walletField: "pending_amount",         suffix: "hold" },
};

const INTERNAL_ACCOUNT_MAP: Record<string, AccountType> = {
  account_of_goods:      "GOODS_ACCOUNT",
  account_of_freelancer: "FREELANCER_ACCOUNT",
  account_of_ailive:     "AI_LIVE_ACCOUNT",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toAmount = (amount: unknown): number => {
  if (!isValidAmount(amount)) throw new Error("Amount must be greater than 0");
  return roundMoney(amount);
};

const toNumber = (v: unknown) => Number(v ?? 0);

function createTransactionId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function walletAccountCode(walletId: number, accountType: AccountType): string {
  const cfg = ACCOUNT_CONFIGS[accountType];
  if (!cfg) throw new Error("Invalid wallet account type");
  return `user:${walletId}:${cfg.suffix}`;
}

function balanceDelta(account: LedgerAccount, direction: "DEBIT" | "CREDIT", amount: number): number {
  const isDebitNormal = account.normal_balance === "DEBIT";
  if (direction === "DEBIT")  return isDebitNormal ? amount : -amount;
  if (direction === "CREDIT") return isDebitNormal ? -amount : amount;
  throw new Error("Invalid ledger direction");
}

// ---------------------------------------------------------------------------
// Row-level locking (must run inside a Prisma interactive transaction)
// ---------------------------------------------------------------------------

async function lockWallet(trx: TrxClient, walletId: number): Promise<WalletRow> {
  const rows = await trx.$queryRaw<WalletRow[]>`
    SELECT * FROM wallets WHERE id = ${walletId} FOR UPDATE
  `;
  if (!rows[0]) throw new Error("Wallet not found");
  return rows[0];
}

async function findAccountByCodeLocked(trx: TrxClient, code: string): Promise<LedgerAccount | null> {
  const rows = await trx.$queryRaw<LedgerAccount[]>`
    SELECT * FROM ledger_accounts WHERE code = ${code} FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function createAccount(trx: TrxClient, data: {
  code: string; name: string; type: string; normalBalance: string;
  currency?: string; walletId?: number; walletCccd?: string;
  accountType?: string; balance?: number; allowNegative?: boolean;
}): Promise<LedgerAccount> {
  const now = new Date();
  await trx.$executeRaw`
    INSERT INTO ledger_accounts
      (code, name, type, normal_balance, currency, wallet_id, wallet_cccd,
       account_type, balance, allow_negative, active, created_at, updated_at)
    VALUES
      (${data.code}, ${data.name}, ${data.type}, ${data.normalBalance},
       ${data.currency ?? "VND"}, ${data.walletId ?? null}, ${data.walletCccd ?? null},
       ${data.accountType ?? null}, ${data.balance ?? 0}, ${data.allowNegative ?? false},
       true, ${now}, ${now})
    ON CONFLICT (code) DO NOTHING
  `;
  const rows = await trx.$queryRaw<LedgerAccount[]>`
    SELECT * FROM ledger_accounts WHERE code = ${data.code} FOR UPDATE
  `;
  return rows[0];
}

async function ensureSystemBankAccount(trx: TrxClient): Promise<LedgerAccount> {
  const existing = await findAccountByCodeLocked(trx, SYSTEM_BANK_CODE);
  if (existing) return existing;
  return createAccount(trx, {
    code: SYSTEM_BANK_CODE, name: "System Bank Cash",
    type: "ASSET", normalBalance: "DEBIT", allowNegative: true,
  });
}

async function ensureWalletAccount(trx: TrxClient, wallet: WalletRow, accountType: AccountType): Promise<LedgerAccount> {
  const cfg = ACCOUNT_CONFIGS[accountType];
  const code = walletAccountCode(wallet.id, accountType);
  const existing = await findAccountByCodeLocked(trx, code);
  if (existing) return existing;
  return createAccount(trx, {
    code,
    name: `${wallet.name ?? wallet.cccd ?? `Wallet ${wallet.id}`} ${cfg.suffix}`,
    type: "LIABILITY",
    normalBalance: "CREDIT",
    walletId: wallet.id,
    walletCccd: wallet.cccd ?? undefined,
    accountType,
    balance: toNumber(wallet[cfg.walletField]),
    allowNegative: false,
  });
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

async function findProcessedTransaction(
  trx: TrxClient,
  type: string, referenceType: string | null, referenceId: string | null, idempotencyKey?: string
): Promise<LedgerTx | null> {
  if (idempotencyKey) {
    const rows = await trx.$queryRaw<LedgerTx[]>`
      SELECT id, transaction_id, type, status FROM ledger_transactions
      WHERE idempotency_key = ${idempotencyKey} AND status = 'POSTED'
      LIMIT 1
    `;
    if (rows[0]) return rows[0];
  }
  if (!referenceType || !referenceId) return null;
  const rows = await trx.$queryRaw<LedgerTx[]>`
    SELECT id, transaction_id, type, status FROM ledger_transactions
    WHERE type = ${type} AND reference_type = ${referenceType}
      AND reference_id = ${referenceId} AND status = 'POSTED'
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Core posting
// ---------------------------------------------------------------------------

function validateBalancedEntries(entries: LedgerEntry[]) {
  const debit  = roundMoney(entries.filter(e => e.direction === "DEBIT").reduce((s, e) => s + e.amount, 0));
  const credit = roundMoney(entries.filter(e => e.direction === "CREDIT").reduce((s, e) => s + e.amount, 0));
  if (debit <= 0 || credit <= 0 || !moneyEquals(debit, credit)) {
    throw new Error("Ledger transaction is not balanced");
  }
}

async function postLedgerTransaction(trx: TrxClient, data: {
  transactionId: string; type: string;
  referenceType?: string | null; referenceId?: string | null;
  idempotencyKey?: string; description?: string; metadata?: object;
  entries: LedgerEntry[];
}): Promise<LedgerTx> {
  validateBalancedEntries(data.entries);
  const now = new Date();

  await trx.$executeRaw`
    INSERT INTO ledger_transactions
      (transaction_id, type, status, reference_type, reference_id,
       idempotency_key, description, metadata, posted_at, created_at, updated_at)
    VALUES
      (${data.transactionId}, ${data.type}, 'POSTED',
       ${data.referenceType ?? null}, ${data.referenceId ?? null},
       ${data.idempotencyKey ?? null}, ${data.description ?? null},
       ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
       ${now}, ${now}, ${now})
  `;

  const txRows = await trx.$queryRaw<LedgerTx[]>`
    SELECT id, transaction_id, type, status FROM ledger_transactions
    WHERE transaction_id = ${data.transactionId}
  `;
  const ledgerTx = txRows[0];

  for (const entry of data.entries) {
    const balanceBefore = roundMoney(entry.account.balance);
    const delta = balanceDelta(entry.account, entry.direction, entry.amount);
    const balanceAfter = roundMoney(balanceBefore + delta);

    if (!entry.account.allow_negative && balanceAfter < 0) {
      throw new Error("Insufficient funds");
    }

    await trx.$executeRaw`
      UPDATE ledger_accounts SET balance = ${balanceAfter}, updated_at = ${now}
      WHERE id = ${entry.account.id}
    `;

    await trx.$executeRaw`
      INSERT INTO ledger_entries
        (ledger_transaction_id, transaction_id, ledger_account_id, account_code,
         wallet_id, wallet_cccd, account_type, direction, amount,
         balance_before, balance_after, created_at, updated_at)
      VALUES
        (${ledgerTx.id}, ${data.transactionId}, ${entry.account.id}, ${entry.account.code},
         ${entry.account.wallet_id ?? null}, ${entry.account.wallet_cccd ?? null},
         ${entry.account.account_type ?? null}, ${entry.direction}, ${entry.amount},
         ${balanceBefore}, ${balanceAfter}, ${now}, ${now})
    `;

    // Update wallet balance cache.
    if (entry.wallet && entry.accountType) {
      const cfg = ACCOUNT_CONFIGS[entry.accountType];
      if (cfg) {
        await trx.$executeRaw`
          UPDATE wallets SET ${Prisma.raw(`"${cfg.walletField}"`)} = ${balanceAfter}, updated_at = ${now}
          WHERE id = ${entry.wallet.id}
        `;
        (entry.wallet as Record<string, unknown>)[cfg.walletField] = balanceAfter;
      }
    }

    // Legacy wallet_ledger_entries row (for backwards compat / FE ledger queries).
    if (entry.wallet) {
      await trx.$executeRaw`
        INSERT INTO wallet_ledger_entries
          (transaction_id, wallet_id, wallet_cccd,
           counterparty_wallet_id, counterparty_wallet_cccd,
           direction, type, status, account_type, amount,
           balance_before, balance_after,
           reference_type, reference_id, idempotency_key,
           description, metadata, created_at, updated_at)
        VALUES
          (${data.transactionId}, ${entry.wallet.id}, ${entry.wallet.cccd ?? null},
           ${entry.counterpartyWallet?.id ?? null}, ${entry.counterpartyWallet?.cccd ?? null},
           ${entry.direction}, ${data.type}, 'SUCCESS',
           ${entry.accountType ?? "DEFAULT"}, ${entry.amount},
           ${balanceBefore}, ${balanceAfter},
           ${data.referenceType ?? null}, ${data.referenceId ?? null},
           ${data.idempotencyKey ?? null},
           ${data.description ?? null},
           ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
           ${now}, ${now})
      `;
    }

    // Keep the in-memory balance so subsequent entries in the same tx see the update.
    entry.account.balance = new Prisma.Decimal(balanceAfter);
  }

  return ledgerTx;
}

async function insertPaymentTransaction(trx: TrxClient, data: {
  amount: number; fromWallet: string; toWallet: string;
  comment: string; accountType: AccountType;
}) {
  const now = new Date();
  const docId = genDocumentId();
  await trx.$executeRaw`
    INSERT INTO payment_transactions
      (document_id, amount, from_wallet, to_wallet, comment,
       wallet_account_type, published_at, created_at, updated_at)
    VALUES
      (${docId}, ${data.amount}, ${data.fromWallet}, ${data.toWallet},
       ${data.comment}, ${data.accountType}, ${now}, ${now}, ${now})
  `;
}

// ---------------------------------------------------------------------------
// Side-effects: audit log + notification (best-effort, never throws)
// ---------------------------------------------------------------------------

async function recordMoneyEvent(data: {
  wallet: WalletRow; action: string; templateCode: string;
  amount: number; transactionId: string; extra?: object;
}) {
  const userId = data.wallet.user_id ? Number(data.wallet.user_id) : null;
  if (!userId) return;
  try {
    await notify({ userId, templateCode: data.templateCode, data: { amount: data.amount, transactionId: data.transactionId, ...data.extra } });
  } catch {
    // notifications must never undo the financial operation
  }
}

// ---------------------------------------------------------------------------
// Transaction wrapper
// ---------------------------------------------------------------------------

async function withLedgerTransaction<T>(cb: (trx: TrxClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(cb, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LedgerOpParams {
  walletId: number;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  idempotencyKey?: string;
  metadata?: object;
}

export async function deposit(params: LedgerOpParams) {
  const { walletId, referenceType, referenceId, idempotencyKey, metadata } = params;
  const amount = toAmount(params.amount);
  const transactionId = createTransactionId("deposit");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "DEPOSIT", referenceType ?? null, referenceId ?? null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id, walletId };

    const wallet = await lockWallet(trx, walletId);
    const systemBank = await ensureSystemBankAccount(trx);
    const userMain  = await ensureWalletAccount(trx, wallet, "DEFAULT");

    const description = params.description ?? `Deposit to wallet ${wallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "DEPOSIT", referenceType, referenceId, idempotencyKey, description, metadata,
      entries: [
        { account: systemBank, direction: "DEBIT", amount },
        { account: userMain, wallet, accountType: "DEFAULT", direction: "CREDIT", amount },
      ],
    });
    await insertPaymentTransaction(trx, { amount, fromWallet: SYSTEM_BANK_CODE, toWallet: wallet.cccd ?? "", comment: description, accountType: "DEFAULT" });
    await recordMoneyEvent({ wallet, action: "DEPOSIT_APPROVED", templateCode: "DEPOSIT_SUCCESS", amount, transactionId, extra: { referenceType, referenceId } });

    return { success: true, transactionId, walletId: wallet.id, balance: toNumber(userMain.balance) };
  });
}

export async function transfer(params: LedgerOpParams & { fromWalletId?: number; toWalletId: number }) {
  const fromId = params.fromWalletId ?? params.walletId;
  const toId   = params.toWalletId;
  const amount = toAmount(params.amount);
  const { referenceType, referenceId, idempotencyKey, metadata } = params;
  const transactionId = createTransactionId("transfer");

  if (String(fromId) === String(toId)) throw new Error("Cannot transfer to your own wallet. Use internal transfer instead.");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "TRANSFER", referenceType ?? null, referenceId ?? null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id };

    // Always lock lower id first to prevent deadlock.
    const orderedIds = [fromId, toId].sort((a, b) => a - b);
    const first  = await lockWallet(trx, orderedIds[0]);
    const second = await lockWallet(trx, orderedIds[1]);
    const fromWallet = first.id === fromId ? first : second;
    const toWallet   = first.id === toId   ? first : second;

    const fromAccount = await ensureWalletAccount(trx, fromWallet, "DEFAULT");
    const toAccount   = await ensureWalletAccount(trx, toWallet,   "DEFAULT");

    const description = params.description ?? `Transfer from wallet ${fromWallet.cccd} to wallet ${toWallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "TRANSFER", referenceType, referenceId, idempotencyKey, description, metadata,
      entries: [
        { account: fromAccount, wallet: fromWallet, counterpartyWallet: toWallet,   accountType: "DEFAULT", direction: "DEBIT",  amount },
        { account: toAccount,   wallet: toWallet,   counterpartyWallet: fromWallet, accountType: "DEFAULT", direction: "CREDIT", amount },
      ],
    });
    await insertPaymentTransaction(trx, { amount, fromWallet: fromWallet.cccd ?? "", toWallet: toWallet.cccd ?? "", comment: description, accountType: "DEFAULT" });
    await recordMoneyEvent({ wallet: fromWallet, action: "TRANSFER_SENT",     templateCode: "TRANSFER_SENT",     amount, transactionId, extra: { counterpartyWalletId: toWallet.id } });
    await recordMoneyEvent({ wallet: toWallet,   action: "TRANSFER_RECEIVED", templateCode: "TRANSFER_RECEIVED", amount, transactionId, extra: { counterpartyWalletId: fromWallet.id } });

    return { success: true, transactionId, fromWalletId: fromWallet.id, toWalletId: toWallet.id };
  });
}

export async function internalTransfer(params: LedgerOpParams & { accountField: string }) {
  const { walletId, accountField, idempotencyKey, metadata } = params;
  const targetType = INTERNAL_ACCOUNT_MAP[accountField];
  if (!targetType) throw new Error("Invalid account type");

  const amount = toAmount(params.amount);
  const transactionId = createTransactionId("internal");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "INTERNAL_TRANSFER", null, null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id, walletId };

    const wallet     = await lockWallet(trx, walletId);
    const mainAcct   = await ensureWalletAccount(trx, wallet, "DEFAULT");
    const targetAcct = await ensureWalletAccount(trx, wallet, targetType);

    const description = params.description ?? `Internal transfer to ${accountField} in wallet ${wallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "INTERNAL_TRANSFER", idempotencyKey, description, metadata,
      entries: [
        { account: mainAcct,   wallet, counterpartyWallet: wallet, accountType: "DEFAULT",  direction: "DEBIT",  amount },
        { account: targetAcct, wallet, counterpartyWallet: wallet, accountType: targetType, direction: "CREDIT", amount },
      ],
    });
    await insertPaymentTransaction(trx, { amount, fromWallet: wallet.cccd ?? "", toWallet: wallet.cccd ?? "", comment: description, accountType: targetType });
    await recordMoneyEvent({ wallet, action: "INTERNAL_TRANSFER", templateCode: "INTERNAL_TRANSFER", amount, transactionId, extra: { accountField } });

    return { success: true, transactionId, walletId: wallet.id };
  });
}

export async function holdWithdrawal(params: LedgerOpParams) {
  const { walletId, referenceType, referenceId, idempotencyKey, metadata } = params;
  const amount = toAmount(params.amount);
  const transactionId = createTransactionId("wd_hold");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "WITHDRAW_HOLD", referenceType ?? null, referenceId ?? null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id, walletId };

    const wallet   = await lockWallet(trx, walletId);
    const userMain = await ensureWalletAccount(trx, wallet, "DEFAULT");
    const userHold = await ensureWalletAccount(trx, wallet, "HOLD");

    const description = params.description ?? `Reserve withdrawal for wallet ${wallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "WITHDRAW_HOLD", referenceType, referenceId, idempotencyKey, description, metadata,
      entries: [
        { account: userMain, wallet, accountType: "DEFAULT", direction: "DEBIT",  amount },
        { account: userHold, wallet, accountType: "HOLD",    direction: "CREDIT", amount },
      ],
    });
    await recordMoneyEvent({ wallet, action: "WITHDRAW_REQUESTED", templateCode: "WITHDRAW_REQUESTED", amount, transactionId });

    return { success: true, transactionId, walletId: wallet.id, available: toNumber(userMain.balance), held: toNumber(userHold.balance) };
  });
}

export async function captureWithdrawal(params: LedgerOpParams) {
  const { walletId, referenceType, referenceId, idempotencyKey, metadata } = params;
  const amount = toAmount(params.amount);
  const transactionId = createTransactionId("wd_capture");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "WITHDRAW_CAPTURE", referenceType ?? null, referenceId ?? null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id, walletId };

    const wallet     = await lockWallet(trx, walletId);
    const userHold   = await ensureWalletAccount(trx, wallet, "HOLD");
    const systemBank = await ensureSystemBankAccount(trx);

    const description = params.description ?? `Withdraw payout for wallet ${wallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "WITHDRAW_CAPTURE", referenceType, referenceId, idempotencyKey, description, metadata,
      entries: [
        { account: userHold,   wallet, accountType: "HOLD", direction: "DEBIT",  amount },
        { account: systemBank,                              direction: "CREDIT", amount },
      ],
    });
    await insertPaymentTransaction(trx, { amount, fromWallet: wallet.cccd ?? "", toWallet: SYSTEM_BANK_CODE, comment: description, accountType: "DEFAULT" });
    await recordMoneyEvent({ wallet, action: "WITHDRAW_APPROVED", templateCode: "WITHDRAW_APPROVED", amount, transactionId });

    return { success: true, transactionId, walletId: wallet.id, held: toNumber(userHold.balance) };
  });
}

export async function releaseWithdrawal(params: LedgerOpParams) {
  const { walletId, referenceType, referenceId, idempotencyKey, metadata } = params;
  const amount = toAmount(params.amount);
  const transactionId = createTransactionId("wd_release");

  return withLedgerTransaction(async (trx) => {
    const dup = await findProcessedTransaction(trx, "WITHDRAW_RELEASE", referenceType ?? null, referenceId ?? null, idempotencyKey);
    if (dup) return { success: true, alreadyProcessed: true, transactionId: dup.transaction_id, walletId };

    const wallet   = await lockWallet(trx, walletId);
    const userHold = await ensureWalletAccount(trx, wallet, "HOLD");
    const userMain = await ensureWalletAccount(trx, wallet, "DEFAULT");

    const description = params.description ?? `Release reserved withdrawal for wallet ${wallet.cccd}`;
    await postLedgerTransaction(trx, {
      transactionId, type: "WITHDRAW_RELEASE", referenceType, referenceId, idempotencyKey, description, metadata,
      entries: [
        { account: userHold, wallet, accountType: "HOLD",    direction: "DEBIT",  amount },
        { account: userMain, wallet, accountType: "DEFAULT", direction: "CREDIT", amount },
      ],
    });
    await recordMoneyEvent({ wallet, action: "WITHDRAW_REJECTED", templateCode: "WITHDRAW_REJECTED", amount, transactionId });

    return { success: true, transactionId, walletId: wallet.id, available: toNumber(userMain.balance), held: toNumber(userHold.balance) };
  });
}

export async function getWalletLedger(walletId: number, params: { limit?: number; offset?: number } = {}) {
  const limit  = Math.min(Number(params.limit  ?? 50), 200);
  const offset = Number(params.offset ?? 0);

  type LedgerRow = {
    id: bigint; transaction_id: string; wallet_id: number; wallet_cccd: string | null;
    direction: string; type: string; status: string; account_type: string | null;
    amount: string; balance_before: string; balance_after: string;
    reference_type: string | null; reference_id: string | null;
    idempotency_key: string | null; description: string | null; metadata: string | null;
    created_at: Date;
  };

  const rows = await prisma.$queryRaw<LedgerRow[]>`
    SELECT e.id, e.transaction_id, e.wallet_id, e.wallet_cccd,
           e.direction, t.type, t.status, e.account_type,
           e.amount::text, e.balance_before::text, e.balance_after::text,
           t.reference_type, t.reference_id, t.idempotency_key,
           t.description, t.metadata, e.created_at
    FROM   ledger_entries AS e
    JOIN   ledger_transactions AS t ON e.ledger_transaction_id = t.id
    WHERE  e.wallet_id = ${walletId}
    ORDER  BY e.id DESC
    LIMIT  ${limit} OFFSET ${offset}
  `;

  return rows.map(r => ({ ...r, id: Number(r.id) }));
}

export async function hasLedgerTransaction(type: string, referenceType: string, referenceId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM ledger_transactions
    WHERE type = ${type} AND reference_type = ${referenceType}
      AND reference_id = ${referenceId} AND status = 'POSTED'
    LIMIT 1
  `;
  return rows.length > 0;
}
