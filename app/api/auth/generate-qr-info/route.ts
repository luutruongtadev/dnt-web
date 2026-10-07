import { NextResponse } from "next/server";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer, bearer } from "@/lib/auth";
import { qrCodeStore } from "@/lib/auth/qr-store";

const USER_MORPH = "plugin::users-permissions.user";

// Faithful port of auth.js:generateQRinfo — POST /auth/generate-qr-info (authed).
export async function POST(req: Request) {
  if (!bearer(req)) return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  if (!user.cccd) return NextResponse.json({ error: "User missing required field: cccd" }, { status: 400 });

  const avatarLink = await prisma.files_related_mph.findFirst({
    where: { related_type: USER_MORPH, related_id: user.id, field: "avt" },
    include: { files: true },
  });
  const avatar = avatarLink?.files?.url || "";

  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();
  const appUrl = process.env.MOBILE_APP_URL || "myapp://login";
  const qrData = { sessionId, timestamp, type: "mobile_login", appUrl, avatar, stk: user.cccd, userId: user.id };

  qrCodeStore.set(sessionId, { ...qrData, status: "pending", expiresAt: timestamp + 5 * 60 * 1000 });

  const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));
  return NextResponse.json({ sessionId, qrCode: qrCodeImage, avatar: avatar || null, stk: user.cccd, expiresIn: 300 });
}
