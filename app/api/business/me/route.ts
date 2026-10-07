import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { getLatestBusiness } from "@/lib/services/business";

// GET /business/me — faithful port of business.js:getMyBusiness.
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const business = await getLatestBusiness(user.id);
    if (!business) {
      return NextResponse.json({ success: true, data: null, message: "No business information found" });
    }
    return NextResponse.json({ success: true, data: business });
  } catch (err) {
    console.error("Get business error:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching business information" },
      { status: 500 }
    );
  }
}
