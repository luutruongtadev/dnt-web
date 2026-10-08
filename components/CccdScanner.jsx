"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, X, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

// ── Detection constants ───────────────────────────────────────────────────────
// Interval between frame analyses (ms)
const DETECT_INTERVAL_MS = 200;
// How many consecutive stable frames before auto-capture fires
// 5 × 200ms = 1 s of "card held still"
const STABLE_FRAMES_NEEDED = 5;
// Minimum luminance std-dev inside the guide — a real card is full of text/photo
// detail, so its contrast is high; a plain wall or desk is far lower.
const MIN_CONTENT_STDDEV = 28;
// A CCCD is a light-coloured card: the interior must be reasonably bright.
const MIN_MEAN_LUM = 60;
// The card must stand out from the margin around it — interior brighter than the
// surrounding border by this much. This is what rejects "pointed at a busy scene".
const MIN_EDGE_CONTRAST = 6;
// Maximum per-pixel luminance diff between frames — above this the card is moving.
// Between the too-tight 7 (never fired) and too-loose 20 (fired on anything).
const MAX_MOTION_DIFF = 45;

// Card detection (OpenCV.js, same idea as jscanify): Canny → contours → convex
// quadrilateral with ID-card aspect (CCCD 85.6×54 mm ≈ 1.586) that is large in the
// frame (= held close enough to OCR). Faces, walls and hands never form that quad.
const OPENCV_URL = "/vendor/opencv.js"; // @techstark/opencv-js 4.9.0 build, self-hosted
const DET_W = 480, DET_H = 270;   // working resolution for OpenCV
const CARD_ASPECT_MIN = 1.35, CARD_ASPECT_MAX = 1.85;
const MIN_CARD_WIDTH_FRAC = 0.5;  // card long side / frame width
const MAX_CARD_WIDTH_FRAC = 0.95; // above this it's the frame edge itself, not a card
const MIN_RECTANGULARITY = 0.85;  // hull area / min-area-rect area

let cvPromise = null;
function loadOpenCv() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.cv?.Mat) return Promise.resolve(window.cv);
  if (cvPromise) return cvPromise;
  cvPromise = new Promise((resolve) => {
    const done = () => {
      const cv = window.cv;
      if (cv?.Mat) return resolve(cv);
      // The module is thenable; resolving with it directly would recurse forever.
      if (cv?.then) return cv.then((c) => { delete c.then; resolve(c); });
      cv.onRuntimeInitialized = () => resolve(window.cv);
    };
    const el = document.createElement("script");
    el.src = OPENCV_URL;
    el.async = true;
    el.onload = done;
    el.onerror = () => { cvPromise = null; resolve(null); };
    document.body.appendChild(el);
  });
  return cvPromise;
}

// Grid used for the low-res frame sample (whole video frame).
const GW = 64, GH = 36;
// Guide rectangle within the frame (matches the on-screen overlay: 90% × 58%).
const GUIDE_X0 = 0.05, GUIDE_X1 = 0.95, GUIDE_Y0 = 0.21, GUIDE_Y1 = 0.79;

function lum(px, i) {
  return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
}

// Returns the card long side as a fraction of the frame width (0 = no card found).
function detectCardQuad(cv, video) {
  const canvas = document.createElement("canvas");
  canvas.width = DET_W;
  canvas.height = DET_H;
  canvas.getContext("2d").drawImage(video, 0, 0, DET_W, DET_H);
  const src = cv.imread(canvas);
  const gray = new cv.Mat(), edges = new cv.Mat(), kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  const contours = new cv.MatVector(), hier = new cv.Mat();
  let best = 0;
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, edges, 30, 90);
    cv.dilate(edges, edges, kernel);
    cv.findContours(edges, contours, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = cv.contourArea(c);
      if (area > DET_W * DET_H * 0.15) {
        // Convex hull (not a strict 4-vertex polygon): tolerates blur, the plastic
        // holder's extra corners and a finger covering part of an edge.
        const hull = new cv.Mat();
        cv.convexHull(c, hull);
        const r = cv.minAreaRect(hull);
        const long = Math.max(r.size.width, r.size.height);
        const short = Math.min(r.size.width, r.size.height);
        const frac = long / DET_W;
        if (
          long / short >= CARD_ASPECT_MIN && long / short <= CARD_ASPECT_MAX &&
          cv.contourArea(hull) / (long * short) >= MIN_RECTANGULARITY &&
          frac <= MAX_CARD_WIDTH_FRAC && frac > best
        ) best = frac;
        hull.delete();
      }
      c.delete();
    }
  } finally {
    src.delete(); gray.delete(); edges.delete(); kernel.delete(); contours.delete(); hier.delete();
  }
  return best;
}

// Sample the WHOLE frame at low res, then derive interior (guide) vs exterior
// (margin) statistics so we can tell a card from an arbitrary scene.
// Returns null until the video is ready, otherwise:
//   { stdDev, interiorMean, exteriorMean, lumArr } — lumArr is the per-cell
//   interior luminance, used for frame-to-frame motion.
function analyzeFrame(video, cv) {
  if (!video || video.readyState < 2 || !video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = GW;
  canvas.height = GH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, GW, GH);
  const px = ctx.getImageData(0, 0, GW, GH).data;

  const x0 = Math.floor(GW * GUIDE_X0), x1 = Math.ceil(GW * GUIDE_X1);
  const y0 = Math.floor(GH * GUIDE_Y0), y1 = Math.ceil(GH * GUIDE_Y1);

  const lumArr = [];
  let inSum = 0, inCount = 0, exSum = 0, exCount = 0;
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const l = lum(px, (y * GW + x) * 4);
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
      if (inside) {
        lumArr.push(l);
        inSum += l;
        inCount++;
      } else {
        exSum += l;
        exCount++;
      }
    }
  }
  const interiorMean = inSum / inCount;
  const exteriorMean = exCount ? exSum / exCount : 0;

  let variance = 0;
  for (const l of lumArr) variance += (l - interiorMean) ** 2;
  const stdDev = Math.sqrt(variance / lumArr.length);

  const covered = cv ? detectCardQuad(cv, video) : 0;

  return { stdDev, interiorMean, exteriorMean, lumArr, covered };
}

