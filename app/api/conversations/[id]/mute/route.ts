import { NextResponse } from "next/server";
import { meId, assertParticipant, isMuted, setConvFlag } from "@/lib/services/chat";

// POST /conversations/:id/mute — toggle mute for me (ported from conversation.mute).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    const currentlyMuted = await isMuted(cid, me);
    await setConvFlag("muted", cid, me, !currentlyMuted);
    return NextResponse.json({ success: true, muted: !currentlyMuted });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
  }
}
