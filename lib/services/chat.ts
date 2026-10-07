import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";
import { genDocumentId } from "@/lib/services/user-wallet";

const MSG_MORPH = "api::message.message";

// Resolve the caller's user id from the Bearer token (throws → caller 401s).
export function meId(req: Request): number {
  const token = bearer(req);
  if (!token) throw new Error("No token provided");
  const id = verifyToken(token).id;
  if (!id) throw new Error("Invalid token payload");
  return id;
}

async function participantIds(conversationId: number): Promise<number[]> {
  const rows = await prisma.conversations_participants_lnk.findMany({
    where: { conversation_id: conversationId },
    select: { user_id: true },
  });
  return rows.map((r) => r.user_id).filter((x): x is number => x != null);
}

export async function assertParticipant(conversationId: number, me: number) {
  const ids = await participantIds(conversationId);
  if (!ids.includes(me)) {
    const err = new Error("Not a participant of this conversation") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}

// Conversation where exactly me + target are participants.
export async function findOneToOne(me: number, target: number): Promise<number | null> {
  const mine = await prisma.conversations_participants_lnk.findMany({
    where: { user_id: me },
    select: { conversation_id: true },
  });
  const myConvoIds = mine.map((r) => r.conversation_id).filter((x): x is number => x != null);
  if (!myConvoIds.length) return null;
  const withTarget = await prisma.conversations_participants_lnk.findFirst({
    where: { user_id: target, conversation_id: { in: myConvoIds } },
    select: { conversation_id: true },
  });
  return withTarget?.conversation_id ?? null;
}

// Message ids belonging to a conversation (optionally after `sinceId`).
async function convMessageIds(conversationId: number, sinceId?: number): Promise<number[]> {
  const rows = await prisma.messages_conversation_lnk.findMany({
    where: { conversation_id: conversationId },
    select: { message_id: true },
  });
  let ids = rows.map((r) => r.message_id).filter((x): x is number => x != null);
  if (sinceId) ids = ids.filter((id) => id > sinceId);
  return ids;
}

// Map message_id → sender user_id for a set of messages.
async function sendersFor(messageIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (!messageIds.length) return map;
  const rows = await prisma.messages_sender_lnk.findMany({
    where: { message_id: { in: messageIds } },
    select: { message_id: true, user_id: true },
  });
  for (const r of rows) if (r.message_id != null && r.user_id != null) map.set(r.message_id, r.user_id);
  return map;
}

export async function unreadCount(conversationId: number, me: number): Promise<number> {
  const ids = await convMessageIds(conversationId);
  if (!ids.length) return 0;
  const senders = await sendersFor(ids);
  const fromOthers = ids.filter((id) => senders.get(id) !== me);
  if (!fromOthers.length) return 0;
  return prisma.messages.count({ where: { id: { in: fromOthers }, is_read: false } });
}

export async function markConversationRead(conversationId: number, me: number): Promise<number> {
  const ids = await convMessageIds(conversationId);
  const senders = await sendersFor(ids);
  const fromOthers = ids.filter((id) => senders.get(id) !== me);
  if (!fromOthers.length) return 0;
  const unread = await prisma.messages.findMany({
    where: { id: { in: fromOthers }, is_read: false },
    select: { id: true },
  });
  if (unread.length) {
    await prisma.messages.updateMany({
      where: { id: { in: unread.map((m) => m.id) } },
      data: { is_read: true, read_at: new Date() },
    });
  }
  return unread.length;
}

type UserLite = { id: number; full_name: string | null; bank_number: string | null; avt: string | null };

async function usersWithAvatar(ids: number[]): Promise<Map<number, UserLite>> {
  const map = new Map<number, UserLite>();
  if (!ids.length) return map;
  const users = await prisma.up_users.findMany({
    where: { id: { in: ids } },
    select: { id: true, full_name: true, bank_number: true },
  });
  const avatars = await prisma.files_related_mph.findMany({
    where: { related_type: "plugin::users-permissions.user", related_id: { in: ids }, field: "avt" },
    include: { files: true },
  });
  const avMap = new Map<number, string>();
  for (const a of avatars) if (a.related_id != null && a.files?.url) avMap.set(a.related_id, a.files.url);
  for (const u of users) map.set(u.id, { id: u.id, full_name: u.full_name, bank_number: u.bank_number, avt: avMap.get(u.id) ?? null });
  return map;
}

// GET /conversations + /conversations/sync list shape.
export async function fetchFormattedConversations(me: number) {
  const mine = await prisma.conversations_participants_lnk.findMany({
    where: { user_id: me },
    select: { conversation_id: true },
  });
  const convoIds = [...new Set(mine.map((r) => r.conversation_id).filter((x): x is number => x != null))];
  if (!convoIds.length) return [];

  const convos = await prisma.conversations.findMany({
    where: { id: { in: convoIds } },
    orderBy: { last_message_at: "desc" },
  });

  // batch: participants, hidden_by, muted_by, last_sender
  const [parts, hidden, muted, lastSenders] = await Promise.all([
    prisma.conversations_participants_lnk.findMany({ where: { conversation_id: { in: convoIds } }, select: { conversation_id: true, user_id: true } }),
    prisma.conversations_hidden_by_lnk.findMany({ where: { conversation_id: { in: convoIds } }, select: { conversation_id: true, user_id: true } }),
    prisma.conversations_muted_by_lnk.findMany({ where: { conversation_id: { in: convoIds } }, select: { conversation_id: true, user_id: true } }),
    prisma.conversations_last_sender_lnk.findMany({ where: { conversation_id: { in: convoIds } }, select: { conversation_id: true, user_id: true } }),
  ]);

  const otherOf = new Map<number, number>();
  for (const p of parts) if (p.conversation_id != null && p.user_id != null && p.user_id !== me) otherOf.set(p.conversation_id, p.user_id);
  const hiddenByMe = new Set(hidden.filter((h) => h.user_id === me).map((h) => h.conversation_id));
  const mutedByMe = new Set(muted.filter((h) => h.user_id === me).map((h) => h.conversation_id));
  const lastSenderOf = new Map<number, number>();
  for (const l of lastSenders) if (l.conversation_id != null && l.user_id != null) lastSenderOf.set(l.conversation_id, l.user_id);

  const others = await usersWithAvatar([...new Set([...otherOf.values()])]);

  const visible = convos.filter((c) => !hiddenByMe.has(c.id));
  return Promise.all(
    visible.map(async (c) => {
      const otherId = otherOf.get(c.id);
      const other = otherId ? others.get(otherId) ?? null : null;
      return {
        id: c.id,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        last_sender: lastSenderOf.has(c.id) ? { id: lastSenderOf.get(c.id) } : null,
        unread_count: await unreadCount(c.id, me),
        muted: mutedByMe.has(c.id),
        other_user: other,
      };
    })
  );
}

export async function getMessages(conversationId: number, sinceId: number | undefined, limit: number) {
  const ids = await convMessageIds(conversationId, sinceId);
  if (!ids.length) return [];
  const messages = await prisma.messages.findMany({
    where: { id: { in: ids } },
    orderBy: { id: "asc" },
    take: limit,
  });
  const senders = await sendersFor(messages.map((m) => m.id));
  const senderUsers = await usersWithAvatar([...new Set([...senders.values()])]);
  const attachments = await prisma.files_related_mph.findMany({
    where: { related_type: MSG_MORPH, related_id: { in: messages.map((m) => m.id) }, field: "attachment" },
    include: { files: true },
  });
  const attachOf = new Map<number, { url: string | null; name: string | null; mime: string | null }>();
  for (const a of attachments) if (a.related_id != null && a.files) attachOf.set(a.related_id, { url: a.files.url, name: a.files.name, mime: a.files.mime });

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    is_read: m.is_read,
    read_at: m.read_at,
    createdAt: m.created_at,
    conversation: conversationId,
    sender: senders.has(m.id) ? senderUsers.get(senders.get(m.id)!) ?? { id: senders.get(m.id) } : null,
    attachment: attachOf.get(m.id) ?? null,
  }));
}

