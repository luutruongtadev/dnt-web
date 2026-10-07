import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";

// Strapi documentId is a 24-char base36-ish id; good enough to generate one.
export function genDocumentId(): string {
  return crypto.randomBytes(16).toString("hex").slice(0, 24);
}

type UserLike = { id: number; cccd: string | null; full_name?: string | null; username?: string | null };

// Faithful port of common/services/user-wallet.js:ensureUserWallet.
// Creates a wallet if missing and links it both ways (up_users.wallet and
// wallets.user via Strapi's link tables). Idempotent.
export async function ensureUserWallet(user: UserLike) {
  if (!user?.id || !user?.cccd) return null;

  let wallet = await prisma.wallets.findFirst({
    where: { OR: [{ user_id: BigInt(user.id) }, { cccd: user.cccd }] },
  });

  const name = user.full_name || user.username || user.cccd;

  if (!wallet) {
    wallet = await prisma.wallets.create({
      data: {
        document_id: genDocumentId(),
        cccd: user.cccd,
        total: 0,
        account_of_goods: 0,
        account_of_freelancer: 0,
        account_of_ailive: 0,
        pending_amount: 0,
        user_id: BigInt(user.id),
        name,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // Link wallet.user (wallets_user_lnk)
  const userLnk = await prisma.wallets_user_lnk.findFirst({ where: { wallet_id: wallet.id, user_id: user.id } });
  if (!userLnk) {
    await prisma.wallets_user_lnk.create({ data: { wallet_id: wallet.id, user_id: user.id } });
  }

  // Link up_users.wallet (up_users_wallet_lnk)
  const upLnk = await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id, wallet_id: wallet.id } });
  if (!upLnk) {
    await prisma.up_users_wallet_lnk.create({ data: { user_id: user.id, wallet_id: wallet.id } });
  }

  return wallet;
}
