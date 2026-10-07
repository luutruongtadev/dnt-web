import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

const getBanks = unstable_cache(
  async () => {
    const row = await prisma.system_configurations.findFirst({
      select: { banks: true },
      orderBy: { id: "asc" },
    });
    return (row?.banks ?? []) as unknown[];
  },
  ["system-configuration:banks"],
  { revalidate: 300, tags: ["system-configuration"] }
);

// Public — no auth required (mirrors Strapi auth: false).
export async function GET() {
  const banks = await getBanks();
  return NextResponse.json({ success: true, data: banks }, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1200" },
  });
}