// Mean absolute luminance diff between two interior samples.
function motionDiff(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
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
  const cvRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadOpenCv().then((cv) => {
      if (!alive || !cv) return;
      cvRef.current = cv;
    });
    return () => { alive = false; };
  }, []);

  // step: "front" | "back" | "confirm" | "extracting" | "error"
  const [step, setStep] = useState("front");
  const [frontDataUrl, setFrontDataUrl] = useState(null);
  const [backDataUrl, setBackDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState("");
  // countdown: null = not detecting, 3/2/1 = countdown seconds remaining
  const [countdown, setCountdown] = useState(null);
  // Live detection metrics for tuning. Temporarily always on so the thresholds can
  // be calibrated from real values — set back to the localStorage gate once tuned.
  const [debug, setDebug] = useState(null);
  const debugOn = true;

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

  // Shared by auto-detect and the manual "Chụp ngay" button.
  const doCapture = useCallback(() => {
    if (capturedRef.current) return;
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    capturedRef.current = true;
    stableCountRef.current = 0;
    setCountdown(null);
    setStep((s) => {
      if (s === "front") {
        setFrontDataUrl(dataUrl);
        return "back";
      }
      setBackDataUrl(dataUrl);
      return "confirm";
    });
  }, []);

  // ── Auto-detection loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "front" && step !== "back") return;

    const iv = setInterval(() => {
      if (capturedRef.current) return;
      const video = videoRef.current;
      const frame = analyzeFrame(video, cvRef.current);
      if (!frame) {
        // Video not ready yet (readyState < 2). Surface it in debug so a stuck
        // "Đang nhận diện" is distinguishable from a threshold that never trips.
        if (debugOn) setDebug({ ready: false });
        return;
      }

      const { stdDev, interiorMean, exteriorMean, lumArr, covered } = frame;
      const motion = motionDiff(lumArr, prevPixelsRef.current);
      const hadPrev = prevPixelsRef.current !== null;
      prevPixelsRef.current = lumArr;

      // A real document: high detail (stdDev), bright card (interiorMean), stands
      // held still (motion). Edge contrast is shown for debugging only — a bright
      // wall behind the card made it negative and blocked capture.
      // First frame has no previous → don't treat its Infinity motion as "moving".
      const cardPresent =
        stdDev > MIN_CONTENT_STDDEV &&
        interiorMean > MIN_MEAN_LUM &&
        covered >= MIN_CARD_WIDTH_FRAC &&
        (!hadPrev || motion < MAX_MOTION_DIFF);

      if (cardPresent) {
        stableCountRef.current += 1;
      } else {
        // Hand-held cards jitter: a single bad frame shouldn't wipe all progress.
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
      }

      if (debugOn) {
        setDebug({
          ready: true,
          stdDev: Math.round(stdDev),
          lum: Math.round(interiorMean),
          edge: Math.round(interiorMean - exteriorMean),
          motion: Math.round(motion),
          cover: Math.round(covered * 100),
          cv: !!cvRef.current,
          stable: stableCountRef.current,
        });
      }

      // Update countdown UI (3 → 2 → 1 → capture)
      const remaining = STABLE_FRAMES_NEEDED - stableCountRef.current;
      if (stableCountRef.current > 0 && remaining > 0) {
        const cd = Math.min(3, Math.ceil(remaining / 2));
        setCountdown(cd);
      } else if (stableCountRef.current === 0) {
        setCountdown(null);
      }

      if (stableCountRef.current >= STABLE_FRAMES_NEEDED) {
        clearInterval(iv);
        doCapture();
      }
    }, DETECT_INTERVAL_MS);

    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, debugOn, doCapture]);

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

              {/* Debug overlay — enable with localStorage.setItem("cccd_debug","1") */}
              {debugOn && (
                <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 font-mono text-[11px] leading-tight text-green-300">
                  {debug?.ready === false ? (
                    <div>video: NOT READY</div>
                  ) : (
                    <>
                      <div>stdDev {debug?.stdDev ?? "-"} / &gt;{MIN_CONTENT_STDDEV}</div>
                      <div>lum {debug?.lum ?? "-"} / &gt;{MIN_MEAN_LUM}</div>
                      <div>edge {debug?.edge ?? "-"} / &gt;{MIN_EDGE_CONTRAST}</div>
                      <div>card% {debug?.cv === false ? "loading cv…" : debug?.cover ?? "-"} / &ge;{MIN_CARD_WIDTH_FRAC * 100}</div>
                      <div>motion {debug?.motion ?? "-"} / &lt;{MAX_MOTION_DIFF}</div>
                      <div>stable {debug?.stable ?? 0} / {STABLE_FRAMES_NEEDED}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual fallback so the user is never stuck if auto-detect won't trigger */}
          {!cameraError && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={doCapture}
                className="rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-black hover:bg-white active:scale-95"
              >
                Chụp ngay
              </button>
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
