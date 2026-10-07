"use client";
import { useEffect, useState } from "react"
import { supabase } from "../config/supabase-client"

const useMetric = () => {
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    let channel = null
    let mounted = true

    const init = async () => {
      if (!supabase) return

      const { data, error } = await supabase.from("system-infos").select("*").limit(1)
      if (!error && data && mounted) {
        const row = Array.isArray(data) ? data[0] : data
        if (row) setMetrics(row)
      }

      channel = supabase
        .channel("metrics-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "metrics" },
          (payload) => {
            const next = payload?.new ?? payload?.old ?? {}
            setMetrics(next || {})
          }
        )
        .subscribe()
    }

    init()

    return () => {
      mounted = false
      try {
        if (channel) supabase?.removeChannel(channel)
      } catch {}
    }
  }, [])

  return metrics
}

export default useMetric