export async function createMessage(
  conversationId: number,
  me: number,
  content: string,
  type: string,
  attachmentId?: number
) {
  const now = new Date();
  const message = await prisma.messages.create({
    data: {
      document_id: genDocumentId(),
      content,
      type: type || "text",
      is_read: false,
      published_at: now,
      created_at: now,
      updated_at: now,
    },
  });
  await prisma.messages_conversation_lnk.create({ data: { message_id: message.id, conversation_id: conversationId, message_ord: message.id } });
  await prisma.messages_sender_lnk.create({ data: { message_id: message.id, user_id: me } });
  if (attachmentId) {
    await prisma.files_related_mph.create({ data: { file_id: attachmentId, related_id: message.id, related_type: MSG_MORPH, field: "attachment", order: 1 } });
  }

  // touch conversation last message + last sender
  await prisma.conversations.update({ where: { id: conversationId }, data: { last_message: content, last_message_at: now, updated_at: now } });
  await prisma.conversations_last_sender_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations_last_sender_lnk.create({ data: { conversation_id: conversationId, user_id: me } });

  const senderUser = (await usersWithAvatar([me])).get(me) ?? { id: me };
  return {
    id: message.id,
    content: message.content,
    type: message.type,
    is_read: message.is_read,
    createdAt: message.created_at,
    conversation: conversationId,
    sender: senderUser,
  };
}

