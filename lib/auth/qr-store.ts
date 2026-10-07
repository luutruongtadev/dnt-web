// In-memory QR login session store (mirrors the Map in Strapi's auth controller).
// Works in dev (single process). For multi-instance prod this must move to a
// shared store (Redis / a DB table) — noted for the migration.
export type QrSession = {
  sessionId: string;
  timestamp: number;
  type: string;
  appUrl: string;
  status: "pending" | "authenticated";
  expiresAt: number;
  avatar?: string;
  stk?: string;
  userId?: number;
  token?: string;
  user?: unknown;
};

const globalForQr = globalThis as unknown as { __qrStore?: Map<string, QrSession> };
export const qrCodeStore: Map<string, QrSession> =
  globalForQr.__qrStore ?? (globalForQr.__qrStore = new Map());
