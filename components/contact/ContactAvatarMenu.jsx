"use client";
import PropTypes from "prop-types"
import { EyeOff, Trash2, Flag, ShieldX } from "lucide-react"

// Quick-action dropdown opened from the vertical 3-dot button placed next to a
// conversation's avatar (left side). Distinct from ConversationItemMenu (right
// side): Ẩn / Xóa tên / Báo cáo / (chưa xác định).
export default function ContactAvatarMenu({ onHide, onDelete, onReport, onCloseMenu }) {
  const item = (icon, label, onClick, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onClick?.()
        onCloseMenu()
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
        disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-blue-900 hover:bg-blue-50"
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div
      className="absolute left-10 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-44 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {item(<EyeOff size={15} />, "Ẩn", onHide)}
      {item(<Trash2 size={15} />, "Xóa tên", onDelete)}
      {item(<Flag size={15} />, "Báo cáo", onReport)}
      {item(<ShieldX size={15} />, "Chưa xác định", undefined, true)}
    </div>
  )
}

ContactAvatarMenu.propTypes = {
  onHide: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  onCloseMenu: PropTypes.func.isRequired,
}
