"use client";
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

/**
 * Modal xác nhận OTP (tái sử dụng pattern OTP từ MoneyInputModal).
 * OTP được sinh sẵn và hiển thị; bấm "Xác nhận" (đúng) mới gọi onConfirm.
 */
export default function OtpModal({ open, onClose, onConfirm, title, duration = 30 }) {
  const { t } = useTranslation()
  const [otp, setOtp] = useState("")
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(duration)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // Sinh OTP có sẵn và đổ vào ô nhập
    const newOtp = String(Math.floor(100000 + Math.random() * 900000))
    setOtp(newOtp)
    setInput(newOtp)
    setError("")
    setCountdown(duration)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          onClose?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [open, duration, onClose])

  if (!open) return null

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleConfirm = () => {
    if (input === otp) {
      stop()
      onConfirm?.()
      onClose?.()
    } else {
      setError(t("common.otpInvalid", "OTP không đúng"))
    }
  }

  const handleCancel = () => {
    stop()
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={handleCancel} />
      <div className="relative bg-white w-[320px] border border-black rounded overflow-hidden">
        <div className="border-b border-black p-3 text-center font-bold">
          {title || t("common.enterOtp", "NHẬP OTP")}
        </div>
        <div className="p-3 space-y-3">
          <input
            type="text"
            inputMode="numeric"
            className="w-full text-2xl font-bold tracking-widest text-center bg-gray-100 p-2 border border-gray-300 rounded"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError("") }}
          />
          {error && <div className="text-xs text-red-500 text-center">{error}</div>}
          <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-yellow-400 transition-transform duration-1000 ease-linear origin-left transform-gpu"
              style={{ width: '100%', transform: `scaleX(${Math.max(0, Math.min(1, countdown / duration))})`, willChange: 'transform' }}
            />
          </div>
          <div className="flex justify-center space-x-4">
            <button className="px-4 py-2 border border-black bg-gray-200" onClick={handleCancel}>
              {t("common.cancel", "Hủy")}
            </button>
            <button className="px-4 py-2 border border-black bg-white" onClick={handleConfirm}>
              {t("common.confirm", "Xác nhận")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
