import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth";

// Faithful port of recovery.js:verifyRecoveryBalance — POST /auth/recovery/verify-balance.
export async function POST(req: Request) {
  const { accountId, balance } = (await req.json().catch(() => ({}))) ?? {};
  if (!accountId || balance === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { bank_number: accountId } });
  if (!user) return NextResponse.json({ success: false }, { status: 400 });

  const wallet = await prisma.wallets.findFirst({
    where: { OR: [{ user_id: BigInt(user.id) }, { cccd: user.cccd ?? "" }] },
  });
  const userBalance = wallet?.total ? Number(wallet.total) : 0;

  if (Number(balance) !== Number(userBalance)) {
    return NextResponse.json({ success: false, error: "BALANCE_MISMATCH" }, { status: 400 });
  }

  const tempPassword = `temp${crypto.randomBytes(4).toString("hex")}!`;
  await prisma.up_users.update({
    where: { id: user.id },
    data: { password: await hashPassword(tempPassword), recovery_failure_count: 0, temp_blocked_until: null, blocked: false },
  });
  return NextResponse.json({ success: true, tempPassword });
}
