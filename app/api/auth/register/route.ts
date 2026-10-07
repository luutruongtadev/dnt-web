import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, hashRecoveryString, signToken } from "@/lib/auth";
import { ensureUserWallet, genDocumentId } from "@/lib/services/user-wallet";
import { createFileEntry, linkFileMorph } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

// Faithful port of auth.js:register — POST /auth/register.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) ?? {};
  const {
    username, email, password, cccd, reference_id, full_name, mobile_number,
    bank_number, bank_name, address_no, address_on_map, avt, signature,
    recovery_string, recovery_character, otp, account_type, nation,
  } = body;

  if (!password || !cccd) {
    return NextResponse.json({ error: "Missing required fields: password and cccd are required" }, { status: 400 });
  }

  const existingUser = await prisma.up_users.findFirst({ where: { cccd } });
  if (existingUser) {
    return NextResponse.json({ error: "CCCD already exists" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const recoveryValue = recovery_string || recovery_character;
  const hashedRecoveryString = recoveryValue ? await hashRecoveryString(recoveryValue) : null;

  // confirmed depends on system config user_approve_mode (default 'manual mode')
  const sysConfig = await prisma.system_configurations.findFirst({ orderBy: { id: "asc" } });
  const userApproveMode = sysConfig?.user_approve_mode || "manual mode";
  const confirmed = userApproveMode === "manual mode" ? false : true;

  const authenticatedRole = await prisma.up_roles.findFirst({ where: { type: "authenticated" } });

  const avatarFile = await createFileEntry(avt);
  const signatureFile = await createFileEntry(signature);

  const user = await prisma.up_users.create({
    data: {
      document_id: genDocumentId(),
      username, email, password: hashedPassword, cccd, reference_id, full_name,
      mobile_number, bank_number, bank_name, address_no, address_on_map,
      confirmed,
      recovery_string: hashedRecoveryString,
      login_failure_count: 0,
      recovery_failure_count: 0,
      otp: otp ? String(otp) : "123456",
      account_type: account_type || "ca_nhan",
      nation: nation || "Vietnam",
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Links: role, avatar, signature, wallet
  if (authenticatedRole) {
    await prisma.up_users_role_lnk.create({ data: { user_id: user.id, role_id: authenticatedRole.id } });
  }
  if (avatarFile) await linkFileMorph(avatarFile.id, USER_MORPH, user.id, "avt");
  if (signatureFile) await linkFileMorph(signatureFile.id, USER_MORPH, user.id, "signature");
  await ensureUserWallet(user);

  const token = signToken({ id: user.id, cccd: user.cccd });
  const { password: _pw, ...safe } = user;
  const userWithAvatar = { ...safe, avt: avatarFile?.url ?? null };
  return NextResponse.json({ jwt: token, user: userWithAvatar });
}
