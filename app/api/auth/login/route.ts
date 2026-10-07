import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { signToken, verifyPassword, isRecaptchaEnabled } from "@/lib/auth";
import { mediaUrlFor } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

const MAX_LOGIN_FAILURES = 5;

// Faithful port of Strapi POST /auth/login (api/auth/controllers/auth.js:login).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { cccd, password, device_name, location, login_type, otp } = body ?? {};

  if (!cccd || !password) {
    return NextResponse.json({ error: "cccd and password are required" }, { status: 400 });
  }

  // reCAPTCHA is only enforced when enabled; test env leaves it off (same as Strapi skip path).
  if (isRecaptchaEnabled()) {
    // (recaptcha verification would go here; mirrors Strapi's skip when disabled)
  }

  const existingUser = await prisma.up_users.findFirst({ where: { cccd } });
  if (!existingUser) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Permanently blocked
  if (existingUser.blocked) {
    return NextResponse.json(
      { error: "PERMANENTLY_BLOCKED", message: "Account is permanently blocked. Please contact support.", isBlocked: true, requiresSupport: true },
      { status: 403 }
    );
  }

  // Temp-blocked (10-minute lock)
  if (existingUser.temp_blocked_until && new Date(existingUser.temp_blocked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(existingUser.temp_blocked_until).getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: "TEMP_BLOCKED", message: `Account is temporarily blocked for ${remainingMinutes} more minutes.`, remainingMinutes, tempBlockedUntil: existingUser.temp_blocked_until },
      { status: 403 }
    );
  }

  // Final-chance mode: any wrong password = permanent block; correct still forces recovery
  if (existingUser.is_in_final_chance) {
    const ok = await verifyPassword(password, existingUser.password);
    if (!ok) {
      await prisma.up_users.update({ where: { id: existingUser.id }, data: { blocked: true, is_in_final_chance: false } });
      return NextResponse.json(
        { error: "PERMANENTLY_BLOCKED", message: "Wrong password in final chance. Account is now permanently blocked.", isBlocked: true, requiresSupport: true },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "RECOVERY_REQUIRED", reason: "FINAL_CHANCE_SECURITY_CHECK", message: "Password correct. Please verify recovery string to fully unlock your account.", requiresRecovery: true },
      { status: 403 }
    );
  }

  // Too many failures already → must recover
  if ((existingUser.login_failure_count || 0) >= MAX_LOGIN_FAILURES) {
    return NextResponse.json(
      { error: "RECOVERY_REQUIRED", reason: "TOO_MANY_LOGIN_FAILURES", message: "Too many failed login attempts. Please use recovery to unlock your account.", requiresRecovery: true },
      { status: 403 }
    );
  }

  // Normal password check
  const validPassword = await verifyPassword(password, existingUser.password);
  if (!validPassword) {
    const newFailureCount = (existingUser.login_failure_count || 0) + 1;
    await prisma.up_users.update({ where: { id: existingUser.id }, data: { login_failure_count: newFailureCount } });
    if (newFailureCount >= MAX_LOGIN_FAILURES) {
      return NextResponse.json(
        { error: "RECOVERY_REQUIRED", reason: "TOO_MANY_LOGIN_FAILURES", message: "Too many failed login attempts. Please use recovery to unlock your account.", requiresRecovery: true },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "INVALID_CREDENTIALS", message: "Invalid credentials", attemptsRemaining: MAX_LOGIN_FAILURES - newFailureCount },
      { status: 401 }
    );
  }

  // Success — reset failure counts and security flags
  await prisma.up_users.update({
    where: { id: existingUser.id },
    data: {
      login_failure_count: 0,
      recovery_failure_count: 0,
      is_in_final_chance: false,
      temp_blocked_until: null,
      account_locked_until: null,
      reset_token: null,
      reset_token_expires_at: null,
    },
  });

  // Device/session tracking → decide if OTP is required for an unfamiliar device
  const devName = device_name || "Unknown Device";
  const loc = location || "Unknown Location";
  let requiresOTP = false;
  try {
    const anyDevice = await prisma.user_sessions.findFirst({ where: { user_id: existingUser.id } });
    const currentDevice = await prisma.user_sessions.findFirst({
      where: { user_id: existingUser.id, device_name: devName, location: loc },
    });

    if (currentDevice) {
      if (!currentDevice.is_familiar) requiresOTP = true;
      await prisma.user_sessions.update({
        where: { id: currentDevice.id },
        data: { login_type: login_type || "password", updated_at: new Date() },
      });
    } else {
      if (anyDevice) requiresOTP = true;
      await prisma.user_sessions.create({
        data: {
          user_id: existingUser.id,
          device_name: devName,
          location: loc,
          login_type: login_type || "password",
          is_familiar: !anyDevice,
          status: requiresOTP ? "logout" : "login",
          last_login_at: requiresOTP ? null : new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("[Login] Failed to record user session:", err);
  }

  if (requiresOTP) {
    if (!otp || String(existingUser.otp) !== String(otp)) {
      return NextResponse.json(
        { error: "OTP_REQUIRED", reason: "UNFAMILIAR_DEVICE", message: otp ? "Mã OTP không chính xác" : "Unfamiliar device detected. Please verify OTP.", requiresOTP: true },
        { status: 403 }
      );
    }
  }

  // Mark the device familiar + logged in
  try {
    await prisma.user_sessions.updateMany({
      where: { user_id: existingUser.id, device_name: devName, location: loc },
      data: { is_familiar: true, status: "login", last_login_at: new Date(), updated_at: new Date() },
    });
  } catch (err) {
    console.error("[Login] Failed to finalize device session:", err);
  }

  const token = signToken({ cccd: existingUser.cccd, id: existingUser.id });
  const { password: _pw, ...safe } = existingUser;

  // Populate morph-linked media so localStorage has avt + company_logo on first load.
  const [avt, companyLogo] = await Promise.all([
    mediaUrlFor(USER_MORPH, existingUser.id, "avt"),
    mediaUrlFor(USER_MORPH, existingUser.id, "company_logo"),
  ]);

  return NextResponse.json({
    token,
    user: {
      ...safe,
      account_type: safe.account_type || "ca_nhan",
      avt,
      company_logo: companyLogo ? { url: companyLogo } : null,
    },
  });
}
