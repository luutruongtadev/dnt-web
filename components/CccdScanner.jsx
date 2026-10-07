"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

/**
 * CccdScanner — camera-based Vietnamese CCCD extractor using LLM vision.
 *
 * Props:
 *   onResult({ fullName, idNumber, dateOfBirth, sex, nationality,
 *              placeOfOrigin, placeOfResidence, expiryDate,
 *              frontDataUrl, backDataUrl }) — called on successful extraction
 *   onClose() — called when user dismisses the scanner
 */
export default function CccdScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // step: "front" | "back" | "confirm" | "extracting" | "error"
  const [step, setStep] = useState("front");
  const [frontDataUrl, setFrontDataUrl] = useState(null);
  const [backDataUrl, setBackDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState("");

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("[CccdScanner] camera error:", err);
      setCameraError("Không thể truy cập camera. Vui lòng cấp quyền camera và thử lại.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Start camera when we need live view (front or back capture step)
  useEffect(() => {
    if (step === "front" || step === "back") {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [step, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleCaptureFront = () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    setFrontDataUrl(dataUrl);
    setStep("back");
  };

  const handleCaptureBack = () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    setBackDataUrl(dataUrl);
    setStep("confirm");
  };

  const handleRetake = (side) => {
    if (side === "front") {
      setFrontDataUrl(null);
      setBackDataUrl(null);
      setStep("front");
    } else {
      setBackDataUrl(null);
      setStep("back");
    }
  };

  const handleExtract = async () => {
    setStep("extracting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cccd/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
        body: JSON.stringify({ frontBase64: frontDataUrl, backBase64: backDataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể đọc thông tin CCCD");
      }
      onResult?.({ ...json.data, frontDataUrl, backDataUrl });
      onClose?.();
    } catch (err) {
      console.error("[CccdScanner] extract error:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      setStep("error");
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95">
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 rounded bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Đóng"
      >
        <X size={28} />
      </button>

      {/* Header */}
      <div className="mb-4 px-6 text-center text-white">
        <h2 className="text-xl font-bold">
          {step === "front" && "Chụp mặt trước CCCD"}
          {step === "back" && "Chụp mặt sau CCCD"}
          {step === "confirm" && "Xác nhận ảnh CCCD"}
          {step === "extracting" && "Đang đọc thông tin..."}
          {step === "error" && "Đã xảy ra lỗi"}
        </h2>
        <p className="mt-1 text-sm text-gray-300">
          {step === "front" && "Đặt mặt trước CCCD vào khung, giữ rõ nét rồi nhấn chụp"}
          {step === "back" && "Lật thẻ, đặt mặt sau CCCD vào khung rồi nhấn chụp"}
          {step === "confirm" && "Kiểm tra ảnh hai mặt trước khi xác nhận"}
          {step === "extracting" && "Hệ thống đang phân tích hình ảnh CCCD của bạn"}
          {step === "error" && errorMsg}
        </p>
      </div>

      {/* Camera view */}
      {(step === "front" || step === "back") && (
        <div className="relative w-full max-w-2xl px-4">
          {cameraError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-red-500 bg-red-950/40 text-white">
              <AlertCircle size={36} className="text-red-400" />
              <p className="text-center text-sm text-red-300">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* CCCD aspect-ratio guide overlay */}
              <div className="relative overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="h-auto w-full object-cover"
                  playsInline
                  muted
                />
                {/* Guide frame */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[58%] w-[90%] rounded-lg border-2 border-dashed border-white/60" />
                </div>
              </div>
              <button
                type="button"
                onClick={step === "front" ? handleCaptureFront : handleCaptureBack}
                className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-black hover:bg-gray-100 active:scale-95"
              >
                <Camera size={20} />
                Chụp ảnh
              </button>
            </>
          )}
        </div>
      )}

      {/* Preview / confirm */}
      {step === "confirm" && (
        <div className="flex w-full max-w-2xl flex-col gap-4 px-4">
          <div className="flex gap-3">
            {/* Front preview */}
            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-semibold text-gray-300">Mặt trước</p>
              <div className="relative overflow-hidden rounded-lg">
                <img src={frontDataUrl} alt="CCCD mặt trước" className="w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => handleRetake("front")}
                  className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                >
                  Chụp lại
                </button>
              </div>
            </div>
            {/* Back preview */}
            <div className="flex-1">
              <p className="mb-1 text-center text-xs font-semibold text-gray-300">Mặt sau</p>
              <div className="relative overflow-hidden rounded-lg">
                <img src={backDataUrl} alt="CCCD mặt sau" className="w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => handleRetake("back")}
                  className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                >
                  Chụp lại
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExtract}
            className="flex items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-base font-bold text-white hover:bg-blue-500 active:scale-95"
          >
            <CheckCircle size={20} />
            Xác nhận &amp; đọc thông tin
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Extracting spinner */}
      {step === "extracting" && (
        <div className="flex flex-col items-center gap-4 text-white">
          <RefreshCw size={48} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-300">Đang phân tích thông tin CCCD...</p>
        </div>
      )}

      {/* Error state */}
      {step === "error" && (
        <div className="flex flex-col items-center gap-4 px-6 text-center text-white">
          <AlertCircle size={48} className="text-red-400" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setFrontDataUrl(null); setBackDataUrl(null); setStep("front"); }}
              className="rounded-full border border-white/30 px-6 py-2 text-sm text-white hover:bg-white/10"
            >
              Quét lại
            </button>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
