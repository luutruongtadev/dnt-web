"use client";
import React, {useState, useEffect, useRef} from "react";
import Tesseract from "tesseract.js";
import "../styles/Login.css";
import axios from "axios";
import {Link, useNavigate} from '@/lib/router-compat';
import {useTranslation} from "react-i18next";
import {
    Home as HomeIcon,
    KeyboardIcon as KeyboardIcon,
    Camera as CameraIcon,
} from "lucide-react";
import PostTypeMenu from "../components/PostTypeMenu";
import CccdScanner from "../components/CccdScanner";
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx";
import { getMyBusiness } from "../services/businessService";


// MOCK MODE: Read from environment variable to bypass camera/video verification
// Set VITE_MOCK_VERIFICATION=true in .env file to enable mock mode
// Set VITE_MOCK_VERIFICATION=false to use real verification
// Defaults to false (real verification) if not set
const MOCK_VERIFICATION =
    String(process.env.NEXT_PUBLIC_MOCK_VERIFICATION || "false").toLowerCase() ===
    "true";

export default function NewPostPage() {
    const {t} = useTranslation();
    const [color, setColor] = useState(localStorage.getItem("selectedColor"));
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [cccdCheckDone, setCccdCheckDone] = useState(false);
    const [hasIdCaptured, setHasIdCaptured] = useState(false);
    const [idPhotoDataUrl, setIdPhotoDataUrl] = useState(null);
    const [showCccdScanner, setShowCccdScanner] = useState(false);
    const [hasBusinessVideo, setHasBusinessVideo] = useState(false);
    const [businessVideoUrl, setBusinessVideoUrl] = useState(null);
    const [isVideoMode, setIsVideoMode] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [isOcrRunning, setIsOcrRunning] = useState(false);
    const [ocrHasText, setOcrHasText] = useState(null);
    const [ocrError, setOcrError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const recordTimerRef = useRef(null);
    const [previewBlocked, setPreviewBlocked] = useState(false);
    const containerRef = useRef(null);

    // Guard: if business is already verified on the server → go straight to /new-good-post.
    // Only redirect to /admin-control when NOT yet verified or on error.
    useEffect(() => {
        const checkCccdVerification = async () => {
            try {
                const res = await getMyBusiness();
                const business = res?.data?.data;
                if (res?.data?.verified || business?.status === "verified") {
                    // Business already verified – skip capture steps entirely
                    navigate("/new-good-post", { replace: true });
                } else {
                    // Not verified yet → send to admin-control to complete verification
                    navigate("/admin-control", { replace: true });
                }
            } catch {
                // On any error (unauthorized, network, etc.), redirect to admin-control
                navigate("/admin-control", { replace: true });
            }
        };
        checkCccdVerification();
    }, [navigate]);

    // Redirect to /new-good-post once both local verifications are completed (fallback path)
    useEffect(() => {
        if (hasIdCaptured && hasBusinessVideo) {
            navigate("/new-good-post", { replace: true });
        }
    }, [hasIdCaptured, hasBusinessVideo, navigate]);

    // Mock functions to bypass verification
    const mockIdCapture = () => {
        // Create a mock data URL (transparent 1x1 image)
        const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        setIdPhotoDataUrl(mockDataUrl);
        setHasIdCaptured(true);
    };

    const mockVideoRecord = () => {
        // Create a mock video blob URL (using canvas as placeholder)
        // In real mode, this would be a recorded video blob
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = "#fff";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Mock Video", 320, 240);
        }
        canvas.toBlob((blob) => {
            if (blob) {
                // In mock mode, we use image blob as placeholder for video
                // This is acceptable for bypassing verification
                const url = URL.createObjectURL(blob);
                setBusinessVideoUrl(url);
                setHasBusinessVideo(true);
                // Mock OCR results - simulate successful OCR with text found
                setOcrHasText(true);
                setIsOcrRunning(false);
                setOcrError(null);
            }
        }, "image/png");
    };

    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    useEffect(() => {
        document.getElementById("root").style.backgroundColor = color;
        const token = localStorage.getItem("authToken");
        setUser(token);

        // Cleanup camera stream when component unmounts
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [color, cameraStream]);

    const openCamera = async (e, mode) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            setCameraStream(stream);
            setShowCamera(true);
            setIsVideoMode(mode === "video");

            if (videoRef.current) {
                const video = videoRef.current;
                video.srcObject = stream;
                video.muted = true; // allow autoplay without user gesture
                try {
                    await video.play();
                    setPreviewBlocked(false);
                } catch (_) {
                    // some browsers block autoplay even when muted
                    setPreviewBlocked(true);
                }
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert(t("camera.error"));
        }
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
        }
        setCameraStream(null);
        setShowCamera(false);
        setIsVideoMode(false);
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            try {
                mediaRecorderRef.current.stop();
            } catch (_) {
            }
        }
        recordedChunksRef.current = [];
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        setIsRecording(false);
        setRecordSeconds(0);
    };

    const tryStartPreview = async () => {
        const video = videoRef.current;
        if (!video) return;
        try {
            await video.play();
            setPreviewBlocked(false);
        } catch (_) {
            setPreviewBlocked(true);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        setIdPhotoDataUrl(dataUrl);
        setHasIdCaptured(true);
        closeCamera();
    };

    const handleContractUpload = (e) => {
        // removed: switching to video recording instead of upload
    };

    const startRecording = () => {
        if (!cameraStream) return;
        recordedChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(cameraStream, {
            mimeType: "video/webm",
        });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, {type: "video/webm"});
            const url = URL.createObjectURL(blob);
            if (businessVideoUrl) {
                try {
                    URL.revokeObjectURL(businessVideoUrl);
                } catch (_) {
                }
            }
            setBusinessVideoUrl(url);
            setHasBusinessVideo(true);
            // kick off OCR check at ~5s frame
            runOcrOnVideo(url);
        };
        mediaRecorder.start();
        setIsRecording(true);
        setRecordSeconds(0);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        recordTimerRef.current = setInterval(() => {
            setRecordSeconds((s) => s + 1);
        }, 1000);
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        setIsRecording(false);
        // keep modal open briefly to avoid abrupt close; but current UX closes.
        closeCamera();
    };

    const runOcrOnVideo = async (videoUrl) => {
        try {
            setIsOcrRunning(true);
            setOcrHasText(null);
            setOcrError(null);

            // Create an off-DOM video element to seek to 5s
            const tempVideo = document.createElement("video");
            tempVideo.src = videoUrl;
            tempVideo.crossOrigin = "anonymous";
            tempVideo.preload = "auto";

            await new Promise((resolve, reject) => {
                const onLoaded = () => resolve();
                const onError = () =>
                    reject(new Error("Cannot load recorded video for OCR"));
                tempVideo.addEventListener("loadedmetadata", onLoaded, {once: true});
                tempVideo.addEventListener("error", onError, {once: true});
            });

            const targetTime = Math.min(
                5,
                tempVideo.duration ? tempVideo.duration - 0.1 : 5
            );

            await new Promise((resolve) => {
                const onSeeked = () => resolve();
                tempVideo.currentTime = targetTime > 0 ? targetTime : 0;
                tempVideo.addEventListener("seeked", onSeeked, {once: true});
            });

            const canvas = document.createElement("canvas");
            const width = tempVideo.videoWidth || 640;
            const height = tempVideo.videoHeight || 480;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context not available");
            ctx.drawImage(tempVideo, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/png");
            const {data} = await Tesseract.recognize(dataUrl, "eng+vie");
            const text = data && data.text ? data.text.trim() : "";
            setOcrHasText(Boolean(text));
        } catch (err) {
            console.error("OCR error:", err);
            setOcrError(err.message || "OCR failed");
            setOcrHasText(null);
        } finally {
            setIsOcrRunning(false);
        }
    };

    // Don't render anything until the CCCD verification check resolves
    if (!cccdCheckDone) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-500 text-sm animate-pulse">Đang kiểm tra xác minh…</div>
            </div>
        );
    }

    return (
        <>
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-transparent backdrop-blur-md rounded-lg w-full max-w-4xl mx-auto">
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix="4"
                    leftButton={
                        <button
                            className="text-red-600 hover:text-red-800 relative"
                            onClick={() => navigate("/")}
                        >
                            <HomeIcon size={28}/>
                        </button>
                    }
                    rightButton={
                        <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => navigate("/admin-control")}
                        >
                            <KeyboardIcon size={28}/>
                        </button>
                    }
                    title={t("posts.newPost")}
                />


                {/* Two large boxes layout */}
                <div className="mt-6" ref={containerRef}>
                    <div className="grid grid-cols-2 border border-gray-300">
                        {/* Scan CCCD */}
                        <div
                            className="border-r border-gray-400 p-4 text-center cursor-pointer"
                            onClick={(e) => {
                                if (MOCK_VERIFICATION) {
                                    e.preventDefault();
                                    mockIdCapture();
                                } else {
                                    setShowCccdScanner(true);
                                }
                            }}
                        >
                            <div className="flex flex-col items-center justify-center h-40">
                                <CameraIcon size={48} className="mb-2"/>
                                <h3 className="font-bold text-lg">{t("posts.scanId")}</h3>
                                {hasIdCaptured && (
                                    <p className="text-green-600 mt-2">{t("camera.captured")}</p>
                                )}
                            </div>
                        </div>

                        {/* Business registration video recording */}
                        <div
                            className="p-4 text-center cursor-pointer"
                            onClick={(e) => {
                                if (MOCK_VERIFICATION) {
                                    e.preventDefault();
                                    mockVideoRecord();
                                } else {
                                    openCamera(e, "video");
                                }
                            }}
                        >
                            <div className="flex flex-col items-center justify-center h-40">
                                <CameraIcon size={48} className="mb-2"/>
                                <h3 className="font-bold text-lg">{t("posts.recordVideo")}</h3>
                                {hasBusinessVideo && (
                                    <div className="text-center mt-2">
                                        <p className="text-green-600">
                                            {t("camera.videoRecorded")}
                                        </p>
                                        {isOcrRunning && (
                                            <p className="text-blue-600 mt-1">{t("ocr.running")}</p>
                                        )}
                                        {!isOcrRunning && ocrError && (
                                            <p className="text-red-600 mt-1">
                                                {t("ocr.error")}: {ocrError}
                                            </p>
                                        )}
                                        {!isOcrRunning && ocrHasText === true && (
                                            <p className="text-green-700 mt-1">{t("ocr.hasText")}</p>
                                        )}
                                        {!isOcrRunning && ocrHasText === false && (
                                            <p className="text-yellow-700 mt-1">{t("ocr.noText")}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Three columns layout */}
                <div className="mt-6">
                    <div className="">
                        {/* Using the common PostTypeMenu component */}
                        {hasIdCaptured && hasBusinessVideo ? (
                            <div className="p-4 text-center text-gray-700">{t("posts.redirecting") || "Đang chuyển hướng..."}</div>
                        ) : (
                            <div className="p-4 text-center text-gray-700">
                                {t("posts.requirements")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Camera Modal */}
                {showCamera && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-lg max-w-2xl w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{t("camera.title")}</h2>
                                <button
                                    className="text-gray-700 hover:text-gray-900"
                                    onClick={closeCamera}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-auto border border-gray-300 rounded"
                                />
                                {previewBlocked && (
                                    <div
                                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                        <button
                                            className="bg-white text-black px-3 py-2 rounded"
                                            onClick={tryStartPreview}
                                        >
                                            {t("camera.clickToPreview")}
                                        </button>
                                    </div>
                                )}
                                {isVideoMode && isRecording && (
                                    <div
                                        className="absolute top-2 left-2 bg-red-600 text-white text-sm px-2 py-1 rounded">
                                        {t("camera.recording")}{" "}
                                        {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                                        {String(recordSeconds % 60).padStart(2, "0")}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex justify-center">
                                {!isVideoMode ? (
                                    <>
                                        <button
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                                            onClick={capturePhoto}
                                        >
                                            {t("camera.capture")}
                                        </button>
                                        <button
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                            onClick={closeCamera}
                                        >
                                            {t("camera.cancel")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className={`px-4 py-2 rounded mr-2 text-white ${
                                                isRecording
                                                    ? "bg-red-300 cursor-not-allowed"
                                                    : "bg-red-500 hover:bg-red-600"
                                            }`}
                                            onClick={startRecording}
                                            disabled={isRecording}
                                        >
                                            {t("camera.startRecording")}
                                        </button>
                                        {isRecording && (
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                                onClick={stopRecording}
                                            >
                                                {t("camera.stopRecording")}
                                            </button>
                                        )}
                                        {!isRecording && (
                                            <button
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                                onClick={closeCamera}
                                            >
                                                {t("camera.cancel")}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {showCccdScanner && (
            <CccdScanner
                onResult={({ frontDataUrl }) => {
                    setIdPhotoDataUrl(frontDataUrl);
                    setHasIdCaptured(true);
                    setShowCccdScanner(false);
                }}
                onClose={() => setShowCccdScanner(false)}
            />
        )}
        </>
    );
}
