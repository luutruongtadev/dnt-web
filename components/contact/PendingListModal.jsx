"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { Check, X } from "lucide-react"

// Generic "pending rows with avatar + name + action button(s)" list, reused for:
// friend requests (#C-05), group invites (#C-07), and the single-row confirmation
// shown after a successful QR scan (#C-06, #C-09).
export default function PendingListModal({
  isOpen,
  onClose,
  title,
  items,
  onAccept,
  onReject,
  acceptLabel,
  rejectLabel,
  allowRename,
  onRename,
  emptyText,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")

  if (!isOpen) return null

  const startRename = (item) => {
    if (!allowRename) return
    setEditingId(item.id)
    setEditValue(item.displayName || item.name)
  }

  const commitRename = (item) => {
    if (onRename && editValue.trim()) onRename(item.id, editValue.trim())
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-lg p-5 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <button className="absolute top-2 right-3 text-gray-600 hover:text-black" onClick={onClose}>✕</button>
        <h3 className="text-lg font-bold text-blue-900 mb-4">{title}</h3>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitRename(item)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(item)}
                      className="border-b border-blue-400 outline-none text-sm w-full text-blue-900"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRename(item)}
                      className={`text-sm font-medium text-blue-900 truncate text-left ${allowRename ? "opacity-60 hover:opacity-100" : ""}`}
                      title={allowRename ? "Ấn vào để nhập tên hiển thị mới" : undefined}
                    >
                      {item.displayName || item.name}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onAccept(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800"
                  >
                    <Check size={13} /> {acceptLabel}
                  </button>
                  {onReject && (
                    <button
                      onClick={() => onReject(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-semibold hover:bg-gray-100"
                    >
                      <X size={13} /> {rejectLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

PendingListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func,
  acceptLabel: PropTypes.string,
  rejectLabel: PropTypes.string,
  allowRename: PropTypes.bool,
  onRename: PropTypes.func,
  emptyText: PropTypes.string,
}

PendingListModal.defaultProps = {
  acceptLabel: "ĐỒNG Ý",
  rejectLabel: "TỪ CHỐI",
  allowRename: false,
  emptyText: "Không có lời mời nào đang chờ.",
}
