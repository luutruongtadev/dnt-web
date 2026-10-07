import { NextResponse } from "next/server";
import { meId } from "@/lib/services/chat";
import { acceptRequest } from "@/lib/services/friend-request";

// POST /friend-requests/:id/accept (ported from friend-request.accept).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const id = Number((await ctx.params).id);
    return NextResponse.json(await acceptRequest(me, id));
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
  }
}
