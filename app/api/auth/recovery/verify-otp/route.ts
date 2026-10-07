import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRecoveryFailure } from "@/lib/auth/recovery-helpers";

// Faithful port of recovery.js:verifyRecoveryOtpStep — POST /auth/recovery/verify-otp.
export async function POST(req: Request) {
  const { accountId, otp } = (await req.json().catch(() => ({}))) ?? {};
  if (!accountId || !otp) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { bank_number: accountId } });
  if (!user) return NextResponse.json({ success: false }, { status: 400 });

  const storedOtp = user.otp || "123456";
  if (String(storedOtp) !== String(otp)) return handleRecoveryFailure(user);

  return NextResponse.json({ success: true });
}
