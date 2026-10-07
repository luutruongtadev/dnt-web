import { prisma } from "@/lib/db/prisma";
import { singleHandler } from "@/lib/api/rest";

export const GET = singleHandler(prisma.globals);
