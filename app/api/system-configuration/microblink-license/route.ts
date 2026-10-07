import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

const getLicenseKey = unstable_cache(
  async () => {
    const row = await prisma.system_configurations.findFirst({
      select: { microblink_license_key: true },
      orderBy: { id: "asc" },
    });
    return row?.microblink_license_key?.trim() ?? null;
  },
  ["system-configuration:microblink-license"],
  { revalidate: 300, tags: ["system-configuration"] }
);

// Public — no auth required (mirrors Strapi auth: false).
// Returns licenseKey as empty string when not configured (avoids 404 crashing the scanner init).
export async function GET() {
  const licenseKey = await getLicenseKey();
  return NextResponse.json(
    { success: true, data: { licenseKey: licenseKey ?? "" } },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1200" } }
  );
}
