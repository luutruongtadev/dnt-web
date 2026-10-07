import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer, bearer } from "@/lib/auth";

// Faithful port of auth.js:updateCurrentAddress — POST /auth/update-address.
export async function POST(req: Request) {
  if (!bearer(req)) return NextResponse.json({ error: "No token provided" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { address_no, address_on_map, otp } = (await req.json().catch(() => ({}))) ?? {};
  if (!otp) return NextResponse.json({ error: "otp is required" }, { status: 400 });
  if (address_no === undefined && address_on_map === undefined) {
    return NextResponse.json({ error: "address_no or address_on_map is required" }, { status: 400 });
  }
  if (String(user.otp) !== String(otp)) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (address_no !== undefined) data.address_no = address_no;
  if (address_on_map !== undefined) data.address_on_map = address_on_map;
  await prisma.up_users.update({ where: { id: user.id }, data });
  return NextResponse.json({ success: true, message: "Current address updated successfully", data });
}
