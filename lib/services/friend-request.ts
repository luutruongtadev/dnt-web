import { prisma } from "@/lib/db/prisma";
import { genDocumentId } from "@/lib/services/user-wallet";
import { findOneToOne, usersWithAvatar } from "@/lib/services/chat";

// Faithful port of api/friend-request (controllers + services).
// Strapi's from_user / to_user manyToOne relations live in the
// friend_requests_{from,to}_user_lnk tables, so every read/write touches them.

export type FriendRequestRow = {
  id: number;
  status: string | null;
  from_user: number | null;
  to_user: number | null;
};

// Direction maps (from_user / to_user) for a set of request ids.
async function partiesFor(frIds: number[]): Promise<{ fromOf: Map<number, number>; toOf: Map<number, number> }> {
  const fromOf = new Map<number, number>();
  const toOf = new Map<number, number>();
  if (!frIds.length) return { fromOf, toOf };
  const [from, to] = await Promise.all([
    prisma.friend_requests_from_user_lnk.findMany({ where: { friend_request_id: { in: frIds } }, select: { friend_request_id: true, user_id: true } }),
    prisma.friend_requests_to_user_lnk.findMany({ where: { friend_request_id: { in: frIds } }, select: { friend_request_id: true, user_id: true } }),
  ]);
  for (const r of from) if (r.friend_request_id != null && r.user_id != null) fromOf.set(r.friend_request_id, r.user_id);
  for (const r of to) if (r.friend_request_id != null && r.user_id != null) toOf.set(r.friend_request_id, r.user_id);
  return { fromOf, toOf };
}

async function loadRequest(frId: number): Promise<FriendRequestRow | null> {
  const row = await prisma.friend_requests.findFirst({ where: { id: frId } });
  if (!row) return null;
  const { fromOf, toOf } = await partiesFor([frId]);
  return { id: row.id, status: row.status, from_user: fromOf.get(frId) ?? null, to_user: toOf.get(frId) ?? null };
}

async function setDirection(frId: number, from: number, to: number) {
  await prisma.friend_requests_from_user_lnk.deleteMany({ where: { friend_request_id: frId } });
  await prisma.friend_requests_to_user_lnk.deleteMany({ where: { friend_request_id: frId } });
  await prisma.friend_requests_from_user_lnk.create({ data: { friend_request_id: frId, user_id: from } });
  await prisma.friend_requests_to_user_lnk.create({ data: { friend_request_id: frId, user_id: to } });
}

// Any request between the two users, in either direction (block duplicates /
// detect an existing friendship).
export async function findBetween(a: number, b: number): Promise<FriendRequestRow | null> {
  const [fromLinks, toLinks] = await Promise.all([
    prisma.friend_requests_from_user_lnk.findMany({ where: { user_id: { in: [a, b] } }, select: { friend_request_id: true, user_id: true } }),
    prisma.friend_requests_to_user_lnk.findMany({ where: { user_id: { in: [a, b] } }, select: { friend_request_id: true, user_id: true } }),
  ]);
  const fromOf = new Map<number, number>();
  const toOf = new Map<number, number>();
  for (const r of fromLinks) if (r.friend_request_id != null && r.user_id != null) fromOf.set(r.friend_request_id, r.user_id);
  for (const r of toLinks) if (r.friend_request_id != null && r.user_id != null) toOf.set(r.friend_request_id, r.user_id);

  const ids = [...new Set([...fromOf.keys(), ...toOf.keys()])];
  for (const id of ids) {
    const f = fromOf.get(id);
    const t = toOf.get(id);
    if ((f === a && t === b) || (f === b && t === a)) return loadRequest(id);
  }
  return null;
}

