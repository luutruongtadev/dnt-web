import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth";
import { ensureUserWallet } from "@/lib/services/user-wallet";

// Faithful port of auth.js:changePassword — POST /auth/change-password.
// Note: identifies the user by cccd in the body (no token), as in Strapi.
export async function POST(req: Request) {
  const { cccd, new_password, confirm_password } = (await req.json().catch(() => ({}))) ?? {};
  if (!cccd || !new_password || !confirm_password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (new_password !== confirm_password) {
    return NextResponse.json({ error: "New password and confirm password do not match" }, { status: 400 });
  }

  const user = await prisma.up_users.findFirst({ where: { cccd } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.up_users.update({
    where: { id: user.id },
    data: { password: await hashPassword(new_password), confirmed: true },
  });
  await ensureUserWallet(user);
  return NextResponse.json({ message: "Password updated successfully" });
}
