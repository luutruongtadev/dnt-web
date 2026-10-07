"use client";
import { useEffect, useRef, useState } from "react"
import { supabaseRealtimeChat } from "../config/supabase-realtime-chat-client"

const TYPING_AUTO_CLEAR_MS = 3000

// Subscribes to the private `conversation:{id}` channel: pushes new messages
// and read-receipt updates as they happen (replacing the 4s poll for the
// open conversation), plus an ephemeral typing indicator broadcast. On
// resubscribe after a drop, calls onGapFill() once as a safety net so nothing
// sent while disconnected is missed.
const useConversationChannel = ({
  conversationId,
  enabled,
  onInsert,
  onUpdate,
  onGapFill,
  onTypingChange,
}) => {
  const [peerTyping, setPeerTyping] = useState(false)
  const channelRef = useRef(null)
  const hadDropRef = useRef(false)
  const peerTypingTimeoutRef = useRef(null)
  const callbacksRef = useRef({ onInsert, onUpdate, onGapFill, onTypingChange })
  callbacksRef.current = { onInsert, onUpdate, onGapFill, onTypingChange }

  useEffect(() => {
    if (!enabled || !conversationId || !supabaseRealtimeChat) return

    hadDropRef.current = false
    const channel = supabaseRealtimeChat
      .channel(`conversation:${conversationId}`, { config: { private: true } })
      .on("broadcast", { event: "message_change" }, ({ payload }) => {
        // TODO(debug): remove once realtime rollout is confirmed stable.
        console.log(`[realtime] conversation:${conversationId} received message_change`, payload)
        if (!payload) return
        if (payload.type === "INSERT") callbacksRef.current.onInsert?.(payload.record)
        if (payload.type === "UPDATE") callbacksRef.current.onUpdate?.(payload.record)
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload) return
        callbacksRef.current.onTypingChange?.(payload.userId, payload.isTyping)
        setPeerTyping(!!payload.isTyping)
        clearTimeout(peerTypingTimeoutRef.current)
        if (payload.isTyping) {
          peerTypingTimeoutRef.current = setTimeout(() => setPeerTyping(false), TYPING_AUTO_CLEAR_MS)
        }
      })
      .subscribe((status, err) => {
        // TODO(debug): remove once realtime rollout is confirmed stable.
        console.log(`[realtime] conversation:${conversationId} ->`, status, err || "")
        if (status === "SUBSCRIBED") {
          if (hadDropRef.current) {
            callbacksRef.current.onGapFill?.()
            hadDropRef.current = false
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          hadDropRef.current = true
        }
      })

    channelRef.current = channel

    return () => {
      clearTimeout(peerTypingTimeoutRef.current)
      supabaseRealtimeChat.removeChannel(channel)
      channelRef.current = null
      setPeerTyping(false)
    }
  }, [conversationId, enabled])

  const sendTyping = (userId, isTyping) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, isTyping },
    })
  }

  return { peerTyping, sendTyping }
}

export default useConversationChannel