// POST /friend-requests — create (or reset a previously rejected) request.
export async function createRequest(me: number, toUserId: number): Promise<FriendRequestRow> {
  const existing = await findBetween(me, toUserId);
  if (existing) {
    if (existing.status === "accepted") throw Object.assign(new Error("Already friends"), { status: 400 });
    if (existing.status === "pending") throw Object.assign(new Error("A friend request is already pending between these users"), { status: 400 });
    // previously rejected — reset to a fresh pending request in the new direction
    await prisma.friend_requests.update({ where: { id: existing.id }, data: { status: "pending", responded_at: null, updated_at: new Date() } });
    await setDirection(existing.id, me, toUserId);
    return (await loadRequest(existing.id))!;
  }
  const now = new Date();
  const row = await prisma.friend_requests.create({
    data: { document_id: genDocumentId(), status: "pending", published_at: now, created_at: now, updated_at: now },
  });
  await setDirection(row.id, me, toUserId);
  return { id: row.id, status: "pending", from_user: me, to_user: toUserId };
}

// Shared by GET /incoming and the /conversations/sync poll.
export async function incoming(me: number) {
  const links = await prisma.friend_requests_to_user_lnk.findMany({ where: { user_id: me }, select: { friend_request_id: true } });
  const frIds = links.map((l) => l.friend_request_id).filter((x): x is number => x != null);
  if (!frIds.length) return [];
  const rows = await prisma.friend_requests.findMany({
    where: { id: { in: frIds }, status: "pending" },
    orderBy: { created_at: "desc" },
  });
  if (!rows.length) return [];
  const { fromOf } = await partiesFor(rows.map((r) => r.id));
  const users = await usersWithAvatar([...new Set([...fromOf.values()])]);
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, from_user: users.get(fromOf.get(r.id)!) ?? null }));
}

export async function outgoing(me: number) {
  const links = await prisma.friend_requests_from_user_lnk.findMany({ where: { user_id: me }, select: { friend_request_id: true } });
  const frIds = links.map((l) => l.friend_request_id).filter((x): x is number => x != null);
  if (!frIds.length) return [];
  const rows = await prisma.friend_requests.findMany({
    where: { id: { in: frIds }, status: "pending" },
    orderBy: { created_at: "desc" },
  });
  if (!rows.length) return [];
  const { toOf } = await partiesFor(rows.map((r) => r.id));
  const users = await usersWithAvatar([...new Set([...toOf.values()])]);
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, to_user: users.get(toOf.get(r.id)!) ?? null }));
}

// POST /friend-requests/:id/accept — accept and open a 1:1 conversation.
export async function acceptRequest(me: number, frId: number): Promise<{ success: true; conversationId: number }> {
  const request = await loadRequest(frId);
  if (!request) throw Object.assign(new Error("Friend request not found"), { status: 404 });
  if (request.to_user !== me) throw Object.assign(new Error("This request was not sent to you"), { status: 403 });
  if (request.status !== "pending") throw Object.assign(new Error("This request has already been responded to"), { status: 400 });

  await prisma.friend_requests.update({ where: { id: frId }, data: { status: "accepted", responded_at: new Date(), updated_at: new Date() } });

  // friends can now message — ensure their 1:1 conversation exists
  let convoId = await findOneToOne(request.from_user!, request.to_user!);
  if (!convoId) {
    const now = new Date();
    const convo = await prisma.conversations.create({
      data: { document_id: genDocumentId(), last_message_at: now, published_at: now, created_at: now, updated_at: now },
    });
    convoId = convo.id;
    await prisma.conversations_participants_lnk.createMany({
      data: [
        { conversation_id: convoId, user_id: request.from_user!, user_ord: 1 },
        { conversation_id: convoId, user_id: request.to_user!, user_ord: 2 },
      ],
    });
  }
  return { success: true, conversationId: convoId };
}

// POST /friend-requests/:id/reject
export async function rejectRequest(me: number, frId: number): Promise<{ success: true }> {
  const request = await loadRequest(frId);
  if (!request) throw Object.assign(new Error("Friend request not found"), { status: 404 });
  if (request.to_user !== me) throw Object.assign(new Error("This request was not sent to you"), { status: 403 });
  if (request.status !== "pending") throw Object.assign(new Error("This request has already been responded to"), { status: 400 });

  await prisma.friend_requests.update({ where: { id: frId }, data: { status: "rejected", responded_at: new Date(), updated_at: new Date() } });
  return { success: true };
}
