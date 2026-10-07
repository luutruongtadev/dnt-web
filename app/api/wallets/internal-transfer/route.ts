import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { assertWithinLimits } from "@/lib/services/risk";
import { internalTransfer } from "@/lib/services/wallet-ledger";

const VALID_ACCOUNT_TYPES = ["account_of_goods", "account_of_freelancer", "account_of_ailive"];

// POST /wallets/internal-transfer { accountType, amount, idempotencyKey? }
// Port of wallet service:transferToInternalAccount.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const accountType    = body.accountType as string;
  const amount         = Number(body.amount);
  const idempotencyKey = (body.idempotencyKey as string | undefined)
    ?? req.headers.get("idempotency-key") ?? undefined;

  if (!accountType || !VALID_ACCOUNT_TYPES.includes(accountType)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Transfer amount must be greater than 0" }, { status: 400 });
  }

  try {
    const link = await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id } });
    if (!link?.wallet_id) return NextResponse.json({ error: "User does not have a wallet" }, { status: 404 });

    await assertWithinLimits({ walletId: link.wallet_id, type: "INTERNAL_TRANSFER", amount });

    const result = await internalTransfer({ walletId: link.wallet_id, accountField: accountType, amount, idempotencyKey });

    return NextResponse.json({ success: true, message: "Internal transfer completed successfully", transactionId: result.transactionId });
  } catch (err) {
    const msg = (err as Error).message;
    console.error("Internal transfer error:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
