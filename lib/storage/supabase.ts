import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client — replaces Strapi's strapi-upload-supabase-provider.
// Created lazily so importing an upload route doesn't crash when storage env is
// unset (creds come from dnt-be/.env: SUPABASE_API_URL / SUPABASE_API_KEY).
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const STORAGE_BUCKET =
  process.env.SUPABASE_BUCKET_NAME || process.env.SUPABASE_BUCKET || "uploads";
