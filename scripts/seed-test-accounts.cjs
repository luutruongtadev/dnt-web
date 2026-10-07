// Seeds 6 verified TEST accounts: 2 ca_nhan (CN), 2 ho_kinh_doanh (HKD), 2 doanh_nghiep (DN).
// Idempotent (keyed by cccd). Run: node scripts/seed-test-accounts.cjs
// Test login: cccd + PASSWORD below, recovery string RECOVERY. Never use these on production data.
require("dotenv").config({ path: ".env.local" });
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const PASSWORD = "Test@12345";
const RECOVERY = "test";
const gen = () => crypto.randomBytes(16).toString("hex").slice(0, 24);

const ACCOUNTS = [
  { cccd: "079000000001", type: "ca_nhan",       name: "NGUYEN VAN CN1" },
  { cccd: "079000000002", type: "ca_nhan",       name: "TRAN THI CN2" },
  { cccd: "079000000003", type: "ho_kinh_doanh", name: "HKD LE VAN HKD1",  tax: "8000000001" },
  { cccd: "079000000004", type: "ho_kinh_doanh", name: "HKD PHAM THI HKD2", tax: "8000000002" },
  { cccd: "079000000005", type: "doanh_nghiep",  name: "CONG TY TNHH DN1", tax: "0300000001" },
  { cccd: "079000000006", type: "doanh_nghiep",  name: "CONG TY CP DN2",   tax: "0300000002" },
];

const prisma = new PrismaClient();

(async () => {
  const role = await prisma.up_roles.findFirst({ where: { type: "authenticated" } });
  const password = await bcrypt.hash(PASSWORD, 10);
  const recovery_string = await bcrypt.hash(RECOVERY, 10);
  const now = new Date();

  for (const [i, a] of ACCOUNTS.entries()) {
    let user = await prisma.up_users.findFirst({ where: { cccd: a.cccd } });
    const data = {
      full_name: a.name, account_type: a.type, confirmed: true, blocked: false,
      password, recovery_string, otp: "123456", nation: "Vietnam",
      bank_name: "BIDV", bank_number: a.cccd, mobile_number: `090000000${i + 1}`,
      login_failure_count: 0, recovery_failure_count: 0, updated_at: now,
    };
    user = user
      ? await prisma.up_users.update({ where: { id: user.id }, data })
      : await prisma.up_users.create({
          data: { ...data, document_id: gen(), cccd: a.cccd, username: `test${i + 1}`, email: `test${i + 1}@example.com`,
                  reference_id: `T${String(i + 1).padStart(4, "0")}`, published_at: now, created_at: now },
        });

    if (role && !(await prisma.up_users_role_lnk.findFirst({ where: { user_id: user.id, role_id: role.id } }))) {
      await prisma.up_users_role_lnk.create({ data: { user_id: user.id, role_id: role.id } });
    }

    let wallet = await prisma.wallets.findFirst({ where: { OR: [{ user_id: BigInt(user.id) }, { cccd: a.cccd }] } });
    if (!wallet) {
      wallet = await prisma.wallets.create({
        data: { document_id: gen(), cccd: a.cccd, total: 0, account_of_goods: 0, account_of_freelancer: 0,
                account_of_ailive: 0, pending_amount: 0, user_id: BigInt(user.id), name: a.name,
                published_at: now, created_at: now, updated_at: now },
      });
    }
    if (!(await prisma.wallets_user_lnk.findFirst({ where: { wallet_id: wallet.id, user_id: user.id } })))
      await prisma.wallets_user_lnk.create({ data: { wallet_id: wallet.id, user_id: user.id } });
    if (!(await prisma.up_users_wallet_lnk.findFirst({ where: { user_id: user.id, wallet_id: wallet.id } })))
      await prisma.up_users_wallet_lnk.create({ data: { user_id: user.id, wallet_id: wallet.id } });

    if (a.type !== "ca_nhan") {
      let biz = await prisma.businesses.findFirst({ where: { user_id: user.id }, orderBy: { id: "desc" } });
      const bdata = {
        business_fullname: a.name, tax_code: a.tax, status: "verified",
        headquarters_address: "1 Nguyen Hue, Q1, TP.HCM", headquarters_address_nation_code: "VN",
        current_address: "1 Nguyen Hue, Q1, TP.HCM", current_address_nation_code: "VN", updated_at: now,
      };
      biz = biz
        ? await prisma.businesses.update({ where: { id: biz.id }, data: bdata })
        : await prisma.businesses.create({ data: { ...bdata, user_id: user.id, created_at: now } });
      await prisma.up_users.update({ where: { id: user.id }, data: { business_id: biz.id } });
    }
    console.log(`${a.type.padEnd(14)} id=${user.id} cccd=${a.cccd}`);
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
