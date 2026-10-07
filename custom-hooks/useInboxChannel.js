"use client";
import { useEffect, useRef } from "react"
import { supabaseRealtimeChat } from "../config/supabase-realtime-chat-client"

// Subscribes once per session to this user's private `user:{id}:inbox`
// channel — pushes last_message/last_message_at updates for any of the
// user's conversations, replacing the conversations-list half of the old poll.
// Also carries in-app notifications (deposit/withdraw/transfer events pushed
// by wallet-ledger via common/services/realtime-notify.js on the backend)
// under the same channel's `notification` broadcast event.
const useInboxChannel = ({ userId, enabled, onConversationUpdated, onNotification }) => {
  const callbackRef = useRef(onConversationUpdated)
  callbackRef.current = onConversationUpdated
  const notificationRef = useRef(onNotification)
  notificationRef.current = onNotification

  useEffect(() => {
    if (!enabled || !userId || !supabaseRealtimeChat) return

    const channel = supabaseRealtimeChat
      .channel(`user:${userId}:inbox`, { config: { private: true } })
      .on("broadcast", { event: "conversation_updated" }, ({ payload }) => {
        if (payload) callbackRef.current?.(payload)
      })
      .on("broadcast", { event: "notification" }, ({ payload }) => {
        if (payload) notificationRef.current?.(payload)
      })
      .subscribe((status, err) => {
        // TODO(debug): remove once realtime rollout is confirmed stable.
        console.log(`[realtime] user:${userId}:inbox ->`, status, err || "")
      })

    return () => {
      supabaseRealtimeChat.removeChannel(channel)
    }
  }, [userId, enabled])
}

export default useInboxChannel
