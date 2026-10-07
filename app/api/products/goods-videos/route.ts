import { NextRequest } from "next/server";
import { listGoodsWithVideos } from "@/lib/services/product-live";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

// GET /products/goods-videos (ported from product-live.listGoodsWithVideos).
export async function GET(req: NextRequest) {
  try {
    return jsonBig(await listGoodsWithVideos(req.nextUrl.searchParams));
  } catch (e) {
    return jsonBig({ error: { message: "Error fetching goods videos", details: (e as Error).message } }, { status: 400 });
  }
}
