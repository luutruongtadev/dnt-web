import { joinLiveSession } from "@/lib/services/product-live";
import { optionalUser } from "@/lib/auth/optional-user";

function jsonBig(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  return new Response(body, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

// POST /products/:id/live-session/join (ported from product-live.joinLiveSession).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const raw = (await req.json().catch(() => ({}))) ?? {};
    const body = (raw.data ?? raw) as Record<string, unknown>;
    const user = await optionalUser(req);
    const session = await joinLiveSession((await ctx.params).id, body, user);
    if (!session) return jsonBig({ error: { message: "Product not found" } }, { status: 404 });
    return jsonBig({ data: session });
  } catch (e) {
    return jsonBig({ error: { message: "Error joining live session", details: (e as Error).message } }, { status: 400 });
  }
}
