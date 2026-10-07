import { NextResponse } from "next/server";
import { meId, fetchFormattedConversations, createConversation } from "@/lib/services/chat";

// GET /conversations — my conversation list (ported from conversation.find).
export async function GET(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }
  return NextResponse.json(await fetchFormattedConversations(me));
}

// POST /conversations — start/find a 1:1 conversation (ported from conversation.create).
export async function POST(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }

  const { userId } = (await req.json().catch(() => ({}))) ?? {};
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const target = parseInt(userId, 10);
  if (isNaN(target)) return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
  if (target === me) return NextResponse.json({ error: "Cannot start conversation with yourself" }, { status: 400 });

  return NextResponse.json(await createConversation(me, target));
}
