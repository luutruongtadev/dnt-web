import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken, hashRecoveryString } from "@/lib/auth";
import { createFileEntry, linkFileMorph, mediaUrlFor } from "@/lib/services/files";
import { uploadFileToStorage } from "@/lib/storage/upload";

const USER_MORPH = "plugin::users-permissions.user";

// Editable up_users columns (sensitive/security fields intentionally excluded).
const EDITABLE = new Set([
  "username", "email", "confirmed", "reference_id", "full_name", "mobile_number",
  "bank_number", "bank_name", "address_no", "address_on_map", "is_ctv",
  "account_type", "nation", "business_id",
]);

// Faithful port of auth.js:updateUser — PUT /auth/update.
// Handles both JSON body (avt as URL string) and multipart (avt as file upload).
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

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let body: Record<string, unknown> = {};
  let avtFile: File | null = null;

  if (isMultipart) {
    const formData = await req.formData().catch(() => null);
    if (formData) {
      for (const [k, v] of formData.entries()) {
        if (k === "avt" && v instanceof File) avtFile = v;
        else body[k] = v;
      }
    }
  } else {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE.has(k) && v !== undefined) data[k] = v;
  }
  if (body.recovery_string) {
    data.recovery_string = await hashRecoveryString(String(body.recovery_string));
  }

  // Avatar: multipart file → upload to storage first.
  if (avtFile) {
    try {
      const uploaded = await uploadFileToStorage(avtFile);
      // Remove any existing avt morph link so there's always exactly one.
      await prisma.files_related_mph.deleteMany({
        where: { related_type: USER_MORPH, related_id: user.id, field: "avt" },
      });
      await linkFileMorph(uploaded.id, USER_MORPH, user.id, "avt");
    } catch (err) {
      console.error("Avatar upload error:", err);
      return NextResponse.json({ error: "Avatar upload failed" }, { status: 500 });
    }
  } else if (typeof body.avt === "string" && body.avt) {
    // Legacy: avt is a URL string (client-side upload already done, e.g. Cloudinary).
    const file = await createFileEntry(body.avt);
    if (file) {
      await prisma.files_related_mph.deleteMany({
        where: { related_type: USER_MORPH, related_id: user.id, field: "avt" },
      });
      await linkFileMorph(file.id, USER_MORPH, user.id, "avt");
    }
  }

  const updated = await prisma.up_users.update({ where: { id: user.id }, data: { ...data, updated_at: new Date() } });
  const { password: _pw, ...safe } = updated;
  const avt = await mediaUrlFor(USER_MORPH, user.id, "avt");
  return NextResponse.json({ ...safe, avt });
}
