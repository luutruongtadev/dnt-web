import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";

const ACTIVE_ONLINE_WINDOW_MS = 60 * 1000;
const PRESENCE_RETENTION_MS = 24 * 60 * 60 * 1000;

function tokenUserId(req: Request): number | null {
  const t = bearer(req);
  if (!t) return null;
  try {
    return verifyToken(t).id ?? null;
  } catch {
    return null;
  }
}

async function onlineCount(): Promise<number> {
  const activeSince = new Date(Date.now() - ACTIVE_ONLINE_WINDOW_MS);
  const rows = await prisma.site_presences.findMany({
    where: { last_seen_at: { gte: activeSince } },
    distinct: ["session_id"],
    select: { session_id: true },
  });
  return rows.length;
}

// Faithful port of api/alive + common/services/system-metrics.js:recordAlive.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) ?? {};
  const sessionId: string | undefined = body.sessionId || req.nextUrl.searchParams.get("sessionId") || undefined;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const now = new Date();
  const data = {
    user_id: tokenUserId(req),
    ip_address: (req.headers.get("x-forwarded-for") || "").slice(0, 120) || null,
    user_agent: (req.headers.get("user-agent") || "").slice(0, 1000) || null,
    path: (body.path || req.nextUrl.searchParams.get("path") || "")?.toString().slice(0, 255) || null,
    last_seen_at: now,
    updated_at: now,
  };

  await prisma.site_presences.upsert({
    where: { session_id: sessionId.slice(0, 120) },
    update: data,
    create: { session_id: sessionId.slice(0, 120), ...data, created_at: now },
  });

  await prisma.site_presences.deleteMany({
    where: { last_seen_at: { lt: new Date(Date.now() - PRESENCE_RETENTION_MS) } },
  });

  return NextResponse.json({ data: { ok: true, online: await onlineCount() } });
}

export async function GET() {
  return NextResponse.json({ data: { ok: true, online: await onlineCount() } });
}
