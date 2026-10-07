import { prisma } from "@/lib/db/prisma";
import { genDocumentId } from "@/lib/services/user-wallet";

// Faithful port of common/files-utils.js:createFileEntry — stores a files row
// from a URL (e.g. Cloudinary/Supabase upload already done client-side).
export async function createFileEntry(
  url: string | null | undefined,
  options: Partial<{ name: string; provider: string; mime: string; size: number; hash: string; ext: string }> = {}
) {
  if (!url) return null;
  const name = options.name || `file-${Date.now()}`;
  try {
    return await prisma.files.create({
      data: {
        document_id: genDocumentId(),
        name,
        url,
        provider: options.provider || "supabase",
        mime: options.mime || "image/jpeg",
        size: options.size ?? 0,
        hash: options.hash || name,
        ext: options.ext || ".jpg",
        folder_path: "/",
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  } catch (e) {
    console.error("createFileEntry error:", e);
    return null;
  }
}

// Link a files row to an entry via Strapi's polymorphic media morph.
export async function linkFileMorph(fileId: number, relatedType: string, relatedId: number, field: string) {
  await prisma.files_related_mph.create({
    data: { file_id: fileId, related_id: relatedId, related_type: relatedType, field, order: 1 },
  });
}

// Resolve a media field's file URL for an entry (e.g. a user's avatar).
export async function mediaUrlFor(relatedType: string, relatedId: number, field: string): Promise<string | null> {
  const link = await prisma.files_related_mph.findFirst({
    where: { related_type: relatedType, related_id: relatedId, field },
    include: { files: true },
    orderBy: { order: "asc" },
  });
  return link?.files?.url ?? null;
}
