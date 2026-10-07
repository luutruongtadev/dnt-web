"use client";
import React, { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

/**
 * CameraCapture - mở camera trực tiếp để chụp ảnh hoặc quay phim.
 * mode = "photo" | "video"
 * onCapture(file) trả về File đã chụp/quay.
 */
export default function CameraCapture({ open, mode = "photo", onCapture, onClose }) {
  const { t } = useTranslation()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError("")
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: mode === "video",
        })
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (err) {
        setError(err?.message || "Không thể truy cập camera")
      }
    }
    start()
    return () => {
      cancelled = true
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  const stopStream = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop() } catch { /* noop */ }
    }
    recorderRef.current = null
    setRecording(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }

  const handleClose = () => {
    stopStream()
    onClose?.()
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
      onCapture?.(file)
      handleClose()
    }, "image/jpeg", 0.92)
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" })
      onCapture?.(file)
      handleClose()
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      {error ? (
        <div className="bg-white rounded p-4 max-w-sm text-center">
          <div className="text-red-600 mb-3">{error}</div>
          <button type="button" onClick={handleClose} className="bg-gray-300 px-4 py-2 rounded">
            {t("common.close", "Đóng")}
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} playsInline muted className="max-h-[70vh] max-w-full rounded bg-black" />
          <div className="mt-4 flex items-center gap-4">
            {mode === "photo" && (
              <button type="button" onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium">
                📷 {t("productGrid.capturePhoto", "Chụp ảnh")}
              </button>
            )}
            {mode === "video" && !recording && (
              <button type="button" onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium">
                ⏺ {t("camera.startRecord", "Bắt đầu quay")}
              </button>
            )}
            {mode === "video" && recording && (
              <button type="button" onClick={stopRecording} className="bg-gray-800 hover:bg-black text-white px-6 py-2 rounded font-medium">
                ⏹ {t("camera.stopRecord", "Dừng quay")}
              </button>
            )}
            <button type="button" onClick={handleClose} className="bg-white/90 hover:bg-white text-black px-6 py-2 rounded font-medium">
              {t("common.close", "Đóng")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

CameraCapture.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(["photo", "video"]),
  onCapture: PropTypes.func,
  onClose: PropTypes.func,
}
