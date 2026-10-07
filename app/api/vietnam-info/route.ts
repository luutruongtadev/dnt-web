import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

// Strapi `vietnam-info` content-type (read-only).
export const GET = listHandler(prisma.vietnam_infos, { maxAge: 300, cacheKey: "vietnam-info" });
