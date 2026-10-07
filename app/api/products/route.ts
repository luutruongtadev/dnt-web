import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { toStrapi } from "@/lib/api/rest";
import { mediaByRelatedId, mediaFieldsByRelatedId } from "@/lib/api/media";
import { createProductFromBody } from "@/lib/api/product-write";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  return new Response(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

// Ported from Strapi's custom product controller. Supports the frontend's
// filterProducts params (listingType/categoryType/conditionType/nation/province/
// name) + pagination, and populates product pictures from the media morph.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "25", 10) || 25));
  const name = sp.get("name")?.trim();

  const where: Record<string, unknown> = { published_at: { not: null } };
  const eq = (param: string, col: string) => {
    const v = sp.get(param);
    if (v) where[col] = v;
  };
  eq("listingType", "listing_type");
  eq("categoryType", "category_type");
  eq("conditionType", "condition_type");
  eq("nation", "nation");
  eq("province", "province");
  if (name) {
    where.OR = [
      { custom_id: { contains: name, mode: "insensitive" } },
      { address: { contains: name, mode: "insensitive" } },
      { person_in_charge: { contains: name, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.products.count({ where }),
    prisma.products.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const ids = rows.map((r) => r.id);

  // Mirror Strapi's PRODUCT_DETAIL_POPULATE: poster + named product media fields
  // (advertisingVideoFile, videoFile, ...) + productItems each with their media.
  const [pics, prodFields, posterLinks, itemLinks] = await Promise.all([
    mediaByRelatedId("product.product", ids),
    mediaFieldsByRelatedId("product.product", ids),
    prisma.products_poster_lnk.findMany({ where: { product_id: { in: ids } }, include: { up_users: true } }),
    prisma.product_items_product_lnk.findMany({ where: { product_id: { in: ids } }, select: { product_id: true, product_item_id: true } }),
  ]);

  const posterOf = new Map<number, { id: number; documentId: string | null; username: string | null; full_name: string | null; cccd: string | null }>();
  for (const l of posterLinks) {
    if (l.product_id == null || !l.up_users) continue;
    const u = l.up_users;
    posterOf.set(l.product_id, { id: u.id, documentId: u.document_id, username: u.username, full_name: u.full_name, cccd: u.cccd });
  }

  const itemIds = itemLinks.map((l) => l.product_item_id).filter((x): x is number => x != null);
  const [itemRows, itemFields] = await Promise.all([
    itemIds.length ? prisma.product_items.findMany({ where: { id: { in: itemIds } } }) : Promise.resolve([]),
    itemIds.length ? mediaFieldsByRelatedId("product-item.product-item", itemIds) : Promise.resolve(new Map()),
  ]);
  const itemRowOf = new Map(itemRows.map((r) => [r.id, r]));
  const itemsByProduct = new Map<number, number[]>();
  for (const l of itemLinks) {
    if (l.product_id == null || l.product_item_id == null) continue;
    const arr = itemsByProduct.get(l.product_id) ?? [];
    arr.push(l.product_item_id);
    itemsByProduct.set(l.product_id, arr);
  }

  const data = rows.map((r) => {
    const productItems = (itemsByProduct.get(r.id) ?? [])
      .map((iid) => {
        const row = itemRowOf.get(iid);
        if (!row) return null;
        return { ...toStrapi(row as unknown as Record<string, unknown>), ...(itemFields.get(iid) ?? {}) };
      })
      .filter(Boolean);
    return {
      ...toStrapi(r as unknown as Record<string, unknown>),
      ...(prodFields.get(r.id) ?? {}),
      poster: posterOf.get(r.id) ?? null,
      productItems,
      pictures: pics.get(r.id) ?? [],
    };
  });

  return jsonBig({
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    },
  });
}

// Ported from product controller create() — POST /products.
export async function POST(req: NextRequest) {
  try {
    const product = await createProductFromBody(req);
    return jsonBig({ data: toStrapi(product as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    return jsonBig(
      { error: { message: "Tạo hàng hóa thất bại", details: (err as Error).message } },
      { status: 400 }
    );
  }
}
