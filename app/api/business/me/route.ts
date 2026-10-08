import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { getLatestBusiness } from "@/lib/services/business";

// GET /business/me — faithful port of business.js:getMyBusiness.
export async function GET(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const business = await getLatestBusiness(user.id);
    // The customer's saved "Địa chỉ hiện tại" lives on the user row, not the business
    // record — return it alongside so the page has it even when no business exists.
    const user_address = { address_no: user.address_no, address_on_map: user.address_on_map };
    const noStore = { headers: { "Cache-Control": "no-store" } };
    if (!business) {
      return NextResponse.json(
        { success: true, data: null, user_address, message: "No business information found" },
        noStore
      );
    }
    return NextResponse.json({ success: true, data: business, user_address }, noStore);
  } catch (err) {
    console.error("Get business error:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching business information" },
      { status: 500 }
    );
  }
}
