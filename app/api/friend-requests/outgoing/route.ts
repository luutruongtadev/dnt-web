import { NextResponse } from "next/server";
import { meId } from "@/lib/services/chat";
import { outgoing } from "@/lib/services/friend-request";

// GET /friend-requests/outgoing — pending requests I sent.
export async function GET(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }
  return NextResponse.json(await outgoing(me));
}
