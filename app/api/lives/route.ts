import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

export const GET = listHandler(prisma.lives, { maxAge: 60, cacheKey: "lives" });
