import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { assertWithinLimits } from "@/lib/services/risk";
import { transfer } from "@/lib/services/wallet-ledger";

// POST /wallets/transfer { toWalletId, amount, idempotencyKey? }
// Port of wallet service:transferBetweenWallets.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const toWalletId  = Number(body.toWalletId);
  const amount      = Number(body.amount);
  const idempotencyKey = body.idempotencyKey as string | undefined
    ?? req.headers.get("idempotency-key") ?? undefined;

  if (!toWalletId || isNaN(toWalletId)) return NextResponse.json({ error: "toWalletId is required" }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ error: "Transfer amount must be greater than 0" }, { status: 400 });

  try {
    const link = await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id } });
    if (!link?.wallet_id) return NextResponse.json({ error: "User does not have a wallet" }, { status: 404 });

    const toWallet = await prisma.wallets.findFirst({ where: { id: toWalletId } });
    if (!toWallet) return NextResponse.json({ error: "Destination wallet not found" }, { status: 404 });

    await assertWithinLimits({ walletId: link.wallet_id, type: "TRANSFER", amount });

    const result = await transfer({
      fromWalletId: link.wallet_id,
      toWalletId,
      walletId: link.wallet_id,
      amount,
      idempotencyKey,
    });

    return NextResponse.json({ success: true, message: "Transfer completed successfully", transactionId: result.transactionId });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "User does not have a wallet" || msg === "Destination wallet not found") {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg === "Insufficient funds" || msg.includes("limit") || msg.includes("Amount")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("Transfer error:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
