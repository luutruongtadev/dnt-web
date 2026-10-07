import { getUserCurrency, toNumber } from "./currency"

// Mẫu đăng bài HÀNG BÁN - HÀNG HÓA - PHẾ LIỆU. Bảng mục 2 có 2 bố cục:
// Sheet "...PHẾ LIỆU 1"  -> THỜI LƯỢNG THỰC HIỆN = 1 LẦN (bán một lần, có tổng thành tiền ước tính)
// Sheet "...PHẾ LI (2)"  -> THỜI LƯỢNG THỰC HIỆN = 1 NĂM (cung cấp hàng tháng theo hợp đồng)
export const SCRAP_DURATION = { ONE_TIME: "one-time", ONE_YEAR: "one-year" };

export const emptyScrapItem = (id, duration = SCRAP_DURATION.ONE_TIME) => ({
  id,
  name: "",
  model: "",
  shape: "",
  size: "",
  color: "",
  image: null,
  videoFile: null,
  qualityInfoText: "",
  qualityInfoFile: null,
  contractDurationMultiplicity: duration,
  maxDeliveryDaysAfterAcceptance: "",
  handoverLocation: "Kho người bán",
  invoiceType: "",
  quantityEstimated: "",
  quantityStock: "",
  quantityMonthly: "",
  unit: "",
  unitMarketPrice: "",
  unitAskingPrice: "",
  askingCurrency: getUserCurrency().code,
  depositRequirement: "",
  note: "",
  autoAcceptPrice: "",
  autoRejectPrice: "",
});

// Hóa đơn tự động theo loại tài khoản (cột XUẤT HÓA ĐƠN)
export const invoiceTypeForAccount = (accountType) => (accountType === "doanh_nghiep" ? "vat" : "sales");
export const INVOICE_LABEL = { vat: "GIÁ TRỊ GIA TĂNG", sales: "BÁN HÀNG" };

export const estimatedTotal = (item) => toNumber(item.quantityEstimated) * toNumber(item.unitAskingPrice);
export const remainingPayment = (item) => estimatedTotal(item) - toNumber(item.depositRequirement);

export const SALE_MODES = [
  { value: "per_item", label: "BÁN RIÊNG TỪNG MỤC" },
  { value: "whole_post", label: "BÁN TOÀN BỘ BÀI ĐĂNG" },
]

// Giá trị cài đặt mặc định của sheet
export const POST_DISPLAY_FEE_DEFAULT = { fee: 50000, days: 7 }

// Tổng giá trị bài đăng: 1 LẦN = SL ước lượng x đơn giá; 1 NĂM = SL hàng tháng x 12 x đơn giá
export const scrapPostTotal = (items) =>
  items.reduce((sum, it) => {
    if (it.contractDurationMultiplicity === SCRAP_DURATION.ONE_YEAR) {
      return sum + toNumber(it.quantityMonthly) * 12 * toNumber(it.unitAskingPrice)
    }
    return sum + estimatedTotal(it)
  }, 0)

// KÝ QUỸ ủy thác: lớn hơn 10% tổng giá trị bài đăng, hoặc bằng tổng yêu cầu đặt cọc nếu nó lớn hơn 10%
export const minTrustDeposit = (items) => {
  const tenPercent = scrapPostTotal(items) * 0.1
  const totalDeposit = items.reduce((sum, it) => sum + toNumber(it.depositRequirement), 0)
  return Math.max(tenPercent, totalDeposit)
}
