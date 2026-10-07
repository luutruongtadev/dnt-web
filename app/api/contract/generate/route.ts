import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const COLLATERAL_MORPH = "api::collateral.collateral";

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download template (${res.status}): ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function getCollateralTemplateBuffer(data: Record<string, unknown>): Promise<Buffer> {
  let collateral: { id: number } | null = null;

  if (data.collateralCode) {
    collateral = await prisma.collaterals.findFirst({ where: { code: String(data.collateralCode) } });
  } else {
    const raw = data.collateral ?? data.collateralId ?? data.collateral_id;
    const id =
      typeof raw === "object" && raw !== null && "id" in (raw as object)
        ? Number((raw as { id: unknown }).id)
        : Number(raw);
    if (!id || isNaN(id)) throw new Error("collateral ID or collateralCode is missing from data");
    collateral = await prisma.collaterals.findFirst({ where: { id } });
  }

  if (!collateral) throw new Error("Collateral not found");

  const link = await prisma.files_related_mph.findFirst({
    where: { related_type: COLLATERAL_MORPH, related_id: collateral.id },
    include: { files: true },
    orderBy: { order: "asc" },
  });

  const fileUrl = link?.files?.url;
  if (!fileUrl) throw new Error("Collateral template file not found");

  return downloadBuffer(fileUrl);
}

// Port of contract.generate — POST /contract/generate.
// Public (no auth). Body is the template variables; also needs collateralCode or collateral ID.
// Returns application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx).
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const contentBuffer = await getCollateralTemplateBuffer(body);

    const zip = new PizZip(contentBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(body);

    const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(buf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="contract.docx"',
      },
    });
  } catch (err) {
    console.error("[contract/generate]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
