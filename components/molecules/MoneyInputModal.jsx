"use client";
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

export default function MoneyInputModal({ open, onClose, title, initialValue = "", currencyLabel, onConfirm }) {
  const { t } = useTranslation()
  const [val, setVal] = useState(String(initialValue ?? ""))

  const [step, setStep] = useState("initial") // initial | otp
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(30)
  const intervalRef = useRef(null)

  // All hooks must be called before any conditional return
  useEffect(() => {
    if (open) {
      setVal(String(initialValue ?? ""))
      setStep("initial")
      setOtp("")
      setCountdown(30)
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [open, initialValue])

  useEffect(() => {
    if (step !== "otp") return

    const timerId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerId)
          setStep("initial") // Reset on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerId) // Cleanup
  }, [step])

  // Remove the old useEffect that was causing issues
  // useEffect(() => {
  //   if (step !== "otp") return
  //   const timerId = setInterval(() => {
  //     setCountdown((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timerId)
  //         setStep("initial")
  //         return 0
  //       }
  //       return prev - 1
  //     })
  //   }, 1000)
  //   return () => clearInterval(timerId)
  // }, [step])

  if (!open) return null

  const toNumber = (s) => {
    const clean = String(s).replace(/[^0-9]/g, "")
    return clean ? Number(clean) : 0
  }

  const formatVND = (n) => n.toLocaleString("vi-VN")

  const handleConfirm = () => {
    const num = toNumber(val)
    onConfirm?.(num)
    onClose?.()
  }

  const startOtpProcess = () => {
    const newOtp = String(Math.floor(100000 + Math.random() * 900000))
    setOtp(newOtp)
    setStep("otp")
    setCountdown(30) // Reset countdown
    
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setStep("initial") // Reset on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelOtpProcess = () => {
    setStep("initial")
    // Clear interval when cancelling
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[360px] border border-black rounded overflow-hidden">
        <div className="border-b border-black p-3 text-center font-bold">{title || t("aiLiveMovie.noAds", "TẮT QUẢNG CÁO")}</div>
        <div className="border-b border-black p-3 flex items-center justify-between">
          <input
            type="text"
            className="flex-1 p-2 text-right"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => setVal(formatVND(toNumber(val)))}
            placeholder={formatVND(0)}
          />
          <span className="ml-2">{currencyLabel || t("common.currency", "VNĐ")}</span>
        </div>
        <div className="p-3 text-center">
          {step === "initial" ? (
            <button className="px-4 py-2 border border-black bg-white" onClick={startOtpProcess}>
              {t("common.confirm", "Xác nhận")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-2xl font-bold tracking-widest bg-gray-100 p-2 border border-gray-300 rounded">
                {otp}
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-yellow-400 transition-transform duration-1000 ease-linear origin-left transform-gpu"
                  style={{ width: '100%', transform: `scaleX(${Math.max(0, Math.min(1, countdown / 30))})`, willChange: 'transform' }}
                ></div>
              </div>
              <div className="flex justify-center space-x-4">
                <button className="px-4 py-2 border border-black bg-gray-200" onClick={cancelOtpProcess}>
                  {t("common.cancel", "Hủy")}
                </button>
                <button className="px-4 py-2 border border-black bg-white" onClick={handleConfirm}>
                  {t("common.confirm", "Xác nhận")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
