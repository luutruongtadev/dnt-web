import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth";

// Faithful port of recovery.js:verifyRecoveryCccd — POST /auth/recovery/verify-cccd.
// On mismatch: permanent block. On match: issue a temp password.
export async function POST(req: Request) {
  const { accountId, fullName, idNumber } = (await req.json().catch(() => ({}))) ?? {};
  if (!accountId || !fullName || !idNumber) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { bank_number: accountId } });
  if (!user) return NextResponse.json({ success: false }, { status: 400 });

  const isMatchCccd = !!user.cccd && String(idNumber).trim() === String(user.cccd).trim();
  const isMatchName = !!user.full_name && String(fullName).trim().toUpperCase() === String(user.full_name).trim().toUpperCase();

  if (!isMatchCccd || !isMatchName) {
    await prisma.up_users.update({ where: { id: user.id }, data: { blocked: true } });
    return NextResponse.json({ success: false, error: "PERMANENTLY_BLOCKED", isBlocked: true }, { status: 403 });
  }

  const tempPassword = `temp${crypto.randomBytes(4).toString("hex")}!`;
  await prisma.up_users.update({
    where: { id: user.id },
    data: { password: await hashPassword(tempPassword), recovery_failure_count: 0, temp_blocked_until: null, blocked: false },
  });
  return NextResponse.json({ success: true, tempPassword });
}
