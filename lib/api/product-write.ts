import { prisma } from "@/lib/db/prisma";
import { userFromBearer } from "@/lib/auth";
import { genDocumentId } from "@/lib/services/user-wallet";

// Strapi stores camelCase field names as snake_case columns. Convert the way
// lodash.snakeCase does (so "regProductAdAI" -> "reg_product_ad_ai").
function snake(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

// Boolean columns (snake) — coerce truthy strings to real booleans.
const BOOL_COLS = new Set([
  "display_price", "hide_price", "confirm_ownership",
  "reg_livestream_goods", "reg_livestream_goods_ai", "reg_livestream_goods_person",
  "reg_product_ad_video", "reg_product_ad_ai", "reg_product_ad_person", "reg_product_ad_platform_support",
  "reg_personal_brand_video", "reg_personal_brand_ai", "reg_personal_brand_person",
  "trust_platform", "direct_payment", "payment_via_wallet", "payment_via_platform",
]);

// Allowlisted writable columns (excludes id/document_id/timestamps/audit/locale).
const PRODUCT_COLS = new Set(
  "display_price hide_price address person_in_charge phone_number email confirm_ownership livestream_fee advertising_amount success_fee total_fees listing_type category_type condition_type nation province custom_id shape price_review_time time_live end_post_date goods_address geographic_scope status event_percent_fee event_fee main_page_view_count livestream_percent_fee livestream_note advertising_percent advertising_fee reg_livestream_goods reg_livestream_goods_percent reg_livestream_goods_fee reg_livestream_goods_ai reg_livestream_goods_person reg_product_ad_video reg_product_ad_percent reg_product_ad_fee reg_product_ad_ai reg_product_ad_person reg_product_ad_platform_support reg_personal_brand_video reg_personal_brand_percent reg_personal_brand_fee reg_personal_brand_ai reg_personal_brand_person goods_lat goods_lng live_participants live_bids live_session_updated_at sale_mode online_verification_time onsite_survey_time post_display_fee post_display_days affiliate_fee_percent vat_percent pit_percent trust_platform trust_deposit_amount".split(" ")
);

const ITEM_COLS = new Set(
  "row_index name model size color warranty_change_days warranty_repair_days repair_warranty_retention_percent max_delivery_days_after_acceptance handover_location contract_duration_multiplicity contract_duration_unit direct_payment deposit_requirement_direct payment_via_wallet deposit_requirement_wallet vat quantity_minimum unit unit_market_price unit_asking_price amount_desired auto_accept_price shape time_user_must_pay_after_delivery auto_reject_price quantity_min_require auto_accept_price_low auto_reject_price_low invoice_type payment_via_platform deposit_requirement quantity_estimated quantity_stock quantity_monthly asking_currency total_estimated remaining_payment quality_info_text note".split(" ")
);

function mapToColumns(raw: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "items" || k === "productItems") continue;
    if (v === "" || v === undefined || v === null) continue;
    const col = snake(k);
    if (!allowed.has(col)) continue;
    out[col] = BOOL_COLS.has(col) ? v === true || v === "true" || v === "1" : v;
  }
  return out;
}

// Faithful port of product controller create(): product + items + poster link.
// (File uploads via multipart are handled by the separate /pic & /files routes.)
export async function createProductFromBody(req: Request) {
  const user = await userFromBearer(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawBody = (body?.data as Record<string, unknown>) ?? body ?? {};

  let rawItems = (rawBody.items ?? rawBody.productItems ?? []) as unknown;
  if (typeof rawItems === "string") {
    try { rawItems = JSON.parse(rawItems); } catch { rawItems = []; }
  }
  if (!Array.isArray(rawItems)) rawItems = [];

  const now = new Date();
  const product = await prisma.products.create({
    data: {
      ...mapToColumns(rawBody, PRODUCT_COLS),
      status: (rawBody.status as string) || "draft",
      document_id: genDocumentId(),
      published_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  // poster link (products_poster_lnk)
  if (user?.id) {
    await prisma.products_poster_lnk.create({ data: { product_id: product.id, user_id: user.id } });
  }

  // items + link
  let ord = 1;
  for (const rawItem of rawItems as Record<string, unknown>[]) {
    const itemData = mapToColumns(rawItem, ITEM_COLS);
    if (itemData.row_index === undefined && rawItem.id !== undefined) itemData.row_index = rawItem.id;
    const item = await prisma.product_items.create({
      data: { ...itemData, document_id: genDocumentId(), published_at: now, created_at: now, updated_at: now },
    });
    await prisma.product_items_product_lnk.create({
      data: { product_id: product.id, product_item_id: item.id, product_item_ord: ord++ },
    });
  }

  return product;
}

async function findByRouteId(id: string) {
  return /^\d+$/.test(id)
    ? prisma.products.findFirst({ where: { id: Number(id) } })
    : prisma.products.findFirst({ where: { document_id: id } });
}

// PUT /products/:id — update product scalar fields (camelCase → columns).
export async function updateProductFromBody(req: Request, id: string) {
  const existing = await findByRouteId(id);
  if (!existing) return null;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawBody = (body?.data as Record<string, unknown>) ?? body ?? {};
  const data = mapToColumns(rawBody, PRODUCT_COLS);
  if (rawBody.status) data.status = rawBody.status;
  return prisma.products.update({ where: { id: existing.id }, data: { ...data, updated_at: new Date() } });
}

// DELETE /products/:id — removes the product (link tables cascade in the DB).
export async function deleteProductById(id: string) {
  const existing = await findByRouteId(id);
  if (!existing) return null;
  await prisma.products.delete({ where: { id: existing.id } });
  return existing;
}
