import { prisma } from "@/lib/db/prisma";
import { genDocumentId } from "@/lib/services/user-wallet";

// Audit logging. AUDIT_LOG_PROVIDER = "db" (audit_trails table) or "grafana-loki".
// Best-effort: never throws, so an audit failure can never undo the business operation.

export interface AuditEvent {
  event: string;                       // e.g. DEPOSIT_APPROVED
  actionBy?: string | number | null;   // user id / cccd
  productId?: string | null;
  message?: string;
  data?: Record<string, unknown>;
}

const provider = () => (process.env.AUDIT_LOG_PROVIDER || "db").toLowerCase();

async function writeDb(e: AuditEvent) {
  const now = new Date();
  await prisma.audit_trails.create({
    data: {
      document_id: genDocumentId(),
      product_id: e.productId ?? null,
      event: e.event,
      msg_details: (e.message ?? JSON.stringify(e.data ?? {})).slice(0, 255),
      action_by: e.actionBy != null ? String(e.actionBy) : null,
      action_at: now, created_at: now, updated_at: now, published_at: now,
    },
  });
}

async function writeLoki(e: AuditEvent) {
  const url = process.env.GRAFANA_LOKI_URL;
  const user = process.env.GRAFANA_LOKI_USER;
  const token = process.env.GRAFANA_LOKI_TOKEN;
  if (!url || !user || !token) throw new Error("Grafana Loki is not configured");

  const line = JSON.stringify({
    event: e.event, actionBy: e.actionBy ?? null, productId: e.productId ?? null,
    message: e.message, ...e.data,
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.GRAFANA_LOKI_TIMEOUT_MS) || 5000);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/loki/api/v1/push`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}`,
      },
      body: JSON.stringify({
        streams: [{
          stream: {
            app: process.env.AUDIT_LOG_APP || "dnt-web",
            service: process.env.AUDIT_LOG_SERVICE || "audit",
            event: e.event,
          },
          values: [[`${Date.now()}000000`, line]],   // ns timestamp
        }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Loki push failed: ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function audit(e: AuditEvent): Promise<void> {
  try {
    if (provider() === "grafana-loki") await writeLoki(e);
    else await writeDb(e);
  } catch (err) {
    console.error("[audit] failed:", (err as Error).message);
  }
}
