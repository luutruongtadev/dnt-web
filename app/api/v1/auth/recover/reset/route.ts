import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { validatePasswordPolicy, hashPassword } from "@/lib/auth";

// Faithful port of recovery.js:resetPassword — POST /v1/auth/recover/reset.
export async function POST(req: Request) {
  const { resetToken, newPassword } = (await req.json().catch(() => ({}))) ?? {};
  if (!resetToken || !newPassword) {
    return NextResponse.json({ error: "resetToken and newPassword are required" }, { status: 400 });
  }

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.valid) {
    return NextResponse.json({ error: "PASSWORD_POLICY_FAILED", message: policy.message }, { status: 400 });
  }

  const user = await prisma.up_users.findFirst({ where: { reset_token: resetToken } });
  if (!user) {
    return NextResponse.json({ error: "INVALID_RESET_TOKEN", message: "Reset token is invalid or has already been used." }, { status: 400 });
  }

  if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
    await prisma.up_users.update({ where: { id: user.id }, data: { reset_token: null, reset_token_expires_at: null } });
    return NextResponse.json({ error: "RESET_TOKEN_EXPIRED", message: "Reset token has expired. Please request a new one." }, { status: 400 });
  }

  // OTP gate: a still-in-final-chance account hasn't completed the OTP step.
  if (user.is_in_final_chance) {
    return NextResponse.json({ error: "OTP_REQUIRED", message: "OTP verification is required before resetting the password." }, { status: 400 });
  }

  if (user.password && (await bcrypt.compare(newPassword, user.password))) {
    return NextResponse.json({ error: "PASSWORD_SAME_AS_PREVIOUS", message: "New password must be different from the previous password." }, { status: 409 });
  }

  await prisma.up_users.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(newPassword),
      reset_token: null,
      reset_token_expires_at: null,
      login_failure_count: 0,
      account_locked_until: null,
      confirmed: true,
    },
  });

  return NextResponse.json({ success: true, message: "Password has been reset successfully. You can now login with your new password." });
}
