"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

export default function ContactListModal({ contacts, open, onClose, onSend }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  if (!open) return null

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[520px] border border-black rounded">
        <div className="px-4 py-3 font-bold border-b flex items-center gap-2">
          <span>{t("aiLiveVideo.share", "Chia sẻ")}</span>
        </div>
        <div className="px-4 py-3 border-b">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search", "Tìm kiếm liên hệ")}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="p-3 max-h-[360px] overflow-auto">
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between border px-3 py-2 text-sm">
                <span>{c.name}</span>
                <button className="px-3 py-1 border bg-blue-100" onClick={() => onSend(c)}>{t("aiLiveMovie.send", "GỬI")}</button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 px-3 py-2">{t("common.noResults", "Không có kết quả")}</div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t text-right">
          <button className="text-red-600 underline" onClick={onClose}>{t("common.close", "Đóng")}</button>
        </div>
      </div>
    </div>
  )
}

ContactListModal.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, name: PropTypes.string.isRequired })
  ).isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
}