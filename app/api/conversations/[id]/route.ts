import { NextResponse } from "next/server";
import { meId, assertParticipant, removeConversation } from "@/lib/services/chat";

// DELETE /conversations/:id — "Xóa tên": delete convo + messages (ported from
// conversation.removeContact). Friend-request cleanup TODO when that module lands.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    const removedUserId = await removeConversation(cid, me);
    return NextResponse.json({ success: true, removedUserId });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
  }
}
