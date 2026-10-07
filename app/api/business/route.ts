import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";
import { createOrUpdateBusiness } from "@/lib/services/business";

// POST /business — faithful port of business.js:createOrUpdateBusiness.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) ?? {};

  try {
    const { business, savedDocuments, created } = await createOrUpdateBusiness(user.id, body);
    return NextResponse.json({
      success: true,
      message: created ? "Business created successfully" : "Business updated successfully",
      data: business,
      documents: savedDocuments,
    });
  } catch (err) {
    console.error("Create/Update business error:", err);
    return NextResponse.json(
      { error: "An error occurred while saving business information" },
      { status: 500 }
    );
  }
}
