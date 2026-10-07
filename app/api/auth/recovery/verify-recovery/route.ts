import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRecoveryHash } from "@/lib/auth";
import { handleRecoveryFailure } from "@/lib/auth/recovery-helpers";

// Faithful port of recovery.js:verifyRecoveryKey — POST /auth/recovery/verify-recovery.
export async function POST(req: Request) {
  const { accountId, recoveryKey } = (await req.json().catch(() => ({}))) ?? {};
  if (!accountId || !recoveryKey) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { bank_number: accountId } });
  if (!user) return NextResponse.json({ success: false }, { status: 400 });

  if (!user.recovery_string) return handleRecoveryFailure(user);
  const isValid = await verifyRecoveryHash(recoveryKey, user.recovery_string);
  if (!isValid) return handleRecoveryFailure(user);

  return NextResponse.json({ success: true });
}
