import { prisma } from "@/lib/db/prisma";
import { toStrapi } from "@/lib/api/rest";
import { routeWhere } from "@/lib/services/product-live";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

// POST /products/:id/pic (ported from custom-controller.updateProductPic).
// The original "updates" setPrice/depositRequirement, but neither is a product
// attribute in the Strapi schema, so Strapi dropped them and returned the entry
// unchanged. Faithfully a no-op that echoes the current product.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const product = await prisma.products.findFirst({ where: routeWhere((await ctx.params).id) });
    if (!product) return jsonBig({ error: { message: "Product not found" } }, { status: 404 });
    return jsonBig(toStrapi(product as unknown as Record<string, unknown>));
  } catch (e) {
    return jsonBig({ error: { message: "Error updating product price", details: (e as Error).message } }, { status: 400 });
  }
}
