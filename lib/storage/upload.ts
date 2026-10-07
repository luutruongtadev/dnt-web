import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { genDocumentId } from "@/lib/services/user-wallet";

const DIR = (process.env.SUPABASE_BUCKET_DIRECTORY || "uploads").replace(/\/$/, "");
const BUCKET = process.env.SUPABASE_BUCKET_NAME || process.env.SUPABASE_BUCKET || "uploads";

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

function getStorageConfig() {
  const url = (process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage not configured (set SUPABASE_API_URL + SUPABASE_API_KEY)");
  }
  return { url, key };
}

// Uploads a File (web API) to Supabase Storage via the REST API directly —
// bypasses @supabase/supabase-js which rejects the sb_secret_* key format as
// "Invalid Compact JWS". The Storage REST API accepts any Bearer token.
export async function uploadFileToStorage(file: File) {
  const { url: supabaseUrl, key: apiKey } = getStorageConfig();
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extOf(file.name);
  const hash = `${file.name.replace(ext, "")}_${crypto.randomBytes(5).toString("hex")}`;
  const objectKey = `${DIR}/${hash}${ext}`;
  const mime = file.type || "application/octet-stream";

  // PUT to Supabase Storage REST API
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${objectKey}`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": mime,
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => "");
    throw new Error(`Storage upload failed: ${uploadRes.status} ${detail.slice(0, 200)}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectKey}`;
  const now = new Date();

  const row = await prisma.files.create({
    data: {
      document_id: genDocumentId(),
      name: file.name,
      hash,
      ext,
      mime,
      size: Math.round((buffer.length / 1024) * 100) / 100, // KB, Strapi convention
      url: publicUrl,
      provider: "supabase",
      folder_path: "/",
      published_at: now,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: row.id,
    documentId: row.document_id,
    name: row.name,
    hash: row.hash,
    ext: row.ext,
    mime: row.mime,
    size: row.size,
    url: row.url,
    provider: row.provider,
    createdAt: row.created_at,
  };
}
