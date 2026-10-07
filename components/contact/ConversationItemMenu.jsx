"use client";
import PropTypes from "prop-types"
import { Trash2, BellOff, Pencil, LogOut } from "lucide-react"

// Quick-action dropdown shown when the user taps ("thả") the right side of a
// conversation item — #C-03.
export default function ConversationItemMenu({ isGroup, onDelete, onMute, onRename, onLeaveGroup, onCloseMenu }) {
  const item = (icon, label, onClick) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
        onCloseMenu()
      }}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-900 hover:bg-blue-50 text-left"
    >
      {icon} {label}
    </button>
  )

  return (
    <div
      className="absolute right-2 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-44 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {item(<Trash2 size={15} />, "Xóa tin nhắn", onDelete)}
      {item(<BellOff size={15} />, "Tắt thông báo", onMute)}
      {item(<Pencil size={15} />, "Chỉnh sửa tên", onRename)}
      {isGroup && item(<LogOut size={15} />, "Thoát nhóm", onLeaveGroup)}
    </div>
  )
}

ConversationItemMenu.propTypes = {
  isGroup: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onLeaveGroup: PropTypes.func,
  onCloseMenu: PropTypes.func.isRequired,
}
