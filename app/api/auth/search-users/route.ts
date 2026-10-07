import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bearer, verifyToken } from "@/lib/auth";
import { mediaUrlFor } from "@/lib/services/files";

const USER_MORPH = "plugin::users-permissions.user";

// Faithful port of auth.js:searchUsers — GET /auth/search-users?query=... (authed).
export async function GET(req: NextRequest) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });
  let me: number | undefined;
  try {
    me = verifyToken(token).id;
    if (!me) throw new Error("Invalid token payload");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const users = await prisma.up_users.findMany({
    where: {
      id: { not: me },
      OR: [
        { bank_number: { contains: query, mode: "insensitive" } },
        { full_name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
  });

  const result = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      full_name: u.full_name,
      bank_number: u.bank_number,
      avt: await mediaUrlFor(USER_MORPH, u.id, "avt"),
    }))
  );
  return NextResponse.json(result);
}
