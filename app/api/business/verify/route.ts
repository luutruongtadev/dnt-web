import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { userHasDocuments, markBusinessVerified } from "@/lib/services/business";
import { notify } from "@/lib/services/notify";

// POST /business/verify — faithful port of business.js:verifyBusiness.
// Has documents → mark business 'verified' + notify; otherwise fail.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    if (!(await userHasDocuments(user.id))) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: "Verification failed: no documents found for this user",
      });
    }

    await markBusinessVerified(user.id);
    await notify({ userId: user.id, templateCode: "BUSINESS_VERIFIED" });

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Business verified successfully",
    });
  } catch (err) {
    console.error("Verify business error:", err);
    return NextResponse.json({ error: "An error occurred while verifying business" }, { status: 500 });
  }
}
