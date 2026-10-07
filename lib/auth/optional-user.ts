import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";

// Resolve the caller from the Bearer token if present, else null (never throws).
// Used by endpoints that work for guests but enrich with user info when logged in
// (e.g. live-session join / bids).
export async function optionalUser(req: Request): Promise<Record<string, unknown> | null> {
  const token = bearer(req);
  if (!token) return null;
  try {
    const { id } = verifyToken(token);
    if (!id) return null;
    const user = await prisma.up_users.findFirst({
      where: { id },
      select: { id: true, username: true, full_name: true, email: true },
    });
    return user as Record<string, unknown> | null;
  } catch {
    return null;
  }
}
