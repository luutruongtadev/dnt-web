import { NextRequest, NextResponse } from "next/server";
import { meId, assertParticipant, markConversationRead, getMessages, fetchFormattedConversations } from "@/lib/services/chat";
import { incoming } from "@/lib/services/friend-request";

// GET /conversations/sync — combined poll (ported from conversation.sync).
export async function GET(req: NextRequest) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }

  const active = req.nextUrl.searchParams.get("activeConversationId");
  const sinceMessageId = req.nextUrl.searchParams.get("sinceMessageId");

  try {
    let messages: unknown[] = [];
    if (active) {
      const cid = Number(active);
      await assertParticipant(cid, me);
      await markConversationRead(cid, me);
      const sinceId = sinceMessageId && !isNaN(Number(sinceMessageId)) ? Number(sinceMessageId) : undefined;
      messages = await getMessages(cid, sinceId, 50);
    }
    const [conversations, incomingRequests] = await Promise.all([
      fetchFormattedConversations(me),
      incoming(me),
    ]);
    return NextResponse.json({ conversations, incoming_friend_requests: incomingRequests, messages });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
