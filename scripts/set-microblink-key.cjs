// Usage: MICROBLINK_KEY=... node scripts/set-microblink-key.cjs
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const key = (process.env.MICROBLINK_KEY || "sRwCABZkbnQtd2ViLWNoaS52ZXJjZWwuYXBwBmxleUpEY21WaGRHVmtUMjRpT2pFM09URXpPVGsxTVRBd016Y3NJa055WldGMFpXUkdiM0lpT2lJNU1tTmhZMkZtWlMwM1pXSTJMVFF3TnpZdE9UZG1ZUzB3T0RNeE5XSmlZbUZsT0RjaWZRPT37YPt1Y5F4JK6E2+lL4uu9CWYuGzqV38D8k+TSOnZT6SMnn18Qi7/F6KVZmFuVkk4O0Dv1vadURwZPG0nTSaqvyv6a58KFLKH/m16OuUPZERNFJ8pBy6rLSypEC+jq").trim();
  if (!key) throw new Error("MICROBLINK_KEY is empty");
  const row = await prisma.system_configurations.findFirst({ orderBy: { id: "asc" } });
  if (!row) throw new Error("no system_configurations row");
  await prisma.system_configurations.update({ where: { id: row.id }, data: { microblink_license_key: key, updated_at: new Date() } });
  const check = await prisma.system_configurations.findFirst({ where: { id: row.id }, select: { id: true, microblink_license_key: true } });
  console.log("row", check.id, "key length", check.microblink_license_key.length);
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
