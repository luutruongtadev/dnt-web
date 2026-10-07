import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken, hashRecoveryString } from "@/lib/auth";
import { createFileEntry, linkFileMorph, mediaUrlFor } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

// Editable up_users columns (sensitive/security fields intentionally excluded).
const EDITABLE = new Set([
  "username", "email", "confirmed", "reference_id", "full_name", "mobile_number",
  "bank_number", "bank_name", "address_no", "address_on_map", "is_ctv",
  "account_type", "nation", "business_id",
]);

// Faithful port of auth.js:updateUser — PUT /auth/update (JSON body).
export async function PUT(req: Request) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.up_users.findFirst({ where: { cccd: decoded.cccd } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE.has(k) && v !== undefined) data[k] = v;
  }
  if (body.recovery_string) {
    data.recovery_string = await hashRecoveryString(String(body.recovery_string));
  }

  // Avatar: legacy URL string → create file entry + morph link.
  if (typeof body.avt === "string" && body.avt) {
    const file = await createFileEntry(body.avt);
    if (file) await linkFileMorph(file.id, USER_MORPH, user.id, "avt");
  }

  const updated = await prisma.up_users.update({ where: { id: user.id }, data: { ...data, updated_at: new Date() } });
  const { password: _pw, ...safe } = updated;
  return NextResponse.json({ ...safe, avt: await mediaUrlFor(USER_MORPH, user.id, "avt") });
}
