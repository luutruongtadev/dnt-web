import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const COLLATERAL_MORPH = "api::collateral.collateral";

// Port of collateral.downloadByCode — GET /collaterals/download/:code.
// Returns { code, files: [url, ...] } for all media linked to the collateral.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;

  const collateral = await prisma.collaterals.findFirst({ where: { code } });
  if (!collateral) {
    return NextResponse.json({ error: "Collateral not found" }, { status: 404 });
  }

  const links = await prisma.files_related_mph.findMany({
    where: { related_type: COLLATERAL_MORPH, related_id: collateral.id },
    include: { files: true },
    orderBy: { order: "asc" },
  });

  const files = links
    .map((l) => l.files?.url)
    .filter((u): u is string => typeof u === "string");

  return NextResponse.json({ code, files });
}
