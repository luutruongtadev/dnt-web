import { createLiveBid } from "@/lib/services/product-live";
import { optionalUser } from "@/lib/auth/optional-user";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

const BID_ERRORS: Record<string, string> = {
  "item-required": "Product item is required",
  "invalid-amounts": "Quantity and unit price must be greater than 0",
};

// POST /products/:id/live-session/bids (ported from product-live.createLiveBid).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const raw = (await req.json().catch(() => ({}))) ?? {};
    const body = (raw.data ?? raw) as Record<string, unknown>;
    const user = await optionalUser(req);
    const result = await createLiveBid((await ctx.params).id, body, user);
    if ("error" in result) {
      if (result.error === "not-found") return jsonBig({ error: { message: "Product not found" } }, { status: 404 });
      return jsonBig({ error: { message: BID_ERRORS[result.error as string] } }, { status: 400 });
    }
    return jsonBig({ data: result });
  } catch (e) {
    return jsonBig({ error: { message: "Error creating live bid", details: (e as Error).message } }, { status: 400 });
  }
}
