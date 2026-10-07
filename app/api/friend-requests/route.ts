import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";
import { meId } from "@/lib/services/chat";
import { createRequest } from "@/lib/services/friend-request";

export const GET = listHandler(prisma.friend_requests);

// POST /friend-requests { toUserId } (ported from friend-request.create).
export async function POST(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }

  const body = (await req.json().catch(() => ({}))) ?? {};
  const toUserId = parseInt(body?.toUserId, 10);
  if (!toUserId || isNaN(toUserId)) return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
  if (toUserId === me) return NextResponse.json({ error: "Cannot send a friend request to yourself" }, { status: 400 });

  const target = await prisma.up_users.findFirst({ where: { id: toUserId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

  try {
    const request = await createRequest(me, toUserId);
    return NextResponse.json(request);
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
