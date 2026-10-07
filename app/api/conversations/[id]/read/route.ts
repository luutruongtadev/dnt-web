import { NextResponse } from "next/server";
import { meId, assertParticipant, markConversationRead } from "@/lib/services/chat";

// POST /conversations/:id/read (ported from conversation.markAsRead).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    const updated = await markConversationRead(cid, me);
    return NextResponse.json({ success: true, updated });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
  }
}
