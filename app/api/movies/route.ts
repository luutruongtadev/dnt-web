import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

export const GET = listHandler(prisma.movies, { maxAge: 60, cacheKey: "movies" });
