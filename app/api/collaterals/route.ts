import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

export const GET = listHandler(prisma.collaterals, { maxAge: 60, cacheKey: "collaterals" });
