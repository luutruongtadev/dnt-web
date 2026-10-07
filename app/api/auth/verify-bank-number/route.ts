import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Faithful port of auth.js:verifyBankNumber — POST /auth/verify-bank-number.
export async function POST(req: Request) {
  const { bankNumber, bankName, accountName } = (await req.json().catch(() => ({}))) ?? {};
  if (!bankNumber || !bankName || !accountName) {
    return NextResponse.json({ error: "bankNumber, bankName, and accountName are required" }, { status: 400 });
  }
  const existing = await prisma.up_users.findFirst({ where: { bank_number: bankNumber }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ success: false, exists: true, message: "Bank number already exists" });
  }
  return NextResponse.json({ success: true, exists: false, message: "Bank number is available" });
}
