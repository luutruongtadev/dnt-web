import { PrismaClient } from "@prisma/client";

// Singleton Prisma client — avoids exhausting connections during dev HMR.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Runtime queries use the transaction pooler (DATABASE_URL, port 6543,
// pgbouncer=true). This is the connection Supabase/Prisma prescribe for
// serverless (Vercel): connections are released after each transaction, so
// many concurrent functions scale fine, and the transaction pooler targets
// the writable primary (no PG 25006 read-only errors).
//
// Do NOT use DIRECT_DATABASE_URL at runtime on serverless: in this project
// that URL is the Supavisor SESSION pooler (port 5432), which pins one
// dedicated connection per client for the function's whole lifetime. On
// Vercel that exhausts the pooler's connection cap within seconds, so new
// connections hang (~3s) until Prisma times out and every route 500s.
// DIRECT_DATABASE_URL stays reserved for introspection/migrations (directUrl).
const runtimeUrl = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: { db: { url: runtimeUrl } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
