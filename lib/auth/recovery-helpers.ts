import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RecoveryUser = {
  id: number;
  blocked: boolean | null;
  temp_blocked_until: Date | null;
  recovery_failure_count: number | null;
};

// Faithful port of recovery.js:handleRecoveryFailure (the /auth/recovery/* flow).
// 1st failure → 30-min temp block; 2nd → permanent block.
export async function handleRecoveryFailure(user: RecoveryUser): Promise<NextResponse> {
  if (user.blocked) {
    return NextResponse.json(
      { success: false, error: "PERMANENTLY_BLOCKED", message: "Account is permanently blocked. Please contact support.", isBlocked: true, requiresSupport: true },
      { status: 403 }
    );
  }
  if (user.temp_blocked_until && new Date(user.temp_blocked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.temp_blocked_until).getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { success: false, error: "TEMP_BLOCKED", message: "Account is temporarily blocked.", remainingMinutes, tempBlockedUntil: user.temp_blocked_until },
      { status: 403 }
    );
  }

  const newFailureCount = (user.recovery_failure_count || 0) + 1;
  const updateData: Record<string, unknown> = { recovery_failure_count: newFailureCount };
  let isNowBlocked = false;
  let isNowTempBlocked = false;
  if (newFailureCount >= 2) {
    updateData.blocked = true;
    isNowBlocked = true;
  } else if (newFailureCount === 1) {
    updateData.temp_blocked_until = new Date(Date.now() + 30 * 60 * 1000);
    isNowTempBlocked = true;
  }
  await prisma.up_users.update({ where: { id: user.id }, data: updateData });

  if (isNowBlocked) {
    return NextResponse.json(
      { success: false, error: "PERMANENTLY_BLOCKED", message: "Too many failures. Account is permanently blocked.", isBlocked: true, requiresSupport: true },
      { status: 403 }
    );
  }
  if (isNowTempBlocked) {
    return NextResponse.json(
      { success: false, error: "TEMP_BLOCKED", message: "Too many failed recovery attempts. Account is temporarily blocked for 30 minutes.", remainingMinutes: 30 },
      { status: 403 }
    );
  }
  return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
}
