"use client";
import { useEffect, useRef } from 'react'

/**
 * useRecaptcha — mounts a visible reCAPTCHA v2 Checkbox widget.
 *
 * Polls until BOTH window.grecaptcha is ready AND the container element
 * exists in the DOM, so it works even when the container is conditionally
 * rendered (e.g. inside a modal that opens later).
 *
 * Usage:
 *   const { getToken, reset } = useRecaptcha('my-container-id')
 *   // In JSX: <div id="my-container-id" />
 *
 * getToken() — returns the current token string or null (user must have
 *   ticked the checkbox first).
 * When VITE_MOCK_RECAPTCHA=true returns 'mock_token' immediately.
 */
export default function useRecaptcha(containerId) {
  const widgetIdRef = useRef(null)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!siteKey) {
      console.error('[useRecaptcha] VITE_RECAPTCHA_SITE_KEY is not set')
      return
    }

    const tryRender = () => {
      // Container may not be in the DOM yet (e.g. inside a conditional modal)
      const container = document.getElementById(containerId)
      if (!container) return false
      if (!window.grecaptcha?.render) return false
      if (container.hasChildNodes()) return true // already rendered

      try {
        widgetIdRef.current = window.grecaptcha.render(containerId, {
          sitekey: siteKey,
          'error-callback': () => {
            console.warn('[useRecaptcha] widget error on', containerId)
          },
        })
        return true
      } catch (err) {
        console.error('[useRecaptcha] render error:', err.message)
        return false
      }
    }

    // Keep polling until the container is in the DOM and the widget is rendered
    const interval = setInterval(() => {
      if (tryRender()) clearInterval(interval)
    }, 100)

    return () => {
      clearInterval(interval)
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try { window.grecaptcha.reset(widgetIdRef.current) } catch (_) { /* ignore */ }
        widgetIdRef.current = null
      }
    }
  }, [containerId])

  /**
   * Returns the reCAPTCHA token if the user has ticked the box, or null.
   * Call this in your submit handler — if null, prompt the user to tick first.
   */
  const getToken = () => {
    if (process.env.NEXT_PUBLIC_MOCK_RECAPTCHA === 'true') return 'mock_token'
    try {
      return (widgetIdRef.current !== null
        ? window.grecaptcha?.getResponse(widgetIdRef.current)
        : window.grecaptcha?.getResponse()
      ) || null
    } catch {
      return null
    }
  }

  /** Resets the checkbox so the user can tick it again. */
  const reset = () => {
    try {
      if (widgetIdRef.current !== null) {
        window.grecaptcha?.reset(widgetIdRef.current)
      } else {
        window.grecaptcha?.reset()
      }
    } catch { /* ignore */ }
  }

  return { getToken, reset }
}
