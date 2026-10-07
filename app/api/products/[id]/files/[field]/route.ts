import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { uploadFileToStorage } from "@/lib/storage/upload";
import { linkFileMorph } from "@/lib/services/files";

const PRODUCT_MORPH = "api::product.product";
const PRODUCT_FILE_FIELDS = new Set([
  "videoFile", "livestreamVideoFile", "livestreamCertFile", "advertisingVideoFile",
  "advertisingCertFile", "regLivestreamProductProfile", "regLivestreamCertFile",
  "regProductAdCompanyProfile", "regProductAdCertFile", "regPersonalBrandProductProfile",
  "regPersonalBrandCertFile",
]);

// Port of product uploadFile (POST /products/:id/files/:field): uploads a file,
// links it to the product's media field via the morph. Accepts numeric id or
// documentId. (Images typically go straight to Cloudinary client-side instead.)
export async function POST(req: Request, ctx: { params: Promise<{ id: string; field: string }> }) {
  const { id, field } = await ctx.params;
  if (!PRODUCT_FILE_FIELDS.has(field)) {
    return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
  }

  const product = /^\d+$/.test(id)
    ? await prisma.products.findFirst({ where: { id: Number(id) } })
    : await prisma.products.findFirst({ where: { document_id: id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  try {
    const uploaded = await uploadFileToStorage(file);
    await linkFileMorph(uploaded.id, PRODUCT_MORPH, product.id, field);
    return NextResponse.json({ data: { status: "done", fileId: uploaded.id, url: uploaded.url } });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed", details: (e as Error).message }, { status: 400 });
  }
}
