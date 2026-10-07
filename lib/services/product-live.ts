import { prisma } from "@/lib/db/prisma";
import { mediaByRelatedId, fileToStrapi } from "@/lib/api/media";

// Port of api/product/controllers/product-live.js. Live-session state lives in the
// products.live_participants / live_bids (Json) + live_session_updated_at columns.

type AnyObj = Record<string, unknown>;

function getArray<T = AnyObj>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function routeWhere(id: string) {
  return /^\d+$/.test(id) ? { id: Number(id) } : { document_id: id };
}

async function posterUser(productId: number) {
  const lnk = await prisma.products_poster_lnk.findFirst({ where: { product_id: productId }, include: { up_users: true } });
  const u = lnk?.up_users;
  return u ? { id: u.id, documentId: u.document_id, username: u.username, full_name: u.full_name, cccd: u.cccd } : null;
}

function toLiveSession(product: AnyObj, poster: unknown) {
  const participants = getArray(product.live_participants);
  const bids = getArray(product.live_bids).sort(
    (a, b) => new Date((b.createdAt as string) || 0).getTime() - new Date((a.createdAt as string) || 0).getTime()
  );
  return {
    productId: product.id,
    productDocumentId: product.document_id,
    broadcaster: poster,
    participants,
    participantCount: participants.length,
    bids,
    latestBid: bids[0] || null,
    updatedAt: product.live_session_updated_at || product.updated_at,
  };
}

function normalizeViewer(rawViewer: AnyObj = {}, fallbackUser: AnyObj | null = null, nowIso: string) {
  const viewerId = String(rawViewer.viewerId || rawViewer.id || fallbackUser?.id || `guest-${nowIso}`);
  return {
    viewerId,
    name: rawViewer.name || rawViewer.full_name || fallbackUser?.full_name || fallbackUser?.username || fallbackUser?.email || "Khách",
    email: rawViewer.email || fallbackUser?.email || "",
    joinedAt: (rawViewer.joinedAt as string) || nowIso,
  };
}

export async function getLiveSession(id: string) {
  const product = await prisma.products.findFirst({ where: routeWhere(id) });
  if (!product) return null;
  return toLiveSession(product as AnyObj, await posterUser(product.id));
}

function upsertParticipant(participants: AnyObj[], viewer: AnyObj, nowIso: string) {
  return participants.some((p) => String(p.viewerId) === viewer.viewerId)
    ? participants.map((p) => (String(p.viewerId) === viewer.viewerId ? { ...p, ...viewer, lastSeenAt: nowIso } : p))
    : [...participants, { ...viewer, lastSeenAt: nowIso }];
}

export async function joinLiveSession(id: string, body: AnyObj, user: AnyObj | null) {
  const product = await prisma.products.findFirst({ where: routeWhere(id) });
  if (!product) return null;
  const nowIso = new Date().toISOString();
  const viewer = normalizeViewer((body.viewer as AnyObj) || body, user, nowIso);
  const next = upsertParticipant(getArray(product.live_participants), viewer, nowIso);
  const updated = await prisma.products.update({
    where: { id: product.id },
    data: { live_participants: next as never, live_session_updated_at: new Date(nowIso) },
  });
  return toLiveSession(updated as AnyObj, await posterUser(product.id));
}

export async function createLiveBid(id: string, body: AnyObj, user: AnyObj | null) {
  const product = await prisma.products.findFirst({ where: routeWhere(id) });
  if (!product) return { error: "not-found" as const };

  const nowIso = new Date().toISOString();
  const viewer = normalizeViewer((body.viewer as AnyObj) || {}, user, nowIso);
  const quantity = Number(body.quantity || 0);
  const unitPrice = Number(body.unitPrice || body.price || 0);
  if (!body.productItemId && !body.productItemDocumentId && body.itemIndex === undefined) {
    return { error: "item-required" as const };
  }
  if (quantity <= 0 || unitPrice <= 0) return { error: "invalid-amounts" as const };

  const participants = upsertParticipant(getArray(product.live_participants), viewer, nowIso);
  const bid = {
    id: `${nowIso}-${viewer.viewerId}`,
    viewerId: viewer.viewerId,
    viewerName: viewer.name,
    viewerEmail: viewer.email,
    productItemId: body.productItemId || null,
    productItemDocumentId: body.productItemDocumentId || null,
    itemIndex: body.itemIndex ?? null,
    itemName: body.itemName || "",
    quantity,
    unitPrice,
    totalAmount: Number(body.totalAmount || quantity * unitPrice),
    note: body.note || "",
    status: "pending",
    createdAt: nowIso,
  };
  const nextBids = [bid, ...getArray(product.live_bids)].slice(0, 200);

  const updated = await prisma.products.update({
    where: { id: product.id },
    data: { live_participants: participants as never, live_bids: nextBids as never, live_session_updated_at: new Date(nowIso) },
  });
  return { session: toLiveSession(updated as AnyObj, await posterUser(product.id)), bid };
}

