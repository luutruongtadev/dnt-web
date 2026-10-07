import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { userFromBearer, bearer } from "@/lib/auth";

// Faithful port of auth.js:getUserSessions — GET /auth/sessions.
export async function GET(req: Request) {
  if (!bearer(req)) return NextResponse.json({ error: "No token provided" }, { status: 401 });
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const sessions = await prisma.user_sessions.findMany({
    where: { user_id: user.id },
    orderBy: { last_login_at: "desc" },
  });
  return NextResponse.json({ data: sessions });
}
