import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { meId, assertParticipant, getMessages, createMessage, clearMessages } from "@/lib/services/chat";

function fail(e: unknown) {
  const err = e as Error & { status?: number };
  return NextResponse.json({ error: err.message }, { status: err.status ?? (err.message?.includes("token") ? 401 : 500) });
}

// GET /conversations/:id/messages (ported from conversation.getMessages).
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    const sinceRaw = req.nextUrl.searchParams.get("since");
    const sinceId = sinceRaw && !isNaN(Number(sinceRaw)) ? Number(sinceRaw) : undefined;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50;
    return NextResponse.json(await getMessages(cid, sinceId, limit));
  } catch (e) { return fail(e); }
}

// POST /conversations/:id/messages (ported from conversation.createMessage).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    const { content, type, attachmentId } = (await req.json().catch(() => ({}))) ?? {};
    const resolvedContent = content || (type === "image" ? "📷 Hình ảnh" : null);
    if (!resolvedContent) return NextResponse.json({ error: "content is required" }, { status: 400 });
    if (type === "image" && !attachmentId) return NextResponse.json({ error: "attachmentId is required for image messages" }, { status: 400 });
    await assertParticipant(cid, me);
    if (attachmentId) {
      const media = await prisma.files.findFirst({ where: { id: Number(attachmentId) } });
      if (!media) return NextResponse.json({ error: "attachmentId does not reference an existing file" }, { status: 400 });
    }
    return NextResponse.json(await createMessage(cid, me, resolvedContent, type, attachmentId ? Number(attachmentId) : undefined));
  } catch (e) { return fail(e); }
}

// DELETE /conversations/:id/messages — clear history (ported from conversation.clearMessages).
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = meId(req);
    const cid = Number((await ctx.params).id);
    await assertParticipant(cid, me);
    await clearMessages(cid);
    return NextResponse.json({ success: true });
  } catch (e) { return fail(e); }
}
