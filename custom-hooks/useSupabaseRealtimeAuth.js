"use client";
import { useEffect, useRef, useState } from "react"
import { supabaseRealtimeChat } from "../config/supabase-realtime-chat-client"
import { getRealtimeToken } from "../services/realtimeTokenService"

// Fetches a Strapi-minted, Supabase-compatible token and authenticates the
// chat realtime client with it, so private channel subscriptions (Realtime
// Authorization) are scoped to the calling user. Refreshes before expiry and
// exposes a bump on CHANNEL_ERROR/TIMED_OUT so callers can force a re-mint.
const useSupabaseRealtimeAuth = (enabled) => {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const refreshTimerRef = useRef(null)

  const mintAndApply = async () => {
    if (!supabaseRealtimeChat) return
    try {
      const { token, expires_in } = await getRealtimeToken()
      await supabaseRealtimeChat.realtime.setAuth(token)
      setIsAuthReady(true)
      // TODO(debug): remove once realtime rollout is confirmed stable.
      console.log("[realtime] auth ready, expires_in", expires_in)

      clearTimeout(refreshTimerRef.current)
      const refreshInMs = Math.max((expires_in || 3600) * 0.8, 30) * 1000
      refreshTimerRef.current = setTimeout(mintAndApply, refreshInMs)
    } catch (err) {
      console.error("Error minting realtime token:", err)
      // Retry with backoff rather than leaving the client permanently unauthenticated.
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(mintAndApply, 15000)
    }
  }

  useEffect(() => {
    if (!enabled) return
    mintAndApply()
    return () => clearTimeout(refreshTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { isAuthReady, forceRefresh: mintAndApply }
}

export default useSupabaseRealtimeAuth
