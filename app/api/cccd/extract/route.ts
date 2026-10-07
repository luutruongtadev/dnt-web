import { NextResponse } from "next/server";
import { z } from "zod";
import { userFromBearer } from "@/lib/auth";
import { getLlmProvider } from "@/lib/llm";

const CccdSchema = z.object({
  fullName: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  sex: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  placeOfOrigin: z.string().nullable().optional(),
  placeOfResidence: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
});

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

// POST /api/cccd/extract
// Accepts { frontBase64: string (data URL), backBase64?: string (data URL) }
// Calls the active LLM provider (LLM_PROVIDER env) to extract CCCD fields.
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { frontBase64?: string; backBase64?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.frontBase64) {
    return NextResponse.json({ error: "frontBase64 is required" }, { status: 400 });
  }

  const front = parseDataUrl(body.frontBase64);
  if (!front) {
    return NextResponse.json({ error: "frontBase64 must be a data URL" }, { status: 400 });
  }

  const content: import("@/lib/llm").ContentPart[] = [
    { type: "text", text: "Đọc thông tin trên CCCD (Căn cước công dân) Việt Nam trong ảnh." },
    { type: "image", mediaType: front.mediaType, base64: front.base64 },
  ];

  if (body.backBase64) {
    const back = parseDataUrl(body.backBase64);
    if (back) {
      content.push({ type: "image", mediaType: back.mediaType, base64: back.base64 });
    }
  }

  try {
    const provider = getLlmProvider();
    const result = await provider.structured({
      label: "cccd-extract",
      system: [
        {
          text:
            "Bạn là hệ thống OCR chuyên nghiệp cho CCCD Việt Nam. " +
            "Trích xuất chính xác các trường: fullName (họ và tên, chữ hoa), " +
            "idNumber (số CCCD 12 chữ số), dateOfBirth (DD/MM/YYYY), " +
            "sex (Nam/Nữ), nationality (quốc tịch), placeOfOrigin (quê quán), " +
            "placeOfResidence (nơi thường trú), expiryDate (ngày hết hạn DD/MM/YYYY). " +
            "Trả về null cho trường không đọc được.",
        },
      ],
      messages: [{ role: "user", content }],
      schema: CccdSchema,
      maxTokens: 512,
    });

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("[cccd/extract]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Extraction failed" },
      { status: 502 },
    );
  }
}
