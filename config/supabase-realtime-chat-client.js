import { createClient } from "@supabase/supabase-js"

// Dedicated client for authenticated chat realtime channels — kept separate
// from the anon client in supabase-client.js (used by the metrics dashboard)
// so that calling supabase.realtime.setAuth() for chat can't affect that
// unrelated, unauthenticated subscription.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseRealtimeChat = null
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseRealtimeChat = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  }
} catch {}

export { supabaseRealtimeChat }
