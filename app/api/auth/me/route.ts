import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";
import { mediaUrlFor } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

// Faithful port of Strapi GET /auth/me — Bearer token → user by cccd, password stripped.
// Populates avt (avatar) and company_logo from files_related_mph morph table,
// matching the shape Strapi returned: avt is a URL string (not an object).
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

  const [avt, companyLogo] = await Promise.all([
    mediaUrlFor(USER_MORPH, user.id, "avt"),
    mediaUrlFor(USER_MORPH, user.id, "company_logo"),
  ]);

  const { password: _pw, ...safe } = user;
  return NextResponse.json({
    ...safe,
    account_type: safe.account_type || "ca_nhan",
    avt,
    company_logo: companyLogo ? { url: companyLogo } : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