// POST /conversations — find-or-create a 1:1 conversation, unhide for me.
export async function createConversation(me: number, target: number) {
  let convoId = await findOneToOne(me, target);
  if (!convoId) {
    const now = new Date();
    const convo = await prisma.conversations.create({
      data: { document_id: genDocumentId(), last_message_at: now, published_at: now, created_at: now, updated_at: now },
    });
    convoId = convo.id;
    await prisma.conversations_participants_lnk.createMany({
      data: [
        { conversation_id: convoId, user_id: me, user_ord: 1 },
        { conversation_id: convoId, user_id: target, user_ord: 2 },
      ],
    });
  }
  // un-hide for me (best effort)
  await prisma.conversations_hidden_by_lnk.deleteMany({ where: { conversation_id: convoId, user_id: me } });

  const convo = await prisma.conversations.findFirst({ where: { id: convoId } });
  const other = (await usersWithAvatar([target])).get(target) ?? null;
  const muted = !!(await prisma.conversations_muted_by_lnk.findFirst({ where: { conversation_id: convoId, user_id: me } }));
  const ls = await prisma.conversations_last_sender_lnk.findFirst({ where: { conversation_id: convoId } });
  return {
    id: convoId,
    last_message: convo?.last_message ?? null,
    last_message_at: convo?.last_message_at ?? null,
    last_sender: ls?.user_id ? { id: ls.user_id } : null,
    unread_count: await unreadCount(convoId, me),
    muted,
    other_user: other,
  };
}

export async function totalUnread(me: number): Promise<number> {
  const mine = await prisma.conversations_participants_lnk.findMany({ where: { user_id: me }, select: { conversation_id: true } });
  const ids = mine.map((r) => r.conversation_id).filter((x): x is number => x != null);
  let total = 0;
  for (const cid of ids) total += await unreadCount(cid, me);
  return total;
}

export async function isMuted(conversationId: number, me: number): Promise<boolean> {
  return !!(await prisma.conversations_muted_by_lnk.findFirst({ where: { conversation_id: conversationId, user_id: me } }));
}

export async function clearMessages(conversationId: number) {
  const ids = await convMessageIds(conversationId);
  if (ids.length) {
    await prisma.messages_conversation_lnk.deleteMany({ where: { message_id: { in: ids } } });
    await prisma.messages_sender_lnk.deleteMany({ where: { message_id: { in: ids } } });
    await prisma.files_related_mph.deleteMany({ where: { related_type: MSG_MORPH, related_id: { in: ids } } });
    await prisma.messages.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.conversations_last_sender_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations.update({ where: { id: conversationId }, data: { last_message: null, last_message_at: null } });
}

export async function removeConversation(conversationId: number, me: number): Promise<number | null> {
  const ids = await participantIds(conversationId);
  const otherId = ids.find((x) => x !== me) ?? null;
  await clearMessages(conversationId);
  await prisma.conversations_participants_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations_hidden_by_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations_muted_by_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations_reported_by_lnk.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.conversations.delete({ where: { id: conversationId } });
  return otherId;
}

// Toggle a per-user link flag (hidden_by / muted_by / reported_by).
export async function setConvFlag(
  table: "hidden" | "muted" | "reported",
  conversationId: number,
  me: number,
  on: boolean
) {
  const where = { conversation_id: conversationId, user_id: me };
  const data = { conversation_id: conversationId, user_id: me };
  if (table === "hidden") {
    const ex = await prisma.conversations_hidden_by_lnk.findFirst({ where });
    if (on && !ex) await prisma.conversations_hidden_by_lnk.create({ data });
    if (!on && ex) await prisma.conversations_hidden_by_lnk.deleteMany({ where });
  } else if (table === "muted") {
    const ex = await prisma.conversations_muted_by_lnk.findFirst({ where });
    if (on && !ex) await prisma.conversations_muted_by_lnk.create({ data });
    if (!on && ex) await prisma.conversations_muted_by_lnk.deleteMany({ where });
  } else {
    const ex = await prisma.conversations_reported_by_lnk.findFirst({ where });
    if (on && !ex) await prisma.conversations_reported_by_lnk.create({ data });
    if (!on && ex) await prisma.conversations_reported_by_lnk.deleteMany({ where });
  }
}
