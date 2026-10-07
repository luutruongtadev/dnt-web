import { NextResponse } from "next/server";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { qrCodeStore } from "@/lib/auth/qr-store";

// Faithful port of auth.js:generateQR — POST /auth/generate-qr.
export async function POST() {
  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();
  const appUrl = process.env.MOBILE_APP_URL || "myapp://login";

  qrCodeStore.set(sessionId, {
    sessionId, timestamp, type: "mobile_login", appUrl,
    status: "pending", expiresAt: timestamp + 5 * 60 * 1000,
  });

  const qrCodeUrl = `${appUrl}/login?sessionId=${sessionId}&timestamp=${timestamp}`;
  const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
  return NextResponse.json({ sessionId, qrCode: qrCodeImage, expiresIn: 300 });
}
