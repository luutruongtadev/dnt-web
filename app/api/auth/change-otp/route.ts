import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer, bearer } from "@/lib/auth";

// Faithful port of auth.js:changeOtp — POST /auth/change-otp.
export async function POST(req: Request) {
  if (!bearer(req)) return NextResponse.json({ error: "No token provided" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { otp } = (await req.json().catch(() => ({}))) ?? {};
  if (!otp) return NextResponse.json({ error: "otp is required" }, { status: 400 });

  await prisma.up_users.update({ where: { id: user.id }, data: { otp: String(otp) } });
  return NextResponse.json({ success: true, message: "OTP updated successfully" });
}
