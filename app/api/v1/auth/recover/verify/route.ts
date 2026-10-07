import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRecoveryHash, generateResetToken } from "@/lib/auth";

const MAX_RECOVERY_FAILURES = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;
const TEMP_BLOCK_DURATION_MS = 10 * 60 * 1000;

// Faithful port of recovery.js:verifyRecovery — POST /v1/auth/recover/verify.
export async function POST(req: Request) {
  const { bankAccountId, recoveryString } = (await req.json().catch(() => ({}))) ?? {};
  if (!bankAccountId || !recoveryString) {
    return NextResponse.json({ error: "bankAccountId and recoveryString are required" }, { status: 400 });
  }

  const user = await prisma.up_users.findFirst({ where: { bank_number: bankAccountId } });
  if (!user) {
    return NextResponse.json({ verificationResult: "FAIL", error: "INVALID_RECOVERY_STRING" }, { status: 400 });
  }

  if (user.blocked) {
    return NextResponse.json(
      { verificationResult: "FAIL", error: "PERMANENTLY_BLOCKED", message: "Account is permanently blocked. Please contact support.", isBlocked: true, requiresSupport: true },
      { status: 403 }
    );
  }

  if (user.temp_blocked_until && new Date(user.temp_blocked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.temp_blocked_until).getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { verificationResult: "FAIL", error: "TEMP_BLOCKED", message: `Account is temporarily blocked for ${remainingMinutes} more minutes. Cannot recovery during this time.`, remainingMinutes, tempBlockedUntil: user.temp_blocked_until },
      { status: 403 }
    );
  }

  if (!user.recovery_string) {
    return NextResponse.json({ verificationResult: "FAIL", error: "RECOVERY_NOT_CONFIGURED" }, { status: 400 });
  }

  const isValid = await verifyRecoveryHash(recoveryString, user.recovery_string);
  if (!isValid) {
    if (user.is_in_final_chance) {
      await prisma.up_users.update({ where: { id: user.id }, data: { blocked: true, is_in_final_chance: false } });
      return NextResponse.json(
        { verificationResult: "FAIL", error: "PERMANENTLY_BLOCKED", message: "Wrong recovery string in final chance. Account is now permanently blocked. Please contact support.", isBlocked: true, requiresSupport: true },
        { status: 403 }
      );
    }

    const newFailureCount = (user.recovery_failure_count || 0) + 1;
    const updateData: Record<string, unknown> = { recovery_failure_count: newFailureCount };
    if (newFailureCount >= MAX_RECOVERY_FAILURES) {
      updateData.temp_blocked_until = new Date(Date.now() + TEMP_BLOCK_DURATION_MS);
      updateData.is_in_final_chance = true;
      updateData.recovery_failure_count = 0;
    }
    await prisma.up_users.update({ where: { id: user.id }, data: updateData });

    if (newFailureCount >= MAX_RECOVERY_FAILURES) {
      return NextResponse.json(
        { verificationResult: "FAIL", error: "TEMP_BLOCKED", message: "Too many failed recovery attempts. Account is temporarily blocked for 10 minutes.", remainingMinutes: 10 },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { verificationResult: "FAIL", error: "INVALID_RECOVERY_STRING", attemptsRemaining: MAX_RECOVERY_FAILURES - newFailureCount },
      { status: 400 }
    );
  }

  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  const requiresOtp = user.is_in_final_chance === true;

  await prisma.up_users.update({
    where: { id: user.id },
    data: {
      reset_token: resetToken,
      reset_token_expires_at: resetTokenExpiresAt,
      recovery_failure_count: 0,
      login_failure_count: 0,
      temp_blocked_until: null,
      ...(requiresOtp ? {} : { is_in_final_chance: false }),
    },
  });

  return NextResponse.json({
    verificationResult: "PASS",
    resetToken,
    requiresOtp,
    message: requiresOtp
      ? "Recovery verified. Please verify OTP to complete the process."
      : "Recovery verified. You can now reset your password.",
  });
}
