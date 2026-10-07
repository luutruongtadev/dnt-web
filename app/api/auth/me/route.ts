import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";

// Faithful port of Strapi GET /auth/me — Bearer token → user by cccd, password stripped.
export async function GET(req: Request) {
  const token = bearer(req);
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.up_users.findFirst({ where: { cccd: decoded.cccd } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password: _pw, ...safe } = user;
  return NextResponse.json({ ...safe, account_type: safe.account_type || "ca_nhan" });
}
