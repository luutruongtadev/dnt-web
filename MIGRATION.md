# dnt-be (Strapi 5) + dnt-fe (Vite/React 19) → dnt-web (Next.js 16) — Rewrite Plan

**Strategy:** big-bang rewrite into one fullstack Next.js app. Old repos
(`../dnt-be`, `../dnt-fe`) are kept **read-only as reference** until cutover.
**Admin:** devs-only — no full CMS admin UI to rebuild; minimal CRUD / SQL is fine.
**DB:** Supabase Postgres (existing). Reuse the live schema via `prisma db pull`
against a **branch/dump on the 5432 direct port** — never the 6543 prod pooler.

## Stack mapping

| Strapi (dnt-be) | Next.js (dnt-web) |
| --- | --- |
| 25 content types + 19 relations | Prisma models (`prisma/schema.prisma`) |
| REST controllers/routes (34 api groups) | Route Handlers (`app/api/**/route.ts`) |
| `users-permissions` (auth/roles/JWT) | Auth.js (`lib/auth`) + middleware |
| `strapi-upload-supabase-provider` | `@supabase/supabase-js` (`lib/storage`) |
| policies (`require-cccd-verified`, `require-not-blocked`) | middleware / per-route guards |
| documentation plugin (OpenAPI) | zod schemas + generated docs |
| admin panel | minimal `app/(admin)` CRUD pages |

## Frontend (dnt-fe) migration

- Vite → Next App Router. ~37 pages in `src/pages` → `app/(site)/**`.
- react-router-dom 7 → file routing; `ProtectedRoute` → middleware/layout guard.
- Keep: Redux Toolkit, Tailwind 4, i18next (→ client provider or next-intl).
- 18 axios services (`src/services/*Service.js`) → typed fetch client (`lib/api`).
- **Browser-only libs** — wrap in `dynamic(() => ..., { ssr: false })` / `'use client'`:
  `tesseract.js`, `@microblink/blinkid`, `react-webcam`, `leaflet`, `@zxing/library`.

## Backend port order (low → high risk)

Default CRUD stubs (ctrl≈9, svc≈9) first — nearly mechanical:
`audit-trail, content-variable, event, global, message, noti-template,
payment-transaction, upload-job, vietnam-info, additional-transaction,
collateral, realtime-token, system-configuration, with-drawth-transaction,
freelancer, movie, live, system-info, product-item, video`

Then heavy custom logic:
- `product` (685 LOC ctrl, 134 routes)
- `business` (302)
- `conversation` / messaging (624 ctrl + Firebase Realtime DB)
- `friend-request` (204)
- `user-document` (144) + `document` generation (docxtemplater / pdf-lib / puppeteer)
- `contract` (89 svc) + `reconciliation` (157 svc)

**Highest risk — do last, with parity tests + shadow reconciliation against prod:**
- `auth` (2,100 LOC — JWT, QR login, OTP, password recovery, reCAPTCHA)
- `wallet` (152 ctrl + 151 svc), `payment-connector` / SEPAY (273 svc, webhook)

## Open questions / risks

1. **Data migration** — Strapi link-table naming & component tables must map into
   the cleaned Prisma schema; validate against a prod dump, not fresh data.
2. **Auth parity** — existing JWTs/sessions must keep working through cutover.
3. **Financial correctness** — wallet/SEPAY/reconciliation need behavioral parity
   tests before the old backend is turned off.
4. **Realtime** — Firebase Realtime DB + Supabase realtime-token flows.

## Frontend migration — DONE (builds green, 36 routes)

Vite/React SPA ported into the App Router. Key moves:
- Shared code (components/services/hooks/context/store/i18n/locales/styles/assets)
  copied in as-is; `src/pages` → `views/` (avoids Next Pages Router collision).
- `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*` (27 files).
- react-router-dom kept OFF the call sites via `lib/router-compat.jsx` — a shim
  mapping useNavigate/useLocation/useParams/useSearchParams/Link/NavLink/Navigate/
  Outlet/useOutletContext onto `next/navigation`. 46 files just repointed imports.
  (react-router-dom still a dep; call sites can migrate to native over time.)
