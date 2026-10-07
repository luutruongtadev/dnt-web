"use client";
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import ProductGridReadOnly from "../ProductGridReadOnly"
import OtpModal from "../molecules/OtpModal"

const numberValue = (value) => {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

// Căn phải, có dấu phẩy cách 3 số
const formatMoney = (value) => {
  const next = numberValue(value)
  return next ? next.toLocaleString("vi-VN") : "0"
}

// Thuế GTGT + TNCN (mặc định; lấy từ field item khi có)
const computeTax = (item, thanhTien) => {
  const vatRate = numberValue(item.vatRate ?? 8)
  const pitRate = numberValue(item.pitRate ?? 0)
  return thanhTien * (vatRate + pitRate) / 100
}
// Tổng tiền cần trả sau khi cộng thuế và trừ thưởng, giảm giá
const computeTotalPayable = (item, thanhTien, tax) => {
  const discount = numberValue(item.discountAmount ?? 0)
  const reward = numberValue(item.rewardAmount ?? 0)
  return thanhTien + tax - discount - reward
}

const keyOf = (item, index) => item.documentId || item.id || item.rowIndex || index

const formatCountdown = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")} : ${String(s % 60).padStart(2, "0")}`

// Cùng 1 khách đặt nhiều mặt hàng -> cùng 1 màu nền
const CUSTOMER_COLORS = ["#fef9c3", "#dbeafe", "#dcfce7", "#fce7f3", "#f3e8ff", "#ffedd5"]
const colorForCustomer = (name, palette) => {
  if (!name) return undefined
  if (!palette.has(name)) palette.set(name, CUSTOMER_COLORS[palette.size % CUSTOMER_COLORS.length])
  return palette.get(name)
}

/**
 * Bảng hàng hóa trong phiên live: tái dùng ProductGridReadOnly để hiển thị đủ
 * các cột product item của phần ĐĂNG BÀI, và gắn thêm cột cuối tùy theo vai trò:
 *  - joiner (khách): HỒ SƠ ĐÁP ỨNG (tải lên + hiển thị phản hồi từ chủ bài đăng),
 *    và 1 nút XÁC NHẬN -> OTP ở dưới cùng.
 *  - poster (chủ bài đăng): HỒ SƠ ĐÁP ỨNG + cột XÁC NHẬN với 2 nút ĐỒNG Ý / TỪ CHỐI.
 */
// Chủ bài đăng có 5 phút để xác nhận giá của người tham gia
const CONFIRM_WINDOW_SEC = 5 * 60

export default function LiveGoodsTable({ items = [], bids = [], onConfirmBid, onDecide, mode = "joiner", onClose }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const [otpOpen, setOtpOpen] = useState(false)
  const [liveItems, setLiveItems] = useState(items)

  useEffect(() => setLiveItems(items), [items])

  // Giá đặt mới nhất của khách theo từng mặt hàng
  const latestBidByItem = useMemo(() => {
    return bids.reduce((acc, bid) => {
      const key = bid.productItemDocumentId || bid.productItemId || bid.itemIndex
      if (key !== undefined && acc[key] === undefined) acc[key] = bid
      return acc
    }, {})
  }, [bids])

  // Đồng hồ đếm ngược 5 phút tính từ lúc người tham gia đặt giá (chưa có phản hồi)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const secondsLeft = (bid) => {
    const elapsed = Math.floor((now - new Date(bid.createdAt).getTime()) / 1000)
    return Math.max(0, CONFIRM_WINDOW_SEC - elapsed)
  }

  // Còn dòng nào đang chờ chủ bài đăng xác nhận thì khóa nút XÁC NHẬN của người tham gia
  const hasPendingBid = Object.values(latestBidByItem).some((bid) => !bid.decision)

  const uploadButton = (
    <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
      {t("productGrid.uploadFile", "Tải lên")}
    </button>
  )

  /* -------- Chủ bài đăng: giá khách đặt + phí + (30)(31)(32) + XÁC NHẬN (đếm ngược) -------- */
  if (mode === "poster") {
    const numCell = (value, bold = false) => (
      <div className={`w-full text-right pr-2 whitespace-nowrap ${bold ? "font-bold" : ""}`}>{formatMoney(value)}</div>
    )
    const bidOf = (item, index) => latestBidByItem[item.documentId] || latestBidByItem[item.id] || latestBidByItem[index]

    // Tô cùng màu nền cho các mặt hàng của cùng 1 khách
    const palette = new Map()
    const rowStyle = (item, index) => {
      const bg = colorForCustomer(bidOf(item, index)?.viewerName, palette)
      return bg ? { backgroundColor: bg } : {}
    }

    const extraColumns = [
      { header: t("liveGoods.customerQuantity", "KHÁCH ĐẶT SỐ LƯỢNG"), render: (item, index) => numCell(bidOf(item, index)?.quantity) },
      { header: t("liveGoods.customerUnitPrice", "KHÁCH ĐẶT ĐƠN GIÁ"), render: (item, index) => numCell(bidOf(item, index)?.unitPrice) },
      {
        header: t("liveGoods.customerTotal", "THÀNH TIỀN"),
        render: (item, index) => {
          const bid = bidOf(item, index)
          return numCell(bid?.totalAmount || numberValue(bid?.quantity) * numberValue(bid?.unitPrice), true)
        },
      },
      { header: t("liveGoods.platformFee", "TỔNG PHÍ NỀN TẢNG (không tính phần trả trước)"), render: (item) => numCell(item.platformFee) },
      { header: `(30) ${t("liveGoods.autoApproveLowest", "TỰ ĐỘNG DUYỆT")}`, render: (item) => numCell(item.autoAcceptPriceLow || item.autoAcceptPrice) },
      { header: `(31) ${t("liveGoods.autoRejectLowest", "TỰ ĐỘNG TỪ CHỐI")}`, render: (item) => numCell(item.autoRejectPrice || item.autoRejectPriceLow) },
      { header: `(32) ${t("liveGoods.responseProfile", "HỒ SƠ ĐÁP ỨNG")}`, render: () => uploadButton },
      {
        header: t("customerConfirm.title", "XÁC NHẬN"),
        render: (item, index) => {
          const bid = bidOf(item, index)
          if (!bid) return <span className="text-[10px] text-gray-500">—</span>
          const decision = bid.decision
          const sec = secondsLeft(bid)
          if (decision) {
            return (
              <span className={`text-xs font-bold ${decision === "accepted" ? "text-blue-700" : "text-red-600"}`}>
                {decision === "accepted" ? t("liveConfirm.agreed", "ĐÃ ĐỒNG Ý") : t("liveConfirm.rejected", "ĐÃ TỪ CHỐI")}
              </span>
            )
          }
          return (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDecide?.(bid.id, "accepted")}
                  className="px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: "#1e40af" }}
                >
                  {t("liveConfirm.agree", "ĐỒNG Ý")}
                </button>
                <button
                  type="button"
                  onClick={() => onDecide?.(bid.id, "rejected")}
                  className="px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  {t("liveConfirm.reject", "TỪ CHỐI")}
                </button>
              </div>
              <span className={`text-sm font-bold tabular-nums ${sec <= 10 ? "text-red-600" : ""}`}>{formatCountdown(sec)}</span>
            </div>
          )
        },
      },
    ]
    return (
      <div className="relative mt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", "Đóng")}
            className="absolute -top-2 -right-2 z-10 bg-red-600 text-white w-6 h-6 flex items-center justify-center font-bold leading-none"
          >
            X
          </button>
        )}
        <ProductGridReadOnly products={items} extraColumns={extraColumns} rowStyle={rowStyle} />
      </div>
    )
  }

  /* -------- Khách (joiner): thuế + tổng tiền + HỒ SƠ ĐÁP ỨNG + XÁC NHẬN -> OTP -------- */
  const joinerExtraColumns = [
    {
      header: `(27) ${t("liveGoods.taxVatPit", "THUẾ GTGT + TNCN")}`,
      render: (item) => {
        const thanhTien = numberValue(item.orderQuantity) * numberValue(item.orderUnitPrice)
        return <div className="w-full text-right pr-2 whitespace-nowrap">{formatMoney(computeTax(item, thanhTien))}</div>
      },
    },
    {
      header: `(28) ${t("liveGoods.totalPayable", "TỔNG TIỀN CẦN TRẢ SAU KHI CỘNG THUẾ GTGT + TNCN VÀ TRỪ THƯỞNG, GIẢM GIÁ")}`,
      render: (item) => {
        const thanhTien = numberValue(item.orderQuantity) * numberValue(item.orderUnitPrice)
        const tax = computeTax(item, thanhTien)
        return <div className="w-full text-right pr-2 whitespace-nowrap font-bold">{formatMoney(computeTotalPayable(item, thanhTien, tax))}</div>
      },
    },
    {
      header: `(29) ${t("liveGoods.responseProfile", "HỒ SƠ ĐÁP ỨNG")}`,
      render: () => <div className="flex flex-col items-center gap-1">{uploadButton}</div>,
    },
    {
      header: t("liveGoods.posterConfirm", "XÁC NHẬN CỦA CHỦ BÀI ĐĂNG"),
      render: (item, index) => {
        const bid = latestBidByItem[item.documentId] || latestBidByItem[item.id] || latestBidByItem[index]
        if (!bid) return <span className="text-[10px] text-gray-500">—</span>
        // Đã xác nhận: 1 ô chữ, bỏ đồng hồ
        if (bid.decision) {
          return (
            <span className={`text-xs font-bold ${bid.decision === "accepted" ? "text-blue-700" : "text-red-600"}`}>
              {bid.decision === "accepted" ? t("liveConfirm.agreed", "ĐÃ ĐỒNG Ý") : t("liveConfirm.rejected", "ĐÃ TỪ CHỐI")}
            </span>
          )
        }
        // Chưa xác nhận: 2 ô + đồng hồ đếm ngược 5 phút (người tham gia chỉ xem)
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: "#1e40af" }}>{t("liveConfirm.agree", "ĐỒNG Ý")}</span>
              <span className="px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: "#ef4444" }}>{t("liveConfirm.reject", "TỪ CHỐI")}</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-red-600">{formatCountdown(secondsLeft(bid))}</span>
          </div>
        )
      },
    },
  ]

  const submitAll = () => {
    liveItems.forEach((item, index) => {
      const quantity = numberValue(item.orderQuantity)
      const unitPrice = numberValue(item.orderUnitPrice)
      if (quantity > 0 && unitPrice > 0) {
        onConfirmBid?.(item, index, {
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          note: item.note || "",
        })
      }
    })
  }

  return (
    <div className="relative mt-4">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close", "Đóng")}
          className="absolute -top-2 -right-2 z-10 bg-red-600 text-white w-6 h-6 flex items-center justify-center font-bold leading-none"
        >
          X
        </button>
      )}
      <ProductGridReadOnly products={items} onItemsChange={setLiveItems} extraColumns={joinerExtraColumns} />
      {/* XÁC NHẬN cần nhập OTP */}
      <div className="flex items-center justify-center mt-3">
        <button
          type="button"
          disabled={hasPendingBid}
          title={hasPendingBid ? t("liveGoods.waitPoster", "Chờ chủ bài đăng xác nhận") : undefined}
          onClick={() => setOtpOpen(true)}
          className="border-2 border-black px-8 py-2 font-bold hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {t("customerConfirm.title", "XÁC NHẬN")}
        </button>
      </div>
      <OtpModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onConfirm={submitAll}
        title={`${t("customerConfirm.title", "XÁC NHẬN")} - OTP`}
      />
    </div>
  )
}
