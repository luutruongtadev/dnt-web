import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateResetToken } from "@/lib/auth";

const RESET_TOKEN_EXPIRY_MINUTES = 10;

// Faithful port of recovery.js:verifyOtp — POST /v1/auth/recover/verify-otp.
export async function POST(req: Request) {
  const { resetToken, otp } = (await req.json().catch(() => ({}))) ?? {};
  if (!resetToken || !otp) {
    return NextResponse.json({ error: "resetToken and otp are required" }, { status: 400 });
  }

  const user = await prisma.up_users.findFirst({ where: { reset_token: resetToken } });
  if (!user) {
    return NextResponse.json({ verificationResult: "FAIL", error: "INVALID_RESET_TOKEN", message: "Reset token is invalid or has already been used." }, { status: 400 });
  }

  if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
    await prisma.up_users.update({ where: { id: user.id }, data: { reset_token: null, reset_token_expires_at: null } });
    return NextResponse.json({ verificationResult: "FAIL", error: "RESET_TOKEN_EXPIRED", message: "Reset token has expired. Please request a new one." }, { status: 400 });
  }

  if (!user.otp) {
    return NextResponse.json({ verificationResult: "FAIL", error: "OTP_NOT_SET", message: "User has not set up an OTP. Please contact support." }, { status: 400 });
  }

  if (String(user.otp) !== String(otp)) {
    if (user.is_in_final_chance) {
      await prisma.up_users.update({
        where: { id: user.id },
        data: { blocked: true, is_in_final_chance: false, reset_token: null, reset_token_expires_at: null },
      });
      return NextResponse.json(
        { verificationResult: "FAIL", error: "PERMANENTLY_BLOCKED", message: "Wrong OTP in final chance. Account is now permanently blocked. Please contact support.", isBlocked: true, requiresSupport: true },
        { status: 403 }
      );
    }
    return NextResponse.json({ verificationResult: "FAIL", error: "INVALID_OTP", message: "Invalid OTP. Please try again." }, { status: 400 });
  }

  const passwordResetToken = generateResetToken();
  const passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  await prisma.up_users.update({
    where: { id: user.id },
    data: { reset_token: passwordResetToken, reset_token_expires_at: passwordResetTokenExpiresAt, is_in_final_chance: false },
  });

  return NextResponse.json({
    verificationResult: "PASS",
    resetToken: passwordResetToken,
    message: "OTP verified successfully. You can now reset your password.",
  });
}
