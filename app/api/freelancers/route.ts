import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

export const GET = listHandler(prisma.freelancers, { maxAge: 60, cacheKey: "freelancers" });
