import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer } from "@/lib/auth";

const USER_DOC_MORPH = "api::user-document.user-document";

// Port of upload.getMyDocuments — GET /user-document/my.
// Returns the authenticated user's documents with their file URLs.
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.user_documents.findMany({
    where: { user_id: user.id },
    orderBy: { id: "asc" },
  });

  if (docs.length === 0) return NextResponse.json({ data: [] });

  const docIds = docs.map((d) => d.id);
  const links = await prisma.files_related_mph.findMany({
    where: { related_type: USER_DOC_MORPH, related_id: { in: docIds } },
    include: { files: true },
    orderBy: { order: "asc" },
  });

  // Group files by document id (preserving slot order for cccd front/back)
  const filesByDoc = new Map<number, { id: number; url: string | null }[]>();
  for (const link of links) {
    if (link.related_id == null) continue;
    const arr = filesByDoc.get(link.related_id) ?? [];
    arr.push({ id: link.file_id ?? 0, url: link.files?.url ?? null });
    filesByDoc.set(link.related_id, arr);
  }

  const data = docs.map((doc) => ({
    id: doc.id,
    documentId: doc.document_id,
    type: doc.type,
    user_id: doc.user_id,
    business_id: doc.business_id,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    file: filesByDoc.get(doc.id) ?? [],
  }));

  return NextResponse.json({ data });
}
