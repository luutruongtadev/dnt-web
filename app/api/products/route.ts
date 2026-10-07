import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { toStrapi } from "@/lib/api/rest";
import { mediaByRelatedId } from "@/lib/api/media";
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
  const pics = await mediaByRelatedId("product.product", ids);

  const data = rows.map((r) => ({
    ...toStrapi(r as unknown as Record<string, unknown>),
    pictures: pics.get(r.id) ?? [],
  }));

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
