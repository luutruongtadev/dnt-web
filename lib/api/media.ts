import { prisma } from "@/lib/db/prisma";

// Maps a Strapi `files` row into the shape the frontend expects from media.
export function fileToStrapi(f: Record<string, unknown>) {
  return {
    id: f.id,
    documentId: f.document_id,
    name: f.name,
    alternativeText: f.alternative_text,
    caption: f.caption,
    width: f.width,
    height: f.height,
    formats: f.formats,
    hash: f.hash,
    ext: f.ext,
    mime: f.mime,
    size: f.size,
    url: f.url,
    previewUrl: f.preview_url,
    provider: f.provider,
  };
}

// Returns a Map<relatedId, file[]> for a Strapi media morph relation.
// `typeContains` discriminates the content type (e.g. "product.product" to avoid
// matching "product-item.product-item"). Populates a whole page of rows in one query.
export async function mediaByRelatedId(typeContains: string, ids: number[]) {
  const map = new Map<number, ReturnType<typeof fileToStrapi>[]>();
  if (ids.length === 0) return map;
  const links = await prisma.files_related_mph.findMany({
    where: { related_id: { in: ids }, related_type: { contains: typeContains } },
    include: { files: true },
    orderBy: { order: "asc" },
  });
  for (const link of links) {
    if (link.related_id == null || !link.files) continue;
    const arr = map.get(link.related_id) ?? [];
    arr.push(fileToStrapi(link.files as unknown as Record<string, unknown>));
    map.set(link.related_id, arr);
  }
  return map;
}
