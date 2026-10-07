"use client";
import { useEffect, useState } from "react"
import { supabaseRealtimeChat } from "../config/supabase-realtime-chat-client"

// Tracks who's currently online via Supabase Presence on a shared channel.
// Keyed by userId (not per-connection) so multiple tabs from the same user
// collapse into a single online entry instead of flickering as tabs open/close.
const usePresence = ({ userId, enabled }) => {
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set())

  useEffect(() => {
    if (!enabled || !userId || !supabaseRealtimeChat) return

    const channel = supabaseRealtimeChat.channel("presence:online", {
      config: {
        private: true,
        presence: { key: String(userId) },
      },
    })

    const syncOnline = () => {
      const state = channel.presenceState()
      setOnlineUserIds(new Set(Object.keys(state)))
    }

    channel
      .on("presence", { event: "sync" }, syncOnline)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, last_seen: new Date().toISOString() })
        }
      })

    return () => {
      supabaseRealtimeChat.removeChannel(channel)
      setOnlineUserIds(new Set())
    }
  }, [userId, enabled])

  const isOnline = (id) => onlineUserIds.has(String(id))

  return { onlineUserIds, isOnline }
}

export default usePresence