// GET /products/goods-videos — products that have at least one video source,
// with their videos (linked `video` records first, else inferred from media).
export async function listGoodsWithVideos(q: URLSearchParams) {
  const page = Math.max(1, Number(q.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.get("pageSize")) || 20));
  const search = (q.get("search") || "").trim();

  // product ids that own a product-level video media (livestreamVideoFile/videoFile)
  const prodVideoLinks = await prisma.files_related_mph.findMany({
    where: { related_type: "api::product.product", field: { in: ["livestreamVideoFile", "videoFile"] } },
    select: { related_id: true },
  });
  const prodVideoIds = new Set(prodVideoLinks.map((l) => l.related_id).filter((x): x is number => x != null));

  // product ids whose product-items own a videoFile
  const itemVideoLinks = await prisma.files_related_mph.findMany({
    where: { related_type: "api::product-item.product-item", field: "videoFile" },
    select: { related_id: true },
  });
  const itemIds = itemVideoLinks.map((l) => l.related_id).filter((x): x is number => x != null);
  const itemOwner = itemIds.length
    ? await prisma.product_items_product_lnk.findMany({ where: { product_item_id: { in: itemIds } }, select: { product_id: true } })
    : [];
  const itemVideoProdIds = new Set(itemOwner.map((l) => l.product_id).filter((x): x is number => x != null));

  // product ids with a linked `video` record
  const linkedVideoProd = await prisma.videos_product_lnk.findMany({ select: { product_id: true } });
  const linkedVideoProdIds = new Set(linkedVideoProd.map((l) => l.product_id).filter((x): x is number => x != null));

  const candidateIds = [...new Set([...prodVideoIds, ...itemVideoProdIds, ...linkedVideoProdIds])];
  if (!candidateIds.length) return { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };

  // search filter — products has no name column, so numeric search matches id only
  let where: AnyObj = { id: { in: candidateIds } };
  if (search && !Number.isNaN(Number(search))) {
    where = { id: { in: candidateIds.filter((cid) => cid === Number(search)) } };
  }

  const total = await prisma.products.count({ where: where as never });
  const products = await prisma.products.findMany({
    where: where as never,
    orderBy: { updated_at: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const pageIds = products.map((p) => p.id);

  // media for this page
  const [prodMedia, linkedVideos] = await Promise.all([
    prisma.files_related_mph.findMany({
      where: { related_type: "api::product.product", related_id: { in: pageIds }, field: { in: ["livestreamVideoFile", "videoFile"] } },
      include: { files: true },
    }),
    prisma.videos_product_lnk.findMany({ where: { product_id: { in: pageIds } }, include: { videos: true } }),
  ]);
  // item videos per product
  const itemsOfPage = await prisma.product_items_product_lnk.findMany({ where: { product_id: { in: pageIds } }, select: { product_id: true, product_item_id: true } });
  const pageItemIds = itemsOfPage.map((l) => l.product_item_id).filter((x): x is number => x != null);
  const itemMediaMap = pageItemIds.length ? await mediaByRelatedId("product-item.product-item", pageItemIds) : new Map();
  const itemNameRows = pageItemIds.length ? await prisma.product_items.findMany({ where: { id: { in: pageItemIds } }, select: { id: true, name: true } }) : [];
  const itemNameOf = new Map(itemNameRows.map((r) => [r.id, r.name]));

  const prodMediaOf = new Map<number, { field: string; file: AnyObj }[]>();
  for (const m of prodMedia) {
    if (m.related_id == null || !m.files) continue;
    const arr = prodMediaOf.get(m.related_id) ?? [];
    arr.push({ field: m.field ?? "", file: fileToStrapi(m.files as unknown as AnyObj) });
    prodMediaOf.set(m.related_id, arr);
  }
  const linkedVideoOf = new Map<number, AnyObj[]>();
  const videoSrcMap = await (async () => {
    const vids = linkedVideos.map((l) => l.videos).filter(Boolean) as AnyObj[];
    const vidIds = vids.map((v) => v.id as number);
    const sources = vidIds.length ? await mediaByRelatedId("video.video", vidIds) : new Map();
    return sources;
  })();
  for (const l of linkedVideos) {
    if (l.product_id == null || !l.videos) continue;
    const arr = linkedVideoOf.get(l.product_id) ?? [];
    arr.push(l.videos as unknown as AnyObj);
    linkedVideoOf.set(l.product_id, arr);
  }
  const itemsByProduct = new Map<number, number[]>();
  for (const l of itemsOfPage) {
    if (l.product_id == null || l.product_item_id == null) continue;
    const arr = itemsByProduct.get(l.product_id) ?? [];
    arr.push(l.product_item_id);
    itemsByProduct.set(l.product_id, arr);
  }

  const data = products
    .map((p) => {
      const linked = (linkedVideoOf.get(p.id) ?? []).map((v) => ({
        id: v.id,
        name: v.name || "",
        source: (videoSrcMap.get(v.id as number) ?? [])[0] ?? null,
        hasPlatformLogo: !!v.has_platform_logo,
        viewers: v.start_from_view || 0,
      }));

      let videos = linked as AnyObj[];
      if (videos.length === 0) {
        videos = [];
        const media = prodMediaOf.get(p.id) ?? [];
        const live = media.find((m) => m.field === "livestreamVideoFile")?.file;
        if (live) videos.push({ id: `p${p.id}-live`, name: "", source: live, hasPlatformLogo: true, viewers: p.main_page_view_count || 0 });
        const vf = media.find((m) => m.field === "videoFile")?.file;
        if (vf) videos.push({ id: `p${p.id}-video`, name: "", source: vf, hasPlatformLogo: false, viewers: p.main_page_view_count || 0 });
        (itemsByProduct.get(p.id) ?? []).forEach((itemId, idx) => {
          const iv = (itemMediaMap.get(itemId) ?? [])[0];
          if (iv) videos.push({ id: `p${p.id}-item${itemId || idx}`, name: itemNameOf.get(itemId) || "", source: iv, hasPlatformLogo: false, viewers: 0 });
        });
      }

      return { id: p.id, documentId: p.document_id, name: "", updatedAt: p.updated_at, videos };
    })
    .filter((f) => f.videos.length > 0);

  return { data, meta: { pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total } } };
}
