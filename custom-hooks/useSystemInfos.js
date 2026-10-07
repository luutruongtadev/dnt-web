"use client";
import { useEffect, useState } from "react"
import { getMetric } from "../services/metricService"

const POLL_INTERVAL_MS = 5000

const useSystemInfos = () => {
  const [infos, setInfos] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    let intervalId = null

    const fetchInfos = async () => {
      try {
        const data = await getMetric()
        if (!mounted) return
        setInfos(data || {})
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(err)
      }
    }

    fetchInfos()
    intervalId = window.setInterval(fetchInfos, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  return { infos, error }
}

export { useSystemInfos }
