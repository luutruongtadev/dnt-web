"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, X, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

// ── Detection constants ───────────────────────────────────────────────────────
// Interval between frame analyses (ms)
const DETECT_INTERVAL_MS = 200;
// How many consecutive stable frames before auto-capture fires
// 15 × 200ms = 3 s of "card held still"
const STABLE_FRAMES_NEEDED = 15;
// Minimum luminance std-dev in the guide zone — too low = plain background, not a card
const MIN_CONTENT_STDDEV = 22;
// Maximum mean pixel diff between consecutive frames — too high = card is moving
const MAX_MOTION_DIFF = 12;

// Sample the guide zone of the video into a small ImageData for fast analysis.
function sampleGuideZone(video) {
  if (!video || video.readyState < 2 || !video.videoWidth) return null;
  const W = 64, H = 36;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  // Guide overlay is 90% wide × 58% tall, centred in the frame
  const sx = video.videoWidth * 0.05;
  const sy = video.videoHeight * 0.21;
  const sw = video.videoWidth * 0.9;
  const sh = video.videoHeight * 0.58;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
  return ctx.getImageData(0, 0, W, H).data;
}

function luminanceStdDev(pixels) {
  const n = pixels.length / 4;
  let mean = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    mean += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }
  mean /= n;
  let variance = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const l = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    variance += (l - mean) ** 2;
  }
  return Math.sqrt(variance / n);
}

function frameDiff(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / (a.length / 4);
}

/**
 * CccdScanner — camera-based Vietnamese CCCD extractor using LLM vision.
 * Auto-detects when the card is placed in the guide frame and captures
 * without requiring the user to press a button.
 *
 * Props:
 *   onResult({ fullName, idNumber, dateOfBirth, sex, nationality,
 *              placeOfOrigin, placeOfResidence, expiryDate,
 *              frontDataUrl, backDataUrl })
 *   onClose()
 */
export default function CccdScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const prevPixelsRef = useRef(null);
  const stableCountRef = useRef(0);
  const capturedRef = useRef(false); // prevent double-capture

  // step: "front" | "back" | "confirm" | "extracting" | "error"
  const [step, setStep] = useState("front");
  const [frontDataUrl, setFrontDataUrl] = useState(null);
  const [backDataUrl, setBackDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState("");
  // countdown: null = not detecting, 3/2/1 = countdown seconds remaining
  const [countdown, setCountdown] = useState(null);

  const startCamera = useCallback(async () => {
    setCameraError("");
    capturedRef.current = false;
    stableCountRef.current = 0;
    prevPixelsRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
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
    stableCountRef.current = 0;
    capturedRef.current = false;
  }, []);

  // Start/stop camera based on active step
  useEffect(() => {
    if (step === "front" || step === "back") {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [step, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

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

  // ── Auto-detection loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "front" && step !== "back") return;

    const iv = setInterval(() => {
      if (capturedRef.current) return;
      const video = videoRef.current;
      const pixels = sampleGuideZone(video);
      if (!pixels) return;

      const stdDev = luminanceStdDev(pixels);
      const motion = frameDiff(pixels, prevPixelsRef.current);
      prevPixelsRef.current = pixels;

      const cardPresent = stdDev > MIN_CONTENT_STDDEV && motion < MAX_MOTION_DIFF;

      if (cardPresent) {
        stableCountRef.current += 1;
      } else {
        stableCountRef.current = 0;
      }

      // Update countdown UI (3 → 2 → 1 → capture)
      const remaining = STABLE_FRAMES_NEEDED - stableCountRef.current;
      if (stableCountRef.current > 0 && remaining > 0) {
        const cd = remaining <= 5 ? 1 : remaining <= 10 ? 2 : 3;
        setCountdown(cd);
      } else if (stableCountRef.current === 0) {
        setCountdown(null);
      }

      if (stableCountRef.current >= STABLE_FRAMES_NEEDED) {
        capturedRef.current = true;
        stableCountRef.current = 0;
        setCountdown(null);
        clearInterval(iv);

        const dataUrl = captureFrame();
        if (!dataUrl) return;
        if (step === "front") {
          setFrontDataUrl(dataUrl);
          setStep("back");
        } else {
          setBackDataUrl(dataUrl);
          setStep("confirm");
        }
      }
    }, DETECT_INTERVAL_MS);

    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleRetake = (side) => {
    capturedRef.current = false;
    stableCountRef.current = 0;
    setCountdown(null);
    if (side === "front") {
      setFrontDataUrl(null);
      setBackDataUrl(null);
      setStep("front");
    } else {
      setBackDataUrl(null);
      setStep("back");
    }
  };

  const handleExtract = useCallback(async () => {
    setStep("extracting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cccd/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
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
  }, [frontDataUrl, backDataUrl, onResult, onClose]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  // Guide frame colour: green when counting down, white otherwise
  const guideColor = countdown !== null ? "border-green-400" : "border-white/50";

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
          {step === "front" && "Đưa mặt trước CCCD vào khung"}
          {step === "back" && "Đưa mặt sau CCCD vào khung"}
          {step === "confirm" && "Xác nhận ảnh CCCD"}
          {step === "extracting" && "Đang đọc thông tin..."}
          {step === "error" && "Đã xảy ra lỗi"}
        </h2>
        <p className="mt-1 text-sm text-gray-300">
          {step === "front" && "Giữ thẻ thẳng trong khung — hệ thống tự chụp khi nhận diện được"}
          {step === "back" && "Lật thẻ, giữ thẳng trong khung — hệ thống tự chụp khi nhận diện được"}
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
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="h-auto w-full object-cover" playsInline muted />

              {/* Guide overlay with detection feedback */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`relative h-[58%] w-[90%] rounded-lg border-2 border-dashed transition-colors duration-300 ${guideColor}`}
                >
                  {/* Countdown badge */}
                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/80 text-3xl font-black text-white shadow-lg">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status text inside frame */}
              {countdown === null && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white/80">
                    Đang nhận diện thẻ...
                  </span>
                </div>
              )}
              {countdown !== null && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-green-600/80 px-3 py-1 text-xs font-semibold text-white">
                    Đã phát hiện thẻ — giữ yên...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview / confirm */}
      {step === "confirm" && (
        <div className="flex w-full max-w-2xl flex-col gap-4 px-4">
          <div className="flex gap-3">
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
