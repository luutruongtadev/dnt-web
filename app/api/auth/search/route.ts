import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { mediaUrlFor } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

// Faithful port of auth.js:searchByCCCD — GET /auth/search?cccd=...
export async function GET(req: NextRequest) {
  const cccd = req.nextUrl.searchParams.get("cccd");
  if (!cccd) return NextResponse.json({ error: "CCCD number is required" }, { status: 400 });

  const user = await prisma.up_users.findFirst({ where: { cccd } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { password: _pw, reset_password_token: _r, confirmation_token: _c, ...safe } = user;
  return NextResponse.json({ ...safe, avt: await mediaUrlFor(USER_MORPH, user.id, "avt") });
}
