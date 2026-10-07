import { prisma } from "@/lib/db/prisma";
import { listHandler } from "@/lib/api/rest";

export const GET = listHandler(prisma.noti_templates, { maxAge: 300, cacheKey: "noti-templates" });
