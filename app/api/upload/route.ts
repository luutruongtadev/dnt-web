import { NextResponse } from "next/server";
import { uploadFileToStorage } from "@/lib/storage/upload";
import { linkFileMorph } from "@/lib/services/files";

// Port of Strapi's built-in POST /api/upload (multipart `files`), used by the
// chat attachment flow and others. Optional ref/refId/field link the upload to
// an entry via the media morph (same as Strapi's upload `data`). Returns the
// created file objects as an array (Strapi upload-response shape).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ref = form.get("ref")?.toString();
  const refId = form.get("refId")?.toString();
  const field = form.get("field")?.toString();

  try {
    const uploaded = [];
    for (const file of files) {
      const row = await uploadFileToStorage(file);
      if (ref && refId && field) await linkFileMorph(row.id, ref, Number(refId), field);
      uploaded.push(row);
    }
    return NextResponse.json(uploaded);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
