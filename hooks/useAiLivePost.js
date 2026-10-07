"use client";
import { useEffect, useState } from "react"
import { createMovie } from "../services/movieService"
import { createLive } from "../services/liveService"
import { createVideo } from "../services/videoService"

export default function useAiLivePost() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("video")
  const [videoFile, setVideoFile] = useState(null)
  const [movieFile, setMovieFile] = useState(null)
  const [liveOwnershipFile, setLiveOwnershipFile] = useState(null)
  const [liveAdFile, setLiveAdFile] = useState(null)
  const [liveTimeStartHour, setLiveTimeStartHour] = useState("")
  const [liveTimeEndHour, setLiveTimeEndHour] = useState("")
  const [videoName, setVideoName] = useState("")
  const [movieName, setMovieName] = useState("")
  const [liveName, setLiveName] = useState("")
  const [allowAdVideo, setAllowAdVideo] = useState(false)
  const [allowAdMovie, setAllowAdMovie] = useState(false)
  const [allowAdLive, setAllowAdLive] = useState(false)

  // Sản phẩm mà video sẽ gắn vào (bắt buộc cho luồng video livestream hàng hóa)
  const [videoProductId, setVideoProductId] = useState(null)
  const [videoSubmitting, setVideoSubmitting] = useState(false)
  const [videoSubmitStatus, setVideoSubmitStatus] = useState(null) // { type: 'success' | 'error', message }

  const [movieData] = useState({
    name: "",
    filename: "",
    watchPrice: 0,
    ownerPercentage: 0,
    deposit: 0,
    unitPrice: 0,
    adOnMainPageFee: 0,
    source: "https://example.com/live/launch",
    rightsDocument: ["https://example.com/live/launch"],
    adContent: "https://example.com/live/launch",
  })

  const [liveData] = useState({
    name: "Live Tech Talk: Future of AI",
    expectedAiringTime: "2025-08-10T20:00:00.000Z",
    filename: "ai_tech_talk_2025.mp4",
    watchPrice: 14.99,
    messagePrice: 2.5,
    ownerPercentage: 80,
    deposit: 300.0,
    priceBaseLocal: 12.0,
    unitPrice: 15.0,
    allowAdvertising: true,
    showAd: 20.0,
    startAdvertisingFromSeconds: 60,
    startAdvertisingFromViews: 500,
    rightsDocument: ["https://example.com/live/launch", "https://example.com/live/launch"],
    adContent: ["https://example.com/live/launch", "https://example.com/live/launch"],
  })

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    setUser(token)
  }, [])

  const handleSubmitMovie = async () => {
    try {
      const response = await createMovie("token", movieData)
      console.log("Movie uploaded successfully:", response.data)
    } catch (error) {
      console.error("Error uploading movie:", error.message)
    }
  }

  // Tạo video livestream gắn với sản phẩm. File upload trực tiếp qua Strapi.
  const handleSubmitVideo = async (productId = videoProductId) => {
    setVideoSubmitStatus(null)

    if (!productId) {
      const status = { type: "error", message: "Thiếu sản phẩm để gắn video" }
      setVideoSubmitStatus(status)
      return status
    }
    if (!(videoFile instanceof File)) {
      const status = { type: "error", message: "Vui lòng chọn file video" }
      setVideoSubmitStatus(status)
      return status
    }

    const token = localStorage.getItem("authToken")
    setVideoSubmitting(true)
    try {
      const payload = {
        name: videoName || videoFile.name,
        source: videoFile, // File -> upload qua Strapi (multipart)
        product: productId,
        allowAdvertising: allowAdVideo,
        confirmCopyright: true,
      }
      const response = await createVideo(token, payload)
      const status = { type: "success", message: "Đăng video thành công" }
      setVideoSubmitStatus(status)
      return { ...status, data: response.data }
    } catch (error) {
      const status = { type: "error", message: error.message || "Đăng video thất bại" }
      setVideoSubmitStatus(status)
      return status
    } finally {
      setVideoSubmitting(false)
    }
  }

  const handleSubmitLive = async () => {
    try {
      const response = await createLive("token", liveData)
      console.log("Live uploaded successfully:", response.data)
    } catch (error) {
      console.error("Error uploading live:", error.message)
    }
  }

  return {
    user,
    activeTab,
    setActiveTab,
    videoFile,
    setVideoFile,
    movieFile,
    setMovieFile,
    liveOwnershipFile,
    setLiveOwnershipFile,
    liveAdFile,
    setLiveAdFile,
    liveTimeStartHour,
    setLiveTimeStartHour,
    liveTimeEndHour,
    setLiveTimeEndHour,
    videoName,
    setVideoName,
    movieName,
    setMovieName,
    liveName,
    setLiveName,
    allowAdVideo,
    setAllowAdVideo,
    allowAdMovie,
    setAllowAdMovie,
    allowAdLive,
    setAllowAdLive,
    videoProductId,
    setVideoProductId,
    videoSubmitting,
    videoSubmitStatus,
    handleSubmitMovie,
    handleSubmitVideo,
    handleSubmitLive,
  }
}