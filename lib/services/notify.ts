import { prisma } from "@/lib/db/prisma";

// Faithful port of common/services/realtime-notify.js + notification-dispatcher.js.
// In-app notifications are delivered over Supabase Realtime: the app's Postgres
// connection IS the Supabase project, so we call `realtime.send(...)` directly
// (the same function chat SQL triggers use) to broadcast a `notification` event
// on the user's private `user:{id}:inbox` channel.
//
// email/sms/push stay stubs (no provider configured), matching the old backend.
// Never throws — a failed push must not undo the operation it's attached to.

// Substitutes `{key}` placeholders with values from `data`; leaves unmatched ones as-is.
function interpolate(template: string, data?: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    data?.[key] !== undefined ? String(data[key]) : match
  );
}

export async function notify(params: {
  userId: number;
  templateCode: string;
  data?: Record<string, unknown>;
}): Promise<{ sent: boolean; reason?: string }> {
  const { userId, templateCode, data } = params;
  if (!userId || !templateCode) return { sent: false, reason: "missing userId/templateCode" };

  try {
    const template = await prisma.noti_templates.findFirst({ where: { code: templateCode } });
    if (!template || !template.message) {
      console.error(`[notify] template not found: ${templateCode}`);
      return { sent: false, reason: "template missing" };
    }

    const payload = {
      pushDate: Date.now(),
      templateCode: template.code,
      message: interpolate(template.message, data),
      read: false,
      ...data,
    };

    await prisma.$queryRaw`select realtime.send(${JSON.stringify(payload)}::jsonb, 'notification', ${`user:${userId}:inbox`}, true)`;

    return { sent: true };
  } catch (error) {
    console.error(`[notify] failed for user ${userId} (${templateCode}):`, error);
    return { sent: false, reason: (error as Error).message };
  }
}
