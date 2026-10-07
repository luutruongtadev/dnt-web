"use client";
import { useEffect, useState } from "react"
import { useParams, useNavigate } from '@/lib/router-compat'
import { useTranslation } from "react-i18next"
import { Eye, Flag, Handshake, UserCheck,Forward , Save, Clock , MapPinned, X } from "lucide-react"
import ContactListModal from "../components/molecules/ContactListModal.jsx"
import ViolationReportModal from "../components/molecules/ViolationReportModal.jsx"
import LiveGoodsTable from "../components/organisms/LiveGoodsTable.jsx"
import MoneyInputModal from "../components/molecules/MoneyInputModal.jsx"
export default function AiLiveVideoDetailPageSpec() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [confirmSeconds, setConfirmSeconds] = useState(300)
  const [locked, setLocked] = useState(false)
  const [blink, setBlink] = useState(false)
  const [audioOn, setAudioOn] = useState(false)
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  const [ownerDecision, setOwnerDecision] = useState("none")
  const [titleInputMoney, setTitleInputMoney] = useState(t("aiLiveMovie.noAds", "TẮT QUẢNG CÁO"))
  const beep = () => {
    
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
    setBlink(confirmSeconds <= 240)
    if (confirmSeconds <= 120 && !audioOn) setAudioOn(true)
  }, [confirmSeconds])

  useEffect(() => {
    if (!audioOn) return
    const id = setInterval(() => beep(), 10000)
    return () => clearInterval(id)
  }, [audioOn])

  const viewers = 2112
  const reactions = 12
  const name = `${t("aiLiveVideo.video", "VIDEO")} ${id}`
  const productId = `PRD-${String(id).padStart(3, "0")}`
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

  const onSaveHandle = () => {
    console.log("Save")
    setIsSaved(!isSaved)
  }

  const onDisableAd = () => {
    console.log("Disable Ad")
    setTitleInputMoney(t("aiLiveMovie.noAds", "TẮT QUẢNG CÁO"))
    setShowMoneyInput(true)
  }
  const [showMoneyInput, setShowMoneyInput] = useState(false)
  const [showCloseAd, setShowCloseAd] = useState(false)
  const [isAdVisible, setIsAdVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseAd(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const [messageType, setMessageType] = useState("THUONG")
  const [messageText, setMessageText] = useState("")
  const [messageList, setMessageList] = useState([
    { id: "m1", type: "THUONG", text: "Xin chào mọi người", time: "18:01" },
    { id: "m2", type: "VIP", text: "Ưu đãi đặc biệt hôm nay", time: "18:05" }
  ])
  const [showMessageList, setShowMessageList] = useState(false)

  const onSendMessage = () => {
    if (!messageText.trim()) return
    const id = `m${Date.now()}`
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessageList(prev => [...prev, { id, type: messageType, text: messageText, time }])
    setMessageText("")
    setTitleInputMoney(messageType === "THUONG" ? "Giá nhắn tin thường" : "Giá nhắn tin VIP")
    setShowMoneyInput(true)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setTitleInputMoney("Giá xem phim")
      setShowMoneyInput(true)
    }, 3000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="p-2">
      {/* <div className="mb-4 flex items-center justify-between">
        <button className="text-blue-600 underline" onClick={() => navigate(-1)}>{t("common.back", "Quay lại")}</button>
        <div className="text-sm">{t("aiLiveVideo.detail", "Chi tiết video")}</div>
      </div> */}

      <div className="grid grid-cols-1 gap-6">
        <div className="relative border border-black h-screen">
          <div className="text-xs flex  items-start justify-start">
            <img className="w-8 h-8 rounded-full" src={{}} />
            <div className="font-bold ml-2">{name}</div>
            <div className="font-bold ml-2">{productId}</div>

          </div>  
          <div className="absolute top-2 right-2 text-xs">
            <div className="flex items-center gap-2">
              <select value={messageType} onChange={e => setMessageType(e.target.value)} className="border border-black rounded px-2 py-1 text-xs">
                <option value="THUONG">TN thường</option>
                <option value="VIP">TN VIP</option>
              </select>
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSendMessage()}
                className="border border-black rounded px-2 py-1 text-xs w-40"
                placeholder="Nhập tin nhắn"
              />
              <button
                onClick={onSendMessage}
                className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
              >
                Gửi
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={() => setShowMessageList(v => !v)}
                className="px-2 py-1 rounded bg-gray-200 text-xs"
              >
                {showMessageList ? "Ẩn" : "Hiện"} danh sách TN
              </button>
            </div>
            {showMessageList && (
              <div className="absolute top-16 right-0 w-56 bg-white border border-black rounded shadow p-2 max-h-48 overflow-auto z-20">
                {messageList.map(m => (
                  <div key={m.id} className={`border rounded px-2 py-1 mb-1 text-xs ${m.type === "VIP" ? "border-yellow-400" : ""}`}>
                    <div className="text-[10px] text-gray-500">{m.type === "VIP" ? "VIP" : "Thường"} • {m.time}</div>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute left-2 top-10 space-y-2 text-xs">
            <div className="flex items-center gap-1"><Eye size={24} /><span>{viewers} đang xem</span></div>
            <div className="flex items-center gap-1"><Clock size={24} /><span className="font-semibold">25/12/2025 13:02 VNT</span></div>
            <div className="flex items-center gap-1"><MapPinned size={24} /><span className="font-semibold">Hà Nội, Việt Nam</span></div>
          </div>
          <div className="absolute right-3 bottom-3 flex flex-col items-center gap-2 z-10">
            <button onClick={() => onFollowHandle()} className={`border border-black p-2 rounded  text-sm font-bold ${isFollowed ? "bg-blue-300" : "bg-white"}`}><UserCheck size={18} /></button>
            <button onClick={() => onSaveHandle()} className={`border border-black p-2 rounded  text-sm font-bold ${isSaved ? "bg-blue-300" : "bg-white"}`}><Save size={18} /></button>
            <button className="border border-black bg-white p-2 rounded" onClick={() => setShowShare(true)}><Forward size={18} /></button>
            <button className="border border-black bg-white p-2 rounded" onClick={() => setShowReport(true)}><Flag size={18} /></button>
          </div>
          {isAdVisible && (
            <div className="absolute bg-gray-200 bottom-3 p-3 w-full text-center">
              {showCloseAd && (
                <button
                  onClick={() => setIsAdVisible(false)}
                  className="absolute top-0 left-0 bg-gray-800 text-white rounded-br p-1 hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              )}
              Quảng cáo
            </div>
          )}
        </div>
      </div>
      
      <ContactListModal
        contacts={contacts}
        open={showShare}
        onClose={() => setShowShare(false)}
        onSend={() => setShowShare(false)}
      />
      <ViolationReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={() => setShowReport(false)}
        type="nomarl"
      />
      <MoneyInputModal
        open={showMoneyInput}
        title={titleInputMoney}
        onClose={() => setShowMoneyInput(false)}
        onSubmit={() => setShowMoneyInput(false)}
      />
    </div>
  )
}
