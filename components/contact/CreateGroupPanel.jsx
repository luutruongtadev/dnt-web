"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { Users, Camera } from "lucide-react"

// Create/edit group panel — #C-08.
// Only the group owner can add/remove members, and only from their own friends list.
export default function CreateGroupPanel({ isOpen, onClose, friends, existingGroup, onSave }) {
  const [name, setName] = useState(existingGroup?.name || "")
  const [avatar, setAvatar] = useState(existingGroup?.avatar || "")
  const [selectedIds, setSelectedIds] = useState(new Set(existingGroup?.memberIds || []))
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [step, setStep] = useState("form") // 'form' | 'otp'
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")

  if (!isOpen) return null

  const toggleMember = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const handleUpdateClick = () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên nhóm")
      return
    }
    if (selectedIds.size < 2) {
      setError("Nhóm cần ít nhất 3 người (bạn + 2 thành viên trở lên)")
      return
    }
    setError("")
    setStep("otp")
  }

  const handleConfirmOtp = () => {
    if (!/^\d{4,8}$/.test(otp)) {
      setError("Mã OTP không hợp lệ (4-8 chữ số)")
      return
    }
    onSave({
      id: existingGroup?.id,
      name: name.trim(),
      avatar: avatar || `https://i.pravatar.cc/150?u=${Date.now()}`,
      memberIds: Array.from(selectedIds),
    })
    setStep("form")
    setOtp("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-lg p-5 w-full max-w-md">
        <button className="absolute top-2 right-3 text-gray-600 hover:text-black" onClick={onClose}>✕</button>
        <h3 className="text-lg font-bold text-blue-900 mb-4">
          {existingGroup ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}
        </h3>

        {step === "form" ? (
          <>
            <div className="flex flex-col items-center mb-4">
              <label className="relative cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="group avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={28} className="text-blue-400" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 bg-blue-700 text-white rounded-full p-1">
                  <Camera size={12} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              <span className="text-xs text-gray-400 mt-1">Ấn vào ảnh để đổi ảnh nhóm</span>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên nhóm"
              className="border p-2 rounded w-full text-sm mb-3 text-blue-900"
            />

            <button
              type="button"
              onClick={() => setShowMemberPicker((v) => !v)}
              className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-2"
            >
              <Users size={16} /> Thành viên ({selectedIds.size})
            </button>

            {showMemberPicker && (
              <div className="border rounded max-h-48 overflow-y-auto mb-3">
                {friends.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleMember(f.id)}
                    />
                    <img src={f.avatar} alt={f.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-blue-900">{f.displayName || f.name}</span>
                  </label>
                ))}
                <p className="text-[11px] text-gray-400 px-3 py-1">
                  Chỉ có thể thêm thành viên từ danh sách bạn của bạn.
                </p>
              </div>
            )}

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <button
              onClick={handleUpdateClick}
              className="w-full bg-blue-700 text-white font-bold py-2 rounded hover:bg-blue-800"
            >
              CẬP NHẬT
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Vui lòng nhập mật mã OTP của chủ tài khoản để xác nhận {existingGroup ? "cập nhật" : "tạo"} nhóm.
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 8)); setError("") }}
              placeholder="Mã OTP"
              className="border p-2 rounded w-full text-sm mb-3 text-center tracking-widest"
            />
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              onClick={handleConfirmOtp}
              className="w-full bg-blue-700 text-white font-bold py-2 rounded hover:bg-blue-800"
            >
              XÁC NHẬN OTP
            </button>
          </>
        )}
      </div>
    </div>
  )
}

CreateGroupPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friends: PropTypes.array.isRequired,
  existingGroup: PropTypes.object,
  onSave: PropTypes.func.isRequired,
}
