import { NextResponse } from "next/server";
import { meId, totalUnread } from "@/lib/services/chat";

// GET /conversations/unread-count (ported from conversation.getUnreadCount).
export async function GET(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }
  return NextResponse.json({ count: await totalUnread(me) });
}
