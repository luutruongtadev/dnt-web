import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer } from "@/lib/auth";
import { linkFileMorph } from "@/lib/services/files";
import { uploadFileToStorage } from "@/lib/storage/upload";
import { genDocumentId } from "@/lib/services/user-wallet";

const USER_DOC_MORPH = "api::user-document.user-document";

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = Buffer.from(base64, "base64");
  return new File([binary], filename, { type: mime });
}

// POST /api/user-document/upload
// Port of upload.uploadDocument — accepts { imageBase64: dataUrl, type: string }.
// Uploads the image to Supabase Storage, upserts a user_documents row for this
// user+type, links the file via the polymorphic morph, and returns the file record.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { imageBase64?: string; type?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.imageBase64 || !body?.type) {
    return NextResponse.json({ error: "imageBase64 and type are required" }, { status: 400 });
  }

  const file = dataUrlToFile(body.imageBase64, `${body.type}-${Date.now()}.jpg`);

  let uploaded: { id: number; url: string | null; name: string | null };
  try {
    uploaded = await uploadFileToStorage(file);
  } catch (err) {
    console.error("[user-document/upload] storage error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }

  // Upsert user_documents row for this user+type (one doc record per type per user)
  const now = new Date();
  let doc = await prisma.user_documents.findFirst({
    where: { user_id: user.id, type: body.type },
  });

  if (!doc) {
    doc = await prisma.user_documents.create({
      data: {
        document_id: genDocumentId(),
        type: body.type,
        user_id: user.id,
        created_at: now,
        updated_at: now,
        published_at: now,
      },
    });
  } else {
    // Remove previous morph link for this field so only the latest image is kept
    await prisma.files_related_mph.deleteMany({
      where: { related_type: USER_DOC_MORPH, related_id: doc.id, field: body.type },
    });
    await prisma.user_documents.update({
      where: { id: doc.id },
      data: { updated_at: now },
    });
  }

  await linkFileMorph(uploaded.id, USER_DOC_MORPH, doc.id, body.type);

  return NextResponse.json({ file: { id: uploaded.id, url: uploaded.url, name: uploaded.name } });
}