- All view/component/hook files marked `"use client"` (134 files).
- Routes render views via `dynamic(ssr:false)` — client-only, matching the
  original SPA (views read localStorage/window at render). `FilterReducer` had
  module-eval localStorage → guarded for the server-prerendered Redux Provider.
- Shell: `app/layout.tsx` + `app/providers.tsx` (Redux + i18n + PasswordGate +
  background-restore + alive ping) replaces `main.jsx`/`App.jsx`.
- Protected routes → `app/(protected)/layout.tsx` auth guard (localStorage token).
- forgot-password nested flow → Next layout + Outlet-context bridge.
- FE still calls the existing Strapi over HTTP via `NEXT_PUBLIC_API_URL`.

**Not yet verified:** interactive click-through + live API calls (needs Strapi
running + a browser). Build, typecheck, prerender of all 36 routes, and `next
start` HTTP 200s are confirmed.

## ⚠️ CRITICAL: the Supabase Postgres is SHARED by multiple apps

`prisma db pull` introspected **201 tables**, only **91 of which are DNT/Strapi**.
The same database also hosts:
- **Supabase Auth** (`auth` schema, 22 tables) — managed by Supabase.
- **n8n** (workflow automation): `workflow_entity`, `execution_*`, `credentials_entity`,
  `webhook_entity`, `insights_*`, `data_table*`, etc.
- **A co-tenant AI/recruiting app**: `chat_hub_*`, `interview_sessions`, `gap_analyses`,
  `job_descriptions`, `llm_*`, `stories`, `documents`, `payments`, `invoices`,
  `subscriptions`, `user_sessions` (this app's `user_sessions` even FKs into DNT's
  `up_users` — the two share the Strapi user table).

Consequences, baked into `prisma/schema.prisma`:
- The committed schema contains **ONLY the 91 DNT tables** (carved out of the full
  pull; the complete introspection is preserved in `prisma/schema.full.prisma`).
- **NEVER run `prisma migrate dev`/`deploy` or `prisma db push` against this DB** —
  Prisma would see the 110 co-tenant tables as "drift" and try to DROP them.
  For DNT schema changes use targeted hand-written SQL, OR (strongly recommended)
  **give DNT its own database/Postgres schema** before the backend rewrite proceeds.
