"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { QrCode, ScanLine } from "lucide-react"
import QRModalComponent from "../QRModalComponent"
import QrCodeDisplay from "../molecules/QrCodeDisplay"

// Shared QR flow for both "add friend" (#C-06) and "join group" (#C-09):
// toggle between scanning someone else's QR and showing/downloading your own.
// `myPayload` is the identity object encoded into the QR (e.g. { userId, name }
// for add-friend) — the scanning side (handleAddFriendScanResult /
// handleJoinGroupScanResult) parses it back out as JSON.
// Hiển thị "QR của tôi" dùng chung component QrCodeDisplay với QR đăng nhập ở
// header (đồng bộ UI/thư viện) — dữ liệu mã hoá vẫn tách biệt vì khác mục đích bảo mật.
export default function ContactQrModal({ isOpen, onClose, onScanResult, myQrLabel, myPayload }) {
  const [mode, setMode] = useState("scan") // 'scan' | 'mine'

  if (!isOpen) return null

  const handleClose = () => {
    setMode("scan")
    onClose()
  }

  return (
    <>
      {/* Mode toggle — always on top so it's reachable regardless of which view is showing */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100002] flex gap-2 bg-white rounded-full shadow-lg p-1">
        <button
          onClick={() => setMode("scan")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "scan" ? "bg-blue-700 text-white" : "text-blue-700 hover:bg-blue-50"}`}
        >
          <ScanLine size={15} /> Quét QR
        </button>
        <button
          onClick={() => setMode("mine")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "mine" ? "bg-blue-700 text-white" : "text-blue-700 hover:bg-blue-50"}`}
        >
          <QrCode size={15} /> QR của tôi
        </button>
      </div>

      {mode === "scan" ? (
        <QRModalComponent isOpen={isOpen} onClose={handleClose} onScanResult={onScanResult} />
      ) : (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md flex flex-col items-center">
            <button className="absolute top-1 right-2 text-gray-600 hover:text-black" onClick={handleClose}>✕</button>
            <QrCodeDisplay payload={myPayload} label={myQrLabel} className="mt-4" downloadFileName="my-qr.png" />
          </div>
        </div>
      )}
    </>
  )
}

ContactQrModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onScanResult: PropTypes.func.isRequired,
  myQrLabel: PropTypes.string,
  myPayload: PropTypes.object,
}

ContactQrModal.defaultProps = {
  myQrLabel: "Mã QR của bạn — cho người khác quét để kết bạn",
  myPayload: null,
}
