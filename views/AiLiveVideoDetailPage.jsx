"use client";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from '@/lib/router-compat'
import { useTranslation } from "react-i18next"
import { Eye, Flag, Handshake, UserCheck, ArrowRight, Save, Share2 } from "lucide-react"
import ContactListModal from "../components/molecules/ContactListModal.jsx"
import ViolationReportModal from "../components/molecules/ViolationReportModal.jsx"
import LiveGoodsTable from "../components/organisms/LiveGoodsTable.jsx"
import { getLiveGoodsSession, getProductById, joinLiveGoodsSession, submitLiveGoodsBid } from "../services/productService.js"

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")
  } catch {
    return {}
  }
}

const getGuestId = () => {
  const existing = localStorage.getItem("aiLiveGuestId")
  if (existing) return existing
  const next = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  localStorage.setItem("aiLiveGuestId", next)
  return next
}

const getViewer = () => {
  const user = getStoredUser()
  const viewerId = user?.id || user?.documentId || getGuestId()
  return {
    viewerId: String(viewerId),
    name: user?.full_name || user?.username || user?.email || "Khách",
    email: user?.email || "",
  }
}
    
export default function AiLiveVideoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)
  const [confirmSeconds, setConfirmSeconds] = useState(300)
  const [locked, setLocked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  const [audioOn, setAudioOn] = useState(false)
  const [product, setProduct] = useState(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState("")
  const [liveSession, setLiveSession] = useState(null)
  const [liveError, setLiveError] = useState("")
  const [joining, setJoining] = useState(false)
  const [submittingBidKey, setSubmittingBidKey] = useState(null)
  const [ownerDecision] = useState("none")
  const [minimized, setMinimized] = useState(false)
  const [posterTableOpen, setPosterTableOpen] = useState(true)
  const [joinerTableOpen, setJoinerTableOpen] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api"
  const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, "")

  const normalizeFileUrl = useCallback((url) => {
    if (!url || typeof url !== "string") return ""
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith("/")) return `${FILE_BASE_URL}${url}`
    return `${FILE_BASE_URL}/${url}`
  }, [FILE_BASE_URL])

  const getMediaUrl = useCallback((media) => {
    if (!media) return ""
    if (typeof media === "string") return normalizeFileUrl(media)
    if (media.url) return normalizeFileUrl(media.url)
    if (media.attributes?.url) return normalizeFileUrl(media.attributes.url)
    if (media.data?.attributes?.url) return normalizeFileUrl(media.data.attributes.url)
    if (Array.isArray(media.data) && media.data[0]?.attributes?.url) return normalizeFileUrl(media.data[0].attributes.url)
    return ""
  }, [normalizeFileUrl])

  const normalizeProduct = (rawProduct) => ({
    id: rawProduct?.id,
    documentId: rawProduct?.documentId,
    ...(rawProduct?.attributes || rawProduct || {}),
  })

  const normalizeProductItems = useCallback((nextProduct) => {
    const rawItems = nextProduct?.productItems
    if (Array.isArray(rawItems)) return rawItems
    if (Array.isArray(rawItems?.data)) {
      return rawItems.data.map((item) => ({
        id: item.id,
        documentId: item.documentId,
        ...(item.attributes || item),
      }))
    }
    return []
  }, [])

  const getProductVideoUrl = useCallback((nextProduct) => {
    const productVideo = getMediaUrl(nextProduct?.livestreamVideoFile) || getMediaUrl(nextProduct?.videoFile)
    if (productVideo) return productVideo

    const items = normalizeProductItems(nextProduct)
    for (const item of items) {
      const itemVideo = getMediaUrl(item.videoFile)
      if (itemVideo) return itemVideo
    }
    return ""
  }, [getMediaUrl, normalizeProductItems])

  const productItems = useMemo(() => normalizeProductItems(product), [normalizeProductItems, product])
  const liveProductId = product?.documentId || product?.id || id
  const currentUser = useMemo(() => getStoredUser(), [])
  const viewer = useMemo(() => getViewer(), [])
  const participants = liveSession?.participants || []
  const bids = liveSession?.bids || []
  const participantCount = liveSession?.participantCount ?? participants.length
  const hasJoined = participants.some((participant) => String(participant.viewerId) === viewer.viewerId)
  const broadcasterName = product?.poster?.full_name || product?.poster?.username || product?.poster?.email || t("aiLiveVideo.broadcaster", "Người phát")
  const isPoster = useMemo(() => {
    const poster = product?.poster
    if (!poster || !currentUser) return false
    return [poster.id, poster.documentId, poster.email].filter(Boolean).some((value) => (
      String(value) === String(currentUser.id)
      || String(value) === String(currentUser.documentId)
      || String(value) === String(currentUser.email)
    ))
  }, [currentUser, product])
  const roleLabel = isPoster ? t("aiLiveVideo.posterRole", "CHỦ PHIÊN") : t("aiLiveVideo.joinerRole", "KHÁCH")

  const loadLiveSession = useCallback(async () => {
    if (!liveProductId) return
    try {
      const response = await getLiveGoodsSession(liveProductId)
      setLiveSession(response.data?.data || null)
      setLiveError("")
    } catch (err) {
      setLiveError(err.message || t("aiLiveVideo.liveSessionError", "Không tải được phiên live."))
    }
  }, [liveProductId, t])

  const handleJoinLive = async () => {
    if (!liveProductId || joining || hasJoined || isPoster) return
    try {
      setJoining(true)
      const response = await joinLiveGoodsSession(liveProductId, viewer)
      setLiveSession(response.data?.data || null)
      setLiveError("")
    } catch (err) {
      setLiveError(err.message || t("aiLiveVideo.joinError", "Không tham gia được phiên live."))
    } finally {
      setJoining(false)
    }
  }

  const handleConfirmBid = async (item, index, bid) => {
    if (!liveProductId || isPoster) return
    const key = item.documentId || item.id || item.rowIndex || index
    try {
      setSubmittingBidKey(key)
      if (!hasJoined) {
        await joinLiveGoodsSession(liveProductId, viewer)
      }
      const response = await submitLiveGoodsBid(liveProductId, {
        ...bid,
        viewer,
        productItemId: item.id || null,
        productItemDocumentId: item.documentId || null,
        itemIndex: index,
        itemName: item.name || "",
      })
      setLiveSession(response.data?.data?.session || null)
      setLiveError("")
    } catch (err) {
      setLiveError(err.message || t("aiLiveVideo.bidError", "Không gửi được giá đấu."))
    } finally {
      setSubmittingBidKey(null)
    }
  }

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sine"
      o.frequency.value = 880
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
      o.start()
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
        o.stop(ctx.currentTime + 0.3)
      }, 250)
    } catch {
      // Audio feedback is optional; ignore browsers that block AudioContext.
    }
  }

  const onSaveHandle = () => {
    console.log("Save")
    setIsSaved(!isSaved)
  }

  useEffect(() => {
    if (locked) return
    const id = setInterval(() => setConfirmSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [locked])

  useEffect(() => {
    if (confirmSeconds <= 0) {
      setLocked(true)
      return
    }
    if (confirmSeconds <= 120 && !audioOn) setAudioOn(true)
  }, [audioOn, confirmSeconds])

  useEffect(() => {
    if (!audioOn) return
    const id = setInterval(() => beep(), 10000)
    return () => clearInterval(id)
  }, [audioOn])

  useEffect(() => {
    loadLiveSession()
    const intervalId = setInterval(loadLiveSession, 3000)
    return () => clearInterval(intervalId)
  }, [loadLiveSession])

  useEffect(() => {
    let mounted = true

    const fetchProductVideo = async () => {
      try {
        setLoadingVideo(true)
        setVideoError("")
        const response = await getProductById(id)
        if (!mounted) return
        const nextProduct = normalizeProduct(response.data?.data || {})
        setProduct(nextProduct)
        setShareCount(nextProduct?.shareCount ?? nextProduct?.shares ?? 0)
        const nextVideoUrl = getProductVideoUrl(nextProduct)
        setVideoUrl(nextVideoUrl)
        if (!nextVideoUrl) {
          setVideoError(t("aiLiveVideo.noVideo", "Chưa có video hàng hóa cho bài đăng này."))
        }
      } catch (err) {
        if (!mounted) return
        setVideoError(err.message || t("aiLiveVideo.loadError", "Không tải được video hàng hóa."))
      } finally {
        if (mounted) setLoadingVideo(false)
      }
    }

    fetchProductVideo()
    return () => {
      mounted = false
    }
  }, [getProductVideoUrl, id, t])

  const viewers = participantCount
  const reactions = bids.length
  const shares = shareCount
  const firstItem = productItems[0] || {}
  const name = firstItem.name || product?.custom_id || `${t("aiLiveVideo.video", "VIDEO")} ${id}`
  const productId = product?.custom_id || product?.documentId || product?.id || id
  const contacts = [
    { id: 1, name: "Nguyễn Văn A" },
    { id: 2, name: "Trần Thị B" },
    { id: 3, name: "Lê C" },
    { id: 4, name: "Phạm D" },
    { id: 5, name: "Hoàng E" },
  ]

  const onFollowHandle = () => {
    console.log("Follow")
    setIsFollowed(!isFollowed)
  }

  // Chủ bài đăng: 10 phút không tương tác thì tự động THOÁT
  useEffect(() => {
    if (!isPoster) return
    let timeoutId
    const reset = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => navigate("/ai-live"), 10 * 60 * 1000)
    }
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timeoutId)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [isPoster, navigate])

  return (
    <div className="p-2">
      {/* <div className="mb-4 flex items-center justify-between">
        <button className="text-blue-600 underline" onClick={() => navigate(-1)}>{t("common.back", "Quay lại")}</button>
        <div className="text-sm">{t("aiLiveVideo.detail", "Chi tiết video")}</div>
      </div> */}

      {isPoster && (
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            className="border border-black px-2 leading-none"
            title={t("aiLiveVideo.minimizeToggle", "Thu nhỏ / phóng to")}
            onClick={() => setMinimized((v) => !v)}
          >
            {minimized ? "+" : "–"}
          </button>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${minimized ? "hidden" : ""}`}>
        <div className="relative border border-black min-h-[420px] overflow-hidden bg-black">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="absolute inset-0 z-0 h-full w-full bg-black object-contain"
            />
          ) : (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-black text-center text-sm font-bold text-white">
              {loadingVideo ? t("common.loading", "Đang tải...") : videoError}
            </div>
          )}
          <div className="relative z-20 flex items-start justify-start bg-white/85 px-2 py-1 text-xs text-black backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-white/80" />
            <div className="font-bold ml-2">{name}</div>
            {/* Ẩn vào ID hàng hóa thì đến CHI TIẾT BÀI ĐĂNG */}
            <button
              type="button"
              className="font-bold ml-2 text-blue-700 underline"
              title={t("customerConfirm.goToDetail", "ĐẾN CHI TIẾT BÀI ĐĂNG")}
              onClick={() => navigate(`/list-of-goods/${id}`)}
            >
              {productId}
            </button>
            <div className="ml-2">| {t("aiLiveVideo.host", "Người phát")}: <span className="font-bold">{broadcasterName}</span></div>
            <div className={`ml-2 border border-black px-2 font-bold ${isPoster ? "bg-blue-100" : "bg-yellow-100"}`}>{roleLabel}</div>

          </div>
          <div className="absolute left-2 top-12 z-20 space-y-2 rounded bg-white/85 p-2 text-xs text-black backdrop-blur-sm">
            <div className="flex items-center gap-1"><Eye size={24} /><span>{viewers} {t("aiLiveVideo.participating", "đang tham gia")}</span></div>
            <div className="flex items-center gap-1"><Handshake size={24} /><span className="font-semibold">{reactions} {t("aiLiveVideo.bids", "lượt đặt giá")}</span></div>
            <div className="flex items-center gap-1"><Share2 size={24} /><span className="font-semibold">{shares} {t("aiLiveVideo.shares", "lượt chia sẻ")}</span></div>
            {liveError ? <div className="max-w-[220px] text-red-700">{liveError}</div> : null}
          </div>
          <div className="absolute right-3 bottom-3 z-30 flex flex-col items-center gap-2">
            <button onClick={() => onFollowHandle()} className={`border border-black p-2 rounded  text-sm font-bold ${isFollowed ? "bg-blue-300" : "bg-white"}`}><UserCheck size={18} /></button>
            <button onClick={() => onSaveHandle()} className={`border border-black p-2 rounded  text-sm font-bold ${isSaved ? "bg-blue-300" : "bg-white"}`}><Save size={18} /></button>
            <button className="border border-black bg-white p-2 rounded" onClick={() => setShowShare(true)}><ArrowRight size={18} /></button>
            <button className="border border-black bg-white p-2 rounded" onClick={() => setShowReport(true)}><Flag size={18} /></button>
          </div>
          {!isPoster ? (
            <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 transform">
              <button
                type="button"
                disabled={joining || hasJoined}
                onClick={handleJoinLive}
                className={`border border-black px-4 py-2 text-sm font-bold ${hasJoined ? "bg-green-200" : "bg-yellow-100"} disabled:cursor-not-allowed`}
              >
                {joining ? t("common.loading", "Đang tải...") : hasJoined ? t("aiLiveVideo.joined", "ĐÃ THAM GIA") : "THAM GIA"}
              </button>
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 transform border border-black bg-blue-100 px-4 py-2 text-sm font-bold">
              {t("aiLiveVideo.posterWatching", "BẠN ĐANG PHÁT PHIÊN LIVE")}
            </div>
          )}
        </div>
      </div>

      {!isPoster ? (
        <div className="mt-4 border border-black bg-yellow-50 px-3 py-3 text-sm font-bold">
          {hasJoined
            ? t("aiLiveVideo.joinerHintJoined", "Bạn đã tham gia phiên live. Nhập số lượng, giá đặt và bấm XÁC NHẬN để đấu giá.")
            : t("aiLiveVideo.joinerHint", "Bấm THAM GIA để vào phiên live trước khi đặt giá.")}
        </div>
      ) : null}

      {(isPoster ? posterTableOpen : hasJoined && joinerTableOpen) && (
        <LiveGoodsTable
          items={productItems}
          bids={bids}
          onConfirmBid={handleConfirmBid}
          submittingBidKey={submittingBidKey}
          mode={isPoster ? "poster" : "joiner"}
          onClose={() => (isPoster ? setPosterTableOpen(false) : setJoinerTableOpen(false))}
        />
      )}
      {isPoster ? (
        <div className="mt-3 border border-black">
          <div className="bg-gray-100 px-3 py-2 text-sm font-bold">{t("aiLiveVideo.realtimeFeedback", "Phản hồi realtime cho chủ bài đăng")}</div>
          <div className="max-h-56 overflow-y-auto">
            {bids.length === 0 ? (
              <div className="px-3 py-4 text-sm">{t("aiLiveVideo.noBids", "Chưa có khách đặt giá.")}</div>
            ) : bids.slice(0, 10).map((bid) => (
              <div key={bid.id} className="grid grid-cols-1 gap-1 border-t border-black px-3 py-2 text-sm md:grid-cols-5">
                <div className="font-bold">{bid.viewerName || t("aiLiveVideo.guest", "Khách")}</div>
                <div>{bid.itemName || t("aiLiveVideo.productItem", "Product item")}</div>
                <div>{bid.quantity} x {Number(bid.unitPrice || 0).toLocaleString("vi-VN")}</div>
                <div className="font-bold">{Number(bid.totalAmount || 0).toLocaleString("vi-VN")}</div>
                <div>{bid.createdAt ? new Date(bid.createdAt).toLocaleString("vi-VN") : ""}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isPoster && hasJoined ? (
        <div className="flex items-center justify-center mt-2">
          {ownerDecision === "none" ? (
            <div className="p-4 text-center font-bold" style={{ backgroundColor: "#e0f2fe", color: "#1e3a8a" }}>
              {t("aiLiveVideo.waitingPoster", "CHỜ CHỦ PHIÊN PHẢN HỒI")}
            </div>
          ) : ownerDecision === "accepted" ? (
            <div className="p-4 text-center font-bold" style={{ backgroundColor: "#0ea5e9", color: "#facc15" }}>{t("customerConfirm.approvedLeft", "ĐÃ DUYỆT (lệnh từ chủ bài đăng)")}</div>
          ) : (
            <div className="p-4 text-center font-bold" style={{ backgroundColor: "#ef4444", color: "#111827" }}>{t("customerConfirm.rejectedRight", "TỪ CHỐI (lệnh từ chủ bài đăng)")}</div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-3 mt-2">
        <div />
        <div className="p-2 text-center" style={{ backgroundColor: "#06b6d4", color: "#002855" }}>
          <button className="underline" onClick={() => navigate(`/list-of-goods/${id}`)}>{t("customerConfirm.goToDetail", "ĐẾN CHI TIẾT BÀI ĐĂNG")}</button>
        </div>
        <div />
      </div>
      <ContactListModal
        contacts={contacts}
        open={showShare}
        onClose={() => setShowShare(false)}
        onSend={() => { setShareCount((c) => c + 1); setShowShare(false) }}
      />
      <ViolationReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={() => setShowReport(false)}
      />
    </div>
  )
}
