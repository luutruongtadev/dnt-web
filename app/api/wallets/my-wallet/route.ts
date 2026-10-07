import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ensureUserWallet } from "@/lib/services/user-wallet";

// GET /wallets/my-wallet — faithful port of wallet service:getWalletFromToken.
// Looks up the user's wallet via the up_users_wallet_lnk join table;
// if none exists, creates one via ensureUserWallet.
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const link = await prisma.up_users_wallet_lnk.findFirst({
      where: { user_id: user.id },
      include: { wallets: true },
    });

    if (!link?.wallets) {
      const wallet = await ensureUserWallet(user);
      return NextResponse.json(wallet);
    }

    return NextResponse.json(link.wallets);
  } catch (err) {
    if ((err as Error).message === "User not found") return NextResponse.json({ error: "User not found" }, { status: 404 });
    console.error("Get wallet error:", err);
    return NextResponse.json({ error: "An error occurred while fetching wallet information" }, { status: 500 });
  }
}
