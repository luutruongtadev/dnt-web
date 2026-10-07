import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createDepositIntent } from "@/lib/payment/sepay";

// POST /payment/deposit-intent/sepay { amount }
// Port of payment-connector.js:createDepositIntent.
// Returns bank account info + VietQR URL; the user then makes the actual
// bank transfer and SEPAY posts the webhook to credit the wallet.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const amount = Number(body.amount);

  if (!amount || amount <= 0) return NextResponse.json({ error: "amount is required" }, { status: 400 });

  try {
    const link = await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id } });
    if (!link?.wallet_id) return NextResponse.json({ error: "User does not have a wallet" }, { status: 404 });

    const intent = createDepositIntent({ walletId: link.wallet_id, amount });
    return NextResponse.json({ data: intent });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("configured") || msg.includes("1,000")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("Deposit intent error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