- Index `@@map` names were suffixed `_idx` to resolve Strapi's FK/index name
  collisions (safe: map names only matter for migrations, which we won't run here).

## DNT data model — DONE (91 models, validates, client generates)

- Strapi system: `strapi_*`, `admin_*`, `up_*` (users-permissions), `files*`,
  `upload_*`, `i18n_locale`, `components_shared_*`.
- Content types + their `_lnk` link tables: products, businesses, conversations,
  messages, wallets, friend_requests, freelancers, videos, product_items, etc.
- Financial: `wallets`, `wallet_ledger_entries`, `ledger_{accounts,entries,transactions}`,
  `payment_transactions`, `additional_transactions`, `with_drawth_transactions`,
  `reconciliation_reports` (confirmed DNT via wallet_id/cccd FKs).

## Status

- [x] Phase 0: Next.js scaffold, skeleton dirs, Prisma/Supabase/zod installed, env mapped
- [x] Frontend: Vite→Next App Router migration (builds green)
- [x] DB introspected; DNT-only Prisma schema carved out (91 models, validates)
- [x] Backend-port pattern proven: `lib/api/rest.ts` (Strapi-envelope helper,
      BigInt-safe, listHandler/singleHandler, published_at-aware).
- [x] 26 read endpoints ported & live (Next Route Handlers → Prisma → Supabase,
      all HTTP 200): vietnam-info, events, movies, lives, collaterals,
      noti-templates, content-variables, system-infos, businesses, products,
      product-items, freelancers, videos, wallets, conversations, messages,
      friend-requests, additional-transactions, payment-transactions,
      with-drawth-transactions, reconciliation-reports, audit-trails,
      user-documents, upload-jobs, global(single), system-configuration(single).
      NOTE: these return base columns only — relations (_lnk tables) not yet
      populated; Strapi `?populate=` semantics still to add where the FE needs it.
- [ ] DECIDE: dedicated DNT database/schema vs shared (blocks any migrate)
- [ ] Auth.js (replace users-permissions / align with Supabase auth) — NEXT big milestone
- [ ] Port remaining read endpoints, then writes, then heavy modules (product,
      conversation, wallet/SEPAY, document gen), financial last
- [x] Product endpoints upgraded: `/api/products` (filter params + pagination +
      image population from files_related_mph) and `/api/products/[id]` (detail by
      documentId or numeric id, populates pictures/poster/items/videos).
      Helper: `lib/api/media.ts` (`mediaByRelatedId`, `fileToStrapi`).
- [x] Flipped FE `NEXT_PUBLIC_API_URL` → `/api` (same-origin). VERIFIED IN BROWSER:
      /list-of-goods renders live products from Next+Prisma (Strapi stopped),
      filters + pagination hit /api/products 200, /api/vietnam-info 200.
      Known: list sends isEmptyPic=true (lightweight, no pics in cards — matches
      old behavior); `POST /api/alive` 404 (write endpoint not ported yet).

## Auth — login + me ported (faithful to Strapi logic)

Decision taken: **port Strapi's own JWT scheme** (not Auth.js/Supabase) — "dùng logic như cũ".
- `lib/auth/index.ts`: bcryptjs compare, jsonwebtoken sign/verify ({ cccd, id }, 7d),
  bearer parse, recaptcha gate (enforced only if RECAPTCHA_ENABLED=true).
- `POST /api/auth/login` — faithful port of api/auth/controllers/auth.js:login:
  blocked / temp_blocked_until / is_in_final_chance / login_failure_count(>=5) /
  bcrypt check / failure-count increment / user_sessions device tracking +
  unfamiliar-device OTP / JWT issue. Same status codes + error bodies the FE expects
  (PERMANENTLY_BLOCKED, TEMP_BLOCKED, RECOVERY_REQUIRED, OTP_REQUIRED, INVALID_CREDENTIALS).
- `GET /api/auth/me` — Bearer → user by cccd, password stripped.
- Re-added `user_sessions` to the schema (it's DNT's device table; was mis-bucketed).
- Env: JWT_SECRET (fresh test secret in .env.local), RECAPTCHA_ENABLED=false.

VERIFIED (error paths, no prod writes): 400 missing creds, 401 unknown cccd, 401 no token.
NOT auto-tested: a real login (needs real cccd+password; the wrong-password path WRITES
to prod — increments failure counter, 5 = lockout). Test in the browser with a real account.
⚠️ Login now WRITES to the shared prod DB (user_sessions rows, failure counters).

## Recovery (forgot-password) flow ported — faithful to recovery.js

The already-migrated forgot-password UI's 3 endpoints are live:
- `POST /api/v1/auth/recover/verify` — bank_number lookup, bcrypt recovery string,
  blocked/temp-block/final-chance, failure-count→temp-block(10min)+final-chance,
  reset-token issue, requiresOtp when was-in-final-chance.
- `POST /api/v1/auth/recover/verify-otp` — token+otp, final-chance block, rotates token.
- `POST /api/v1/auth/recover/reset` — password policy, token expiry, OTP gate,
  same-as-previous(409), bcrypt hash, single-use token.
Helpers added to `lib/auth`: generateResetToken, hashPassword, verifyRecoveryHash,
validatePasswordPolicy. Audit-log side writes intentionally omitted (non-functional).
VERIFIED error paths (no prod writes): missing fields 400, unknown account 400,
bad/expired token 400, weak password 400.

NOTE: editing files under `lib/` that route handlers import needs a `next dev`
restart — Turbopack HMR serves a stale module otherwise ("X is not a function").

## Full auth surface + alive + write helpers — DONE

Account mgmt (faithful ports): `register` (bcrypt, recovery-string, role link,
avatar/signature media morph, ensureUserWallet, JWT), `change-password`,
`change-otp`, `set-recovery-string`, `verify-bank-number`, `update-address`,
`sessions` (GET), `sessions/toggle-status`.
QR login: `generate-qr`, `generate-qr-info`, `verify-qr`, `qr-login`, `check-qr`
(in-memory store `lib/auth/qr-store.ts` — move to Redis/DB for multi-instance prod).
Services: `lib/services/user-wallet.ts` (ensureUserWallet + wallet/link tables),
`lib/services/files.ts` (createFileEntry + media morph link).
Writes: `/api/alive` (full port — upserts site_presences, online count) +
generic `createHandler`/`updateHandler`/`deleteHandler` in `lib/api/rest.ts`.

VERIFIED live: alive writes presence (online:2), register/change-password 400s,
verify-bank-number ok, token-guarded routes 401, QR generate→poll pending. tsc clean.

## Product writes + remaining auth — DONE (54 routes, tsc clean)

- Product CRUD: `POST /products` (custom create — camelCase→column mapping via
  lodash-style snakeCase, bool coercion, product + items + poster link;
  `lib/api/product-write.ts`), `PUT/DELETE /products/[id]`. Multipart file upload
  (/pic, /files) still TODO.
- Auth completed: `/auth/update` (updateUser + avatar morph), `/auth/search`,
  `/auth/search-users`, and the `/auth/recovery/*` 5-step variants
  (verify-account/verify-recovery/verify-otp/verify-balance/verify-cccd) with
  `handleRecoveryFailure` (1st fail→30min temp, 2nd→permanent block).
- Helper added: `lib/services/files.ts:mediaUrlFor`, `lib/auth/recovery-helpers.ts`.
VERIFIED error paths (no writes): all 401/400 correct; product create verified by
typecheck only (live insert skipped to avoid junk rows in the shared prod DB).

## Chat (conversation/messaging) + file upload — DONE (64 routes, tsc clean)

Chat (`lib/services/chat.ts`, link-table queries batched to avoid N+1):
- `GET/POST /conversations` (list / find-or-create 1:1 + participant links + unhide)
- `GET /conversations/unread-count`, `GET /conversations/sync` (list + new messages
  + marks active read; incoming_friend_requests=[] until friend-request module ported)
- `GET/POST/DELETE /conversations/[id]/messages` (history / send + attachment morph +
  touch last-message / clear)
- `POST /conversations/[id]/read|hide|mute|report`, `DELETE /conversations/[id]` (remove)
All participant-gated; VERIFIED all chat routes 401 without token.

File upload (`lib/storage/upload.ts`, lazy Supabase client in `lib/storage/supabase.ts`):
- `POST /api/upload` (Strapi's built-in upload — multipart `files`, optional
  ref/refId/field to morph-link; used by chat attachments). → Supabase Storage + files row.
- `POST /products/[id]/files/[field]` (product media fields).
VERIFIED: no-file→400; real upload reaches Storage (needs SUPABASE_API_URL +
SUPABASE_API_KEY/service key in .env.local — same values Strapi used).
NOTE: realtime is client-side via Supabase (FE subscribes to the messages table);
no server broadcast needed. Images also still go straight to Cloudinary client-side.

## Friend-request + product live-session + metrics — DONE

(were listed as NEXT but have since been ported.)
- Friend-request: `GET/POST /friend-requests`, `/incoming`, `/outgoing`,
  `/[id]/accept`, `/[id]/reject` (`lib/services/friend-request.ts`); feeds
  conversations/sync's incoming list.
- Product live-session sub-routes: `/products/[id]/live-session` (+ `/join`,
  `/bids`), `/products/[id]/pic`, `/products/goods-videos`
  (`lib/services/product-live.ts`).
- System metrics: `/system-info/metrics` (`lib/services/metrics.ts`).

## Business module — DONE (3 routes, tsc clean)

Faithful port of api/business/controllers/business.js (`lib/services/business.ts`):
- `POST /api/business` — createOrUpdateBusiness: upserts the user's LATEST
  business (max id) by column, syncs `up_users.business_id`, upserts attached
  `user_documents` by (type,user_id) and morph-links their `file_ids` (replaces
  existing `file` links on update). Returns created-vs-updated message.
- `GET /api/business/me` — latest business for the user (null + message if none).
- `POST /api/business/verify` — pass iff the user has ≥1 user_document → marks
  business `status='verified'` + fires BUSINESS_VERIFIED notification; else fail.
Notifications: `lib/services/notify.ts` — port of notification-dispatcher +
realtime-notify; in-app via `realtime.send(...)` (Supabase Realtime) by template
code, `{key}` interpolation; email/sms/push stay stubs. Reusable by wallet later.
VERIFIED live (no prod writes): all 3 routes 401 without/with-bad token; tsc clean.

## Wallet + SEPAY — DONE (7 routes, tsc clean)

Core financial engine + payment gateway ported faithful to the original.

**Services:**
- `lib/services/money.ts` — roundMoney / isValidAmount / moneyEquals (float-safe 2dp).
- `lib/services/risk.ts` — assertWithinLimits: per-tx min/max + daily outgoing cap
  (WITHDRAW_HOLD + TRANSFER); reads `system_configurations.risk_limits` with
  DEFAULT_LIMITS fallback.
- `lib/services/wallet-ledger.ts` — port of wallet-ledger.js (852 LOC):
  double-entry ledger via Prisma interactive transactions + `SELECT … FOR UPDATE`
  row locks. Writes `ledger_transactions`, `ledger_entries`, `wallet_ledger_entries`
  (legacy compat), `wallets` cache, `payment_transactions`. Idempotency on
  (type, referenceType, referenceId) + idempotencyKey. Public API: `deposit`,
  `transfer`, `internalTransfer`, `holdWithdrawal`, `captureWithdrawal`,
  `releaseWithdrawal`, `getWalletLedger`, `hasLedgerTransaction`.
- `lib/payment/sepay.ts` — `verifyWebhook` (timingSafeEqual on Apikey header,
  parse DNT{id} code), `createDepositIntent` (VietQR URL builder).

**Routes:**
- `GET  /wallets/my-wallet` — user's wallet via up_users_wallet_lnk; ensureUserWallet if none.
- `GET  /wallets/favorite-wallets` — linked wallets via wallets_user_lnk.
- `GET  /wallets/my-ledger?limit=&offset=` — paginated double-entry ledger.
- `POST /wallets/transfer` — transfer between wallets (risk check → ledger.transfer).
- `POST /wallets/internal-transfer` — move to sub-account goods/freelancer/ailive.
- `POST /payment/deposit-intent/sepay` — returns QR/bank info for user to transfer.
- `POST /payment/webhook/[provider]` — SEPAY posts here on bank transfer; verify
  Apikey → find wallet by DNT{id} → risk check → ledger.deposit (idempotent).

VERIFIED live (no prod writes): all 7 routes correct status without auth/bad-key;
webhook /unknown → 404; tsc clean.

⚠️ NOT live-tested with real money / real SEPAY call — test in staging with
parity checks before enabling SEPAY_WEBHOOK_API_KEY + SEPAY_BANK_ACCOUNT in prod.

## NEXT (not yet ported)

- [ ] Document generation (docxtemplater / pdf-lib / puppeteer) + contract/sign endpoints.
- [ ] Reconciliation run endpoint.
- [ ] User-document upload controller (upload CCCD/business doc files).
- [ ] STILL OPEN: DB isolation (no migrate against shared DB).
- [ ] STILL OPEN: DB isolation (no migrate against shared DB); relation populate on
      remaining read endpoints; set SUPABASE storage creds for uploads.
- [ ] Heavy custom controllers: product sub-routes (pic upload, live-session),
      conversation/messaging, wallet/SEPAY, document generation. Financial last.
- [ ] `?populate=` + filters on the remaining collection endpoints as the FE needs.
- [ ] Auth.js (users-permissions replacement)
- [ ] Port API modules (order above)
- [ ] Migrate FE pages/services
- [ ] Admin CRUD, notifications, audit, realtime
- [ ] Data migration + cutover; decommission dnt-be/dnt-fe
