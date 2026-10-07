import { prisma } from "@/lib/db/prisma";

const ACTIVE_ONLINE_WINDOW_MS = 60 * 1000;

const toNumber = (v: unknown): number => {
  const n = Number((v as number) ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const isDoneStatus = (s: unknown) => s === "DONE" || s === "APPROVED_BY_AUTOMATION";

function sumBy<T>(items: T[], pick: (i: T) => unknown): number {
  return items.reduce((t, i) => t + toNumber(pick(i)), 0);
}

function productItemListedValue(i: Record<string, unknown>): number {
  const amountDesired = toNumber(i.amount_desired);
  if (amountDesired > 0) return amountDesired;
  const unitPrice = toNumber(i.unit_asking_price ?? i.unit_market_price);
  const quantity = toNumber(i.quantity_minimum ?? i.quantity_min_require ?? 1);
  return unitPrice * Math.max(quantity, 1);
}

async function countOnline(): Promise<number> {
  const since = new Date(Date.now() - ACTIVE_ONLINE_WINDOW_MS);
  const rows = await prisma.site_presences.findMany({
    where: { last_seen_at: { gte: since } },
    distinct: ["session_id"],
    select: { session_id: true },
  });
  return rows.length;
}

// Faithful port of common/services/system-metrics.js:buildMetricsSnapshot.
export async function buildMetricsSnapshot() {
  const [current, products, productItems, freelancers, lives, videos, payments, additions, withdraws, wallets, users, online] =
    await Promise.all([
      prisma.system_infos.findFirst({ orderBy: { id: "asc" } }),
      prisma.products.findMany({ select: { status: true, main_page_view_count: true } }),
      prisma.product_items.findMany({ select: { amount_desired: true, unit_asking_price: true, unit_market_price: true, quantity_minimum: true, quantity_min_require: true } }),
      prisma.freelancers.findMany({ select: { price: true } }),
      prisma.lives.findMany({ select: { price_base_local: true, unit_price: true, watch_price: true, start_advertising_from_views: true } }),
      prisma.videos.findMany({ select: { start_from_view: true } }),
      prisma.payment_transactions.findMany({ select: { amount: true } }),
      prisma.additional_transactions.findMany({ select: { amount: true, stt: true } }),
      prisma.with_drawth_transactions.findMany({ select: { amount: true, stt: true } }),
      prisma.wallets.findMany({ select: { total: true, account_of_goods: true, account_of_freelancer: true, account_of_ailive: true } }),
      prisma.up_users.findMany({ select: { blocked: true } }),
      countOnline(),
    ]);

  const visibleProducts = products.filter((p) => p.status !== "rejected");
  const deposits = additions.filter((t) => isDoneStatus(t.stt));
  const doneWithdraws = withdraws.filter((t) => isDoneStatus(t.stt));

  return {
    listedValue:
      sumBy(productItems as Record<string, unknown>[], productItemListedValue) +
      sumBy(freelancers, (f) => f.price) +
      sumBy(lives, (l) => toNumber(l.price_base_local) || toNumber(l.unit_price) || toNumber(l.watch_price)),
    transactions: payments.length,
    accesses: sumBy(visibleProducts, (p) => p.main_page_view_count),
    successfully: payments.length,
    amount: sumBy(payments, (t) => t.amount),
    duration: toNumber(current?.duration),
    latestBank: current?.latest_bank ?? "",
    deposited: sumBy(deposits, (t) => t.amount),
    videoViews: sumBy(videos, (v) => v.start_from_view) + sumBy(lives, (l) => l.start_advertising_from_views),
    withdrawn: sumBy(doneWithdraws, (t) => t.amount),
    members: users.filter((u) => !u.blocked).length,
    remaining: sumBy(wallets, (w) =>
      toNumber(w.total) + toNumber(w.account_of_goods) + toNumber(w.account_of_freelancer) + toNumber(w.account_of_ailive)
    ),
    online,
    hasExpiry: current?.has_expiry ?? false,
    lastUpdated: new Date(),
  };
}
