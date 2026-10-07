import { NextResponse } from "next/server";
import { meId } from "@/lib/services/chat";
import { incoming } from "@/lib/services/friend-request";

// GET /friend-requests/incoming — pending requests sent to me.
export async function GET(req: Request) {
  let me: number;
  try { me = meId(req); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 401 }); }
  return NextResponse.json(await incoming(me));
}
