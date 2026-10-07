import { NextResponse } from "next/server";
import { meId, assertParticipant, setConvFlag } from "@/lib/services/chat";

// POST /conversations/:id/report (ported from conversation.report).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    await setConvFlag("reported", cid, me, true);
    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
  }
}
