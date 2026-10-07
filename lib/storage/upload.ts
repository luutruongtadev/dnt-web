import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/storage/supabase";
import { genDocumentId } from "@/lib/services/user-wallet";

const DIR = process.env.SUPABASE_BUCKET_DIRECTORY || "uploads";

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

// Uploads a File (web API) to Supabase Storage and records a `files` row,
// returning it in Strapi's upload-response shape. Replaces Strapi's upload plugin
// (strapi-upload-supabase-provider).
export async function uploadFileToStorage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extOf(file.name);
  const hash = `${file.name.replace(ext, "")}_${crypto.randomBytes(5).toString("hex")}`;
  const key = `${DIR}/${hash}${ext}`;

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(key, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: pub } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(key);
  const url = pub.publicUrl;
  const now = new Date();

  const row = await prisma.files.create({
    data: {
      document_id: genDocumentId(),
      name: file.name,
      hash,
      ext,
      mime: file.type || "application/octet-stream",
      size: Math.round((buffer.length / 1024) * 100) / 100, // KB, Strapi convention
      url,
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
