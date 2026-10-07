import { prisma } from "@/lib/db/prisma";
import { toStrapi } from "@/lib/api/rest";
import { mediaByRelatedId } from "@/lib/api/media";
import { updateProductFromBody, deleteProductById } from "@/lib/api/product-write";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  return new Response(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

// Product detail (was Strapi GET /products/:id?populate=*). Accepts either a
// Strapi documentId (default in Strapi 5 URLs) or a numeric id, and populates
// pictures, poster (up_users), product_items and videos.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const isNumeric = /^\d+$/.test(id);

  const product = await prisma.products.findFirst({
    where: isNumeric ? { id: Number(id) } : { document_id: id },
    include: {
      products_poster_lnk: { include: { up_users: true } },
      product_items_product_lnk: { include: { product_items: true } },
      videos_product_lnk: { include: { videos: true } },
    },
  });

  if (!product) {
    return jsonBig({ data: null, error: { status: 404, message: "Not found" } }, { status: 404 });
  }

  const pics = await mediaByRelatedId("product.product", [product.id]);
  const poster = product.products_poster_lnk[0]?.up_users ?? null;

  const {
    products_poster_lnk,
    product_items_product_lnk,
    videos_product_lnk,
    ...scalar
  } = product;

  const data = {
    ...toStrapi(scalar as unknown as Record<string, unknown>),
    pictures: pics.get(product.id) ?? [],
    poster: poster
      ? { id: poster.id, documentId: poster.document_id, username: poster.username, cccd: poster.cccd }
      : null,
    product_items: product_items_product_lnk
      .map((l) => l.product_items)
      .filter(Boolean)
      .map((pi) => toStrapi(pi as unknown as Record<string, unknown>)),
    videos: videos_product_lnk
      .map((l) => l.videos)
      .filter(Boolean)
      .map((v) => toStrapi(v as unknown as Record<string, unknown>)),
  };

  return jsonBig({ data });
}

// PUT /products/:id — update (ported from product controller update).
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const updated = await updateProductFromBody(req, id);
  if (!updated) return jsonBig({ data: null, error: { status: 404, message: "Not found" } }, { status: 404 });
  return jsonBig({ data: toStrapi(updated as unknown as Record<string, unknown>) });
}

// DELETE /products/:id — delete (link tables cascade in the DB).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const deleted = await deleteProductById(id);
  if (!deleted) return jsonBig({ data: null, error: { status: 404, message: "Not found" } }, { status: 404 });
  return jsonBig({ data: toStrapi(deleted as unknown as Record<string, unknown>) });
}
