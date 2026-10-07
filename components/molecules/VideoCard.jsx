"use client";
import React, { useState } from "react"
import PropTypes from "prop-types"
import { Eye, Handshake, Share2, Play } from "lucide-react"
import OtpModal from "./OtpModal"
import platformLogo from "../../assets/planet.jpg"

export default function VideoCard({ index, name, productId, viewers, saves, shares, hasPlatformLogo, selected, onClick, onPlay, avatar }) {
  const [showOtp, setShowOtp] = useState(false)

  const handleConfirmOtp = () => {
    if (onPlay) onPlay()
    else onClick()
  }

  return (
    <div
      className={`border ${selected ? "border-green-500" : "border-green-600"} rounded-sm flex flex-col w-full h-full px-2 py-2 text-left`}
    >
      {/* Header: avatar người đăng (góc trái) trước tên hàng hóa; Logo nền tảng (góc phải) */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-start gap-1 min-w-0">
          {avatar
            ? <img className="w-6 h-6 rounded-full shrink-0" src={avatar} alt="avt" />
            : <span className="text-xs font-bold text-blue-700 shrink-0">AVT-</span>}
          <span className="text-xs font-bold text-blue-800 truncate">{name} <span className="text-blue-700">{productId}</span></span>
        </div>
        {hasPlatformLogo && (
          <img src={platformLogo} alt="Logo nền tảng" title="Logo nền tảng" className="w-6 h-6 rounded-full object-cover shrink-0" />
        )}
      </div>

      <button type="button" onClick={onClick} className="flex flex-col text-left mt-1 hover:opacity-80">
        <div className="flex items-center gap-1 text-xs text-blue-700">
          <Handshake size={15} />
          <span>{saves}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Eye size={15} />
          <span>{viewers} đang xem</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-700">
          <Share2 size={15} />
          <span>{shares}</span>
        </div>
        <div className="font-extrabold text-lg text-center">{index}</div>
      </button>

      {/* Phát: bấm -> mở modal OTP (có sẵn) -> đúng mới qua trang phát video */}
      <button
        type="button"
        onClick={() => setShowOtp(true)}
        className="flex items-center justify-center gap-1 text-sm mt-auto"
      >
        <Play size={14} className="text-blue-600" />
        <span className="text-blue-600">Phát</span>
      </button>

      <OtpModal
        open={showOtp}
        onClose={() => setShowOtp(false)}
        onConfirm={handleConfirmOtp}
        title="NHẬP OTP ĐỂ PHÁT VIDEO"
      />
    </div>
  )
}

VideoCard.propTypes = {
  index: PropTypes.number.isRequired,
  name: PropTypes.string,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  viewers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  saves: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  shares: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hasPlatformLogo: PropTypes.bool,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  onPlay: PropTypes.func,
  avatar: PropTypes.string,
}

VideoCard.defaultProps = {
  name: "",
  productId: "",
  viewers: 0,
  saves: 0,
  shares: 0,
  hasPlatformLogo: false,
  selected: false,
  onClick: () => { },
}
