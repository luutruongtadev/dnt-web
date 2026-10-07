import { getLiveSession } from "@/lib/services/product-live";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

// GET /products/:id/live-session (ported from product-live.getLiveSession).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getLiveSession((await ctx.params).id);
    if (!session) return jsonBig({ error: { message: "Product not found" } }, { status: 404 });
    return jsonBig({ data: session });
  } catch (e) {
    return jsonBig({ error: { message: "Error fetching live session", details: (e as Error).message } }, { status: 400 });
  }
}
