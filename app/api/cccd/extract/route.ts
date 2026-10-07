import { NextResponse } from "next/server";
import { userFromBearer } from "@/lib/auth";

// POST /api/cccd/extract
// Accepts { frontBase64: string (data URL), backBase64?: string (data URL) }
// Calls CheaperInference vision model to extract CCCD fields and returns structured JSON.
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

  const apiKey = process.env.CHEAPERINFERENCE_API_KEY;
  const model = process.env.CHEAPERINFERENCE_MODEL || "gpt-5.6-sol";
  const baseUrl = (process.env.CHEAPERINFERENCE_BASE_URL || "https://api.cheaperinference.com/v1").replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json({ error: "CCCD extraction service not configured" }, { status: 503 });
  }

  const imageContent: unknown[] = [
    {
      type: "text",
      text: `Bạn là hệ thống OCR chuyên nghiệp. Hãy đọc thông tin trên CCCD (Căn cước công dân) Việt Nam trong ảnh và trả về JSON với các trường:
- fullName: họ và tên đầy đủ (chữ hoa)
- idNumber: số CCCD (12 chữ số)
- dateOfBirth: ngày sinh định dạng DD/MM/YYYY
- sex: giới tính (Nam hoặc Nữ)
- nationality: quốc tịch
- placeOfOrigin: quê quán
- placeOfResidence: nơi thường trú
- expiryDate: ngày hết hạn định dạng DD/MM/YYYY

Chỉ trả về JSON object, không giải thích. Nếu không đọc được trường nào, để null.`,
    },
    {
      type: "image_url",
      image_url: { url: body.frontBase64 },
    },
  ];

  if (body.backBase64) {
    imageContent.push({
      type: "image_url",
      image_url: { url: body.backBase64 },
    });
  }

  const payload = {
    model,
    messages: [{ role: "user", content: imageContent }],
    response_format: { type: "json_object" },
    max_tokens: 512,
  };

  let llmRes: Response;
  try {
    llmRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[cccd/extract] fetch error:", err);
    return NextResponse.json({ error: "Network error reaching LLM" }, { status: 502 });
  }

  if (!llmRes.ok) {
    const errText = await llmRes.text().catch(() => "");
    console.error("[cccd/extract] LLM returned", llmRes.status, errText);
    return NextResponse.json({ error: "LLM extraction failed", detail: errText }, { status: 502 });
  }

  const llmData = await llmRes.json();
  const content: string = llmData.choices?.[0]?.message?.content ?? "";

  try {
    const extracted = JSON.parse(content);
    return NextResponse.json({ success: true, data: extracted });
  } catch {
    console.error("[cccd/extract] failed to parse LLM JSON:", content);
    return NextResponse.json({ error: "Failed to parse extraction result", raw: content }, { status: 502 });
  }
}
