import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildMetricsSnapshot } from "@/lib/services/metrics";

// Port of GET /system-info/metrics (system-info.getMetrics → refreshSystemMetrics).
export async function GET() {
  try {
    const metrics = await buildMetricsSnapshot();
    return NextResponse.json({ data: metrics });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Port of POST /system-info/metrics (system-info.updateMetrics) — persists the
// editable fields (duration/latestBank/hasExpiry) then returns a fresh snapshot.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) ?? {};
    const payload = body.data ?? body;
    const existing = await prisma.system_infos.findFirst({ orderBy: { id: "asc" } });
    const data = {
      duration: payload.duration ?? existing?.duration ?? 0,
      latest_bank: payload.latestBank ?? existing?.latest_bank ?? "",
      has_expiry: payload.hasExpiry ?? existing?.has_expiry ?? false,
      last_updated: new Date(),
      updated_at: new Date(),
    };
    if (existing) {
      await prisma.system_infos.update({ where: { id: existing.id }, data });
    } else {
      await prisma.system_infos.create({ data: { ...data, created_at: new Date(), published_at: new Date() } });
    }
    return NextResponse.json({ data: await buildMetricsSnapshot() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
