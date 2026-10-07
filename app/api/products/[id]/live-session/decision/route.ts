import { decideLiveBid } from "@/lib/services/product-live";
import { optionalUser } from "@/lib/auth/optional-user";

function json(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

const ERRORS: Record<string, [number, string]> = {
  "not-found": [404, "Product not found"],
  "bid-not-found": [404, "Bid not found"],
  "forbidden": [403, "Only the poster can decide a bid"],
  "invalid-decision": [400, "Decision must be accepted or rejected"],
};

// POST /products/:id/live-session/decision { bidId, decision }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const raw = (await req.json().catch(() => ({}))) ?? {};
    const body = (raw.data ?? raw) as Record<string, unknown>;
    const user = await optionalUser(req);
    const result = await decideLiveBid((await ctx.params).id, String(body.bidId ?? ""), String(body.decision ?? ""), user);
    if ("error" in result) {
      const [status, message] = ERRORS[result.error as string];
      return json({ error: { message } }, { status });
    }
    return json({ data: result });
  } catch (e) {
    return json({ error: { message: "Error deciding live bid", details: (e as Error).message } }, { status: 400 });
  }
}
