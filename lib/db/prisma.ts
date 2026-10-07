import { PrismaClient } from "@prisma/client";

// Singleton Prisma client — avoids exhausting connections during dev HMR.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Always use the direct (port 5432) connection for runtime queries.
// The pooler URL (port 6543 / pgbouncer=true) can route connections to a
// read replica, causing PG error 25006 ("cannot execute INSERT in a
// read-only transaction") on any write operation.
const runtimeUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: { db: { url: runtimeUrl } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
