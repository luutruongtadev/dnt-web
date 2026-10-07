"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

export default function ViolationReportModal({ open, onClose, onSubmit, type = "goods" }) {
  const { t } = useTranslation()
  const [lawCode, setLawCode] = useState("")
  const [article, setArticle] = useState("")
  const [clause, setClause] = useState("")
  const [point, setPoint] = useState("")
  const [detail, setDetail] = useState("")
  const [otp, setOtp] = useState("")

  if (!open) return null

  const canSubmit = lawCode.trim() && detail.trim() && otp.trim()

  const handleConfirm = () => {
    if (!canSubmit) return
    // (kiểm tra số dư VÍ và trừ số tiền 10D = 100k để đặt cọc) - xử lý ở backend khi XÁC NHẬN
    onSubmit({ type, lawCode, article, clause, point, detail, otp })
    onClose()
  }

  const star = <span className="text-red-500 mr-1">*</span>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[640px] border border-black rounded">
        <div className="px-4 py-3 font-bold border-b">{t("aiLiveVideo.report", "Báo cáo")}</div>

        <div className="p-4 space-y-4">
          {/* Loại vi phạm: BỘ LUẬT / ĐIỀU / KHOẢN / ĐIỂM */}
          <div>
            <label className="text-xs">{star}{t("aiLiveVideo.reportType", "Loại vi phạm")}</label>
            <div className="flex border border-black mt-1">
              <input
                className="flex-1 px-2 py-2 border-r border-black outline-none"
                placeholder={t("report.lawCode", "BỘ LUẬT")}
                value={lawCode}
                onChange={(e) => setLawCode(e.target.value)}
              />
              <input
                className="w-28 px-2 py-2 border-r border-black outline-none"
                placeholder={t("report.article", "ĐIỀU")}
                value={article}
                onChange={(e) => setArticle(e.target.value)}
              />
              <input
                className="w-28 px-2 py-2 border-r border-black outline-none"
                placeholder={t("report.clause", "KHOẢN")}
                value={clause}
                onChange={(e) => setClause(e.target.value)}
              />
              <input
                className="w-24 px-2 py-2 outline-none"
                placeholder={t("report.point", "ĐIỂM")}
                value={point}
                onChange={(e) => setPoint(e.target.value)}
              />
            </div>
          </div>

          {/* Nội dung cụ thể */}
          <div>
            <label className="text-xs">{star}{t("aiLiveVideo.concreteContent", "Nội dung cụ thể")}</label>
            <textarea
              className="w-full border border-black px-2 py-1 mt-1"
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
        </div>

        {/* Footer: MẬT MÃ OTP | Đóng | XÁC NHẬN */}
        <div className="px-4 py-3 border-t flex items-end justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-red-600">{star}{t("report.otp", "MẬT MÃ OTP")}</label>
            <input
              className="block w-40 border-2 border-red-500 px-2 py-2 mt-1 outline-none"
              placeholder={t("report.enter", "Nhập")}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="text-red-600 underline" onClick={onClose}>{t("common.close", "Đóng")}</button>
            <button
              className="border border-black bg-gray-100 px-6 py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit}
              onClick={handleConfirm}
            >
              {t("customerConfirm.title", "XÁC NHẬN")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ViolationReportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  type: PropTypes.string,
}
