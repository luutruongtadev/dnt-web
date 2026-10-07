import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// Postgres int8 columns surface as JS BigInt, which JSON.stringify can't handle.
// Emit them as strings (same as Strapi's own REST output).
function jsonResponse(payload: unknown, init?: ResponseInit) {
  const body = JSON.stringify(payload, (_k, v) =>
    typeof v === "bigint" ? v.toString() : v
  );
  return new NextResponse(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

// Shapes a raw Prisma row (snake_case Strapi table) into the attribute shape the
// Strapi REST client/frontend expects: documentId + camelCase timestamps, with
// internal audit/locale columns dropped. Other scalar/JSON columns pass through.
export function toStrapi(row: Record<string, unknown>) {
  const {
    document_id,
    created_at,
    updated_at,
    published_at,
    created_by_id: _c,
    updated_by_id: _u,
    locale: _l,
    ...rest
  } = row;
  return {
    ...rest,
    documentId: document_id,
    createdAt: created_at,
    updatedAt: updated_at,
    publishedAt: published_at,
  };
}

// Accepts any Prisma model delegate (their generic arg types don't unify with a
// strict structural type, so we intentionally widen the query args here).
/* eslint-disable @typescript-eslint/no-explicit-any */
type Delegate = {
  findMany: (args?: any) => Promise<Record<string, unknown>[]>;
  findFirst: (args?: any) => Promise<Record<string, unknown> | null>;
  create: (args?: any) => Promise<Record<string, unknown>>;
  update: (args?: any) => Promise<Record<string, unknown>>;
  delete: (args?: any) => Promise<Record<string, unknown>>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function genDocId() {
  // 24 hex chars — Strapi-ish documentId
  return Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

// Factory for a read-only Strapi-style collection GET.
// `published: false` for content types without draft/publish (no published_at col).
// `maxAge` (seconds) adds Cache-Control headers AND server-side unstable_cache so
//   the Postgres query is skipped on repeat requests within the revalidation window.
//   Only use for public, non-personalised, stable endpoints.
// `cacheKey` is required when maxAge is set — must be globally unique (e.g. "events").
// Usage: export const GET = listHandler(prisma.events, { maxAge: 60, cacheKey: "events" });
export function listHandler(
  model: Delegate,
  opts: { published?: boolean; maxAge?: number; cacheKey?: string } = {}
) {
  const { published = true, maxAge, cacheKey } = opts;

  const query = () =>
    model.findMany({
      where: published ? { published_at: { not: null } } : undefined,
      orderBy: { id: "asc" },
    });

  const cachedQuery =
    maxAge && cacheKey
      ? unstable_cache(query, [cacheKey], { revalidate: maxAge, tags: [cacheKey] })
      : query;

  return async () => {
    const rows = await cachedQuery();
    const data = rows.map(toStrapi);
    const headers: Record<string, string> = {};
    if (maxAge) headers["Cache-Control"] = `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 4}`;
    return jsonResponse({ data, meta: { pagination: { total: data.length } } }, { headers });
  };
}

// Factory for a Strapi single-type GET — returns the first (published) row as a
// single object. Usage: export const GET = singleHandler(prisma.globals, { maxAge: 300, cacheKey: "global" });
export function singleHandler(
  model: Delegate,
  opts: { published?: boolean; maxAge?: number; cacheKey?: string } = {}
) {
  const { published = true, maxAge, cacheKey } = opts;

  const query = () =>
    model.findFirst({
      where: published ? { published_at: { not: null } } : undefined,
      orderBy: { id: "asc" },
    });

  const cachedQuery =
    maxAge && cacheKey
      ? unstable_cache(query, [cacheKey], { revalidate: maxAge, tags: [cacheKey] })
      : query;

  return async () => {
    const row = await cachedQuery();
    const headers: Record<string, string> = {};
    if (maxAge) headers["Cache-Control"] = `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 4}`;
    return jsonResponse({ data: row ? toStrapi(row) : null }, { headers });
  };
}

// Factory for a single-item GET by documentId (Strapi 5 uses documentId in URLs).
export function detailHandler(model: Delegate) {
  return async (
    _req: Request,
    ctx: { params: Promise<{ documentId: string }> }
  ) => {
    const { documentId } = await ctx.params;
    const row = await model.findFirst({ where: { document_id: documentId } });
    if (!row) {
      return jsonResponse({ data: null, error: { status: 404 } }, { status: 404 });
    }
    return jsonResponse({ data: toStrapi(row) });
  };
}

// Generic Strapi-style create (POST). Body is `{ data: {...attrs} }`; sets
// documentId + published_at. NOTE: handles scalar fields only — content types
// with custom create logic or relations need a dedicated route.
export function createHandler(model: Delegate, opts: { published?: boolean } = {}) {
  const { published = true } = opts;
  return async (req: Request) => {
    const body = (await req.json().catch(() => ({}))) as { data?: Record<string, unknown> };
    const now = new Date();
    const row = await model.create({
      data: {
        ...(body?.data ?? {}),
        document_id: genDocId(),
        ...(published ? { published_at: now } : {}),
        created_at: now,
        updated_at: now,
      },
    });
    return jsonResponse({ data: toStrapi(row) }, { status: 201 });
  };
}

// Generic Strapi-style update (PUT /[documentId]) and delete (DELETE /[documentId]).
export function updateHandler(model: Delegate) {
  return async (req: Request, ctx: { params: Promise<{ documentId: string }> }) => {
    const { documentId } = await ctx.params;
    const existing = await model.findFirst({ where: { document_id: documentId } });
    if (!existing) return jsonResponse({ data: null, error: { status: 404 } }, { status: 404 });
    const body = (await req.json().catch(() => ({}))) as { data?: Record<string, unknown> };
    const row = await model.update({
      where: { id: existing.id as number },
      data: { ...(body?.data ?? {}), updated_at: new Date() },
    });
    return jsonResponse({ data: toStrapi(row) });
  };
}

export function deleteHandler(model: Delegate) {
  return async (_req: Request, ctx: { params: Promise<{ documentId: string }> }) => {
    const { documentId } = await ctx.params;
    const existing = await model.findFirst({ where: { document_id: documentId } });
    if (!existing) return jsonResponse({ data: null, error: { status: 404 } }, { status: 404 });
    await model.delete({ where: { id: existing.id as number } });
    return jsonResponse({ data: toStrapi(existing) });
  };
}
