import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getWalletLedger } from "@/lib/services/wallet-ledger";

// GET /wallets/my-ledger?limit=&offset= — port of getLedgerFromToken.
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = searchParams.get("limit")  ?? undefined;
  const offset = searchParams.get("offset") ?? undefined;

  try {
    const link = await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id } });
    if (!link?.wallet_id) return NextResponse.json({ error: "User does not have a wallet" }, { status: 404 });

    const entries = await getWalletLedger(link.wallet_id, { limit: Number(limit), offset: Number(offset) });
    return NextResponse.json({ walletId: link.wallet_id, count: entries.length, entries });
  } catch (err) {
    console.error("Get wallet ledger error:", err);
    return NextResponse.json({ error: "An error occurred while fetching wallet ledger" }, { status: 500 });
  }
}
