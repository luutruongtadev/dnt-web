import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

// GET /wallets/favorite-wallets — port of wallet service:getFavoriteWallets.
// Returns wallets linked to the user via wallets_user_lnk (the "users" side of
// the many-to-many wallet↔user relation, used for favorited/linked wallets).
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const links = await prisma.wallets_user_lnk.findMany({
      where: { user_id: user.id },
      include: { wallets: { select: { id: true, cccd: true } } },
      orderBy: { wallet_ord: "asc" },
    });

    const wallets = links.flatMap(l => l.wallets ? [{ id: l.wallets.id, cccd: l.wallets.cccd }] : []);

    return NextResponse.json({ count: wallets.length, wallets });
  } catch (err) {
    console.error("Get favorite wallets error:", err);
    return NextResponse.json({ error: "An error occurred while fetching favorite wallets" }, { status: 500 });
  }
}
