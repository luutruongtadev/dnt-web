import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken, verifyPassword, hashRecoveryString } from "@/lib/auth";

// Faithful port of auth.js:setRecoveryString — POST /auth/set-recovery-string.
export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const { currentPassword, recoveryString } = (await req.json().catch(() => ({}))) ?? {};
  if (!currentPassword || !recoveryString) {
    return NextResponse.json({ error: "currentPassword and recoveryString are required" }, { status: 400 });
  }
  if (recoveryString.length < 3) {
    return NextResponse.json({ error: "Recovery string must be at least 3 characters long" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.up_users.findFirst({ where: { cccd: decoded.cccd } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!(await verifyPassword(currentPassword, user.password))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await prisma.up_users.update({
    where: { id: user.id },
    data: { recovery_string: await hashRecoveryString(recoveryString) },
  });
  return NextResponse.json({ success: true, message: "Recovery string has been set successfully" });
}
