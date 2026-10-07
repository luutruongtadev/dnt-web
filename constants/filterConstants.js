// Bộ lọc theo sheet "Bộ lọc" (01.10 TIỀN TỆ + BỘ LỌC + ĐĂNG BÀI MỚI.xlsx):
// DANH MỤC -> PHÂN LOẠI -> TÌNH TRẠNG. Mỗi tình trạng mang số mẫu ĐĂNG BÀI MỚI (postNo)
// và % NỘP HỘ THUẾ GTGT / TNCN (vatPercent / pitPercent) áp cho cả nhóm phân loại nếu sheet có quy định.
// `en` là giá trị lưu trên sản phẩm (listingType / categoryType / conditionType) và gửi lên API lọc.

const cond = (vi, en, code) => ({ vi, en, code })

// Nhóm tình trạng dùng lại nhiều lần
const GOODS_STATES = [cond("PHẾ LIỆU", "SCRAP", "S"), cond("MỚI", "NEW", "N"), cond("CŨ", "OLD", "O"), cond("CHƯA SỬ DỤNG", "UNUSED", "U")]
const PREMIUM_STATES = [cond("MỚI", "NEW", "N"), cond("CŨ", "OLD", "O"), cond("CHƯA SỬ DỤNG", "UNUSED", "U"), cond("PHẾ LIỆU", "SCRAP", "S")]
const NEW_OLD_OTHER = [cond("MỚI", "NEW", "N"), cond("CŨ", "OLD", "O"), cond("KHÁC", "OTHER", "#")]
const FOOD_STATES = [cond("NÓNG", "HOT", "HO"), cond("NGUỘI", "COLD", "CO"), cond("KHÁC", "OTHER", "#")]
const DRINK_STATES = [cond("NÓNG", "HOT", "HO"), cond("LẠNH", "COLD", "CO"), cond("KHÁC", "OTHER", "#")]
const LAND_STATES = [cond("< 200 m2", "UNDER 200 M2", "200"), cond("< 1.000 m2", "UNDER 1000 M2", "1000"), cond("< 10.000 m2", "UNDER 10000 M2", "10.000"), cond("KHÁC", "OTHER", "#")]
const HOUSE_STATES = [cond("ĐỂ Ở", "RESIDENTIAL", "LF"), cond("KINH DOANH", "BUSINESS", "B"), cond("KHÁC", "OTHER", "#")]
const MANPOWER_STATES = [cond("LAO ĐỘNG PHỔ THÔNG", "GENERAL LABOR", "G"), cond("THỢ", "WORKER", "W"), cond("KỸ SƯ - GIÁM SÁT", "ENGINEER - SUPERVISOR", "S"), cond("CHUYÊN GIA", "EXPERT", "P"), cond("KHÁC", "OTHER", "#")]
const HOTEL_STATES = [cond("BÌNH THƯỜNG", "STANDARD", "L"), cond("TẦM TRUNG", "MID-RANGE", "M"), cond("HẠNG SANG", "LUXURY", "H"), cond("KHU NGHỈ DƯỠNG / SIÊU CẤP", "RESORT", "R")]
const HR_STATES = [cond("NHÂN VIÊN", "STAFF", "ST"), ...MANPOWER_STATES]

// % thuế ghi ở một dòng của sheet áp dụng cho cả nhóm phân loại
const withTax = (states, vatPercent, pitPercent) => states.map((s) => ({ ...s, vatPercent, pitPercent }))

const SERVICE_SUBCATEGORIES = [
  { vi: "MÔI TRƯỜNG", en: "ENVIRONMENT", code: "EV", conditions: [cond("DỰ ÁN", "PROJECT", "PJ"), cond("DOANH NGHIỆP", "ENTERPRISE", "CO"), cond("HỘ GIA ĐÌNH", "HOUSEHOLD", "FA"), cond("KHÁC", "OTHER", "#")] },
  { vi: "VẬN CHUYỂN NỘI BỘ", en: "INTERNAL TRANSPORT", code: "TR", conditions: [cond("DỰ ÁN", "PROJECT", "PJ"), cond("DOANH NGHIỆP", "ENTERPRISE", "CO"), cond("KHÁC", "OTHER", "#")] },
  { vi: "BẢO DƯỠNG - SỬA CHỮA", en: "MAINTENANCE - REPAIR", code: "MC", conditions: [cond("THỢ", "WORKER", "W"), cond("CHUYÊN GIA", "EXPERT", "P"), cond("KHÁC", "OTHER", "#")] },
  { vi: "QUẢN LÝ - VẬN HÀNH", en: "MANAGEMENT - OPERATION", code: "MO", conditions: withTax([cond("TRỰC TIẾP", "ONSITE", "LV"), cond("TỪ XA", "REMOTE", "RM"), cond("KHÁC", "OTHER", "#")], 3, 1.5) },
  { vi: "TÀI SẢN - TÀI CHÍNH", en: "ASSETS - FINANCE", code: "FE", conditions: [cond("NGẮN HẠN", "SHORT TERM", "SH"), cond("LÂU DÀI", "LONG TERM", "LO"), cond("KHÁC", "OTHER", "#")] },
  { vi: "XUẤT NHẬP KHẨU", en: "IMPORT - EXPORT", code: "IE", conditions: [cond("TRONG NƯỚC", "DOMESTIC", "IC"), cond("NƯỚC NGOÀI", "OVERSEAS", "OC"), cond("KHÁC", "OTHER", "#")] },
  { vi: "CAO CẤP", en: "PREMIUM", code: "S", conditions: [cond("TINH THẦN", "SPIRITUAL", "RL"), cond("VẬT CHẤT", "MATERIAL", "MT"), cond("KHÁC", "OTHER", "#")] },
]

const RENT_SUBCATEGORIES = (abroad) => [
  { vi: "THIẾT BỊ", en: "EQUIPMENT", code: "EQ", conditions: NEW_OLD_OTHER },
  { vi: "ĐẤT", en: "LAND", code: "L", conditions: withTax(LAND_STATES, 5, 5) },
  { vi: "NHÀ", en: "HOUSE", code: "H", conditions: HOUSE_STATES },
  { vi: "PHƯƠNG TIỆN", en: "VEHICLE", code: "V", conditions: NEW_OLD_OTHER },
  { vi: "KHÁCH SẠN - NHÀ NGHỈ", en: "HOTEL", code: "HT", conditions: HOTEL_STATES },
  { vi: "NHÂN VIÊN - TUYỂN DỤNG", en: "RECRUITMENT", code: "HR", conditions: HR_STATES },
  abroad,
  { vi: "CAO CẤP", en: "PREMIUM", code: "S", conditions: NEW_OLD_OTHER },
]

const RAW_TREE = [
  {
    vi: "HÀNG BÁN", en: "SALE", code: "S",
    subCategories: [
      { vi: "HÀNG HÓA", en: "GOODS", code: "G", conditions: withTax(GOODS_STATES, 1, 0.5) },
      { vi: "ĐỒ ĂN", en: "FOOD", code: "ET", conditions: FOOD_STATES },
      { vi: "ĐỒ UỐNG", en: "DRINK", code: "DR", conditions: DRINK_STATES },
      { vi: "ĐẤT", en: "LAND", code: "L", conditions: LAND_STATES },
      { vi: "NHÀ", en: "HOUSE", code: "H", conditions: HOUSE_STATES },
      { vi: "PHƯƠNG TIỆN", en: "VEHICLE", code: "V", conditions: withTax(GOODS_STATES, 1, 0.5) },
      { vi: "NHÂN LỰC", en: "MANPOWER", code: "M", conditions: MANPOWER_STATES },
      { vi: "XUẤT KHẨU", en: "EXPORT", code: "E", conditions: GOODS_STATES },
      { vi: "CAO CẤP", en: "PREMIUM", code: "S", conditions: withTax(PREMIUM_STATES, 1, 0.5) },
    ],
  },
  {
    vi: "CẦN MUA", en: "BUY", code: "B",
    subCategories: [
      { vi: "HÀNG HÓA", en: "GOODS", code: "G", conditions: withTax(GOODS_STATES, 1, 0.5) },
      { vi: "ĐỒ ĂN", en: "FOOD", code: "ET", conditions: FOOD_STATES },
      { vi: "ĐỒ UỐNG", en: "DRINK", code: "DR", conditions: DRINK_STATES },
      { vi: "ĐẤT", en: "LAND", code: "L", conditions: LAND_STATES },
      { vi: "NHÀ", en: "HOUSE", code: "H", conditions: HOUSE_STATES },
      { vi: "PHƯƠNG TIỆN", en: "VEHICLE", code: "V", conditions: withTax(GOODS_STATES, 1, 0.5) },
      { vi: "NHÂN LỰC", en: "MANPOWER", code: "M", conditions: MANPOWER_STATES },
      { vi: "XUẤT KHẨU", en: "EXPORT", code: "E", conditions: GOODS_STATES },
      { vi: "CAO CẤP", en: "PREMIUM", code: "S", conditions: PREMIUM_STATES },
    ],
  },
  {
    vi: "CẦN THUÊ", en: "RENT", code: "R",
    subCategories: RENT_SUBCATEGORIES({ vi: "TỪ NƯỚC NGOÀI", en: "FROM ABROAD", code: "FO", conditions: NEW_OLD_OTHER }),
  },
  {
    vi: "CHO THUÊ", en: "FOR RENT", code: "FR",
    subCategories: RENT_SUBCATEGORIES({ vi: "RA NƯỚC NGOÀI", en: "TO ABROAD", code: "TO", conditions: NEW_OLD_OTHER }),
  },
  { vi: "CẦN DỊCH VỤ", en: "USE SERVICES", code: "NS", subCategories: SERVICE_SUBCATEGORIES },
  { vi: "CUNG CẤP DỊCH VỤ", en: "PROVIDE SERVICES", code: "SS", subCategories: SERVICE_SUBCATEGORIES },
]

// Số thứ tự mẫu ĐĂNG BÀI MỚI (cột "ĐĂNG BÀI MỚI" của sheet) — đánh số liên tục 1..170 theo thứ tự cây
let postNo = 0
export const FILTER_TREE = RAW_TREE.map((c) => ({
  ...c,
  subCategories: c.subCategories.map((s) => ({
    ...s,
    conditions: s.conditions.map((cd) => ({ ...cd, postNo: ++postNo })),
  })),
}))

export const CATEGORY_PLACEHOLDER = { vi: "Chọn danh mục", en: "Select category" }
export const SUBCATEGORY_PLACEHOLDER = { vi: "Chọn phân loại", en: "Select subcategory" }
export const CONDITION_PLACEHOLDER = { vi: "Chọn tình trạng", en: "Select condition" }

const strip = ({ vi, en, code }) => ({ vi, en, code })

export const getCategory = (categoryEn) => FILTER_TREE.find((c) => c.en === categoryEn) || null
export const getSubCategory = (categoryEn, subEn) => getCategory(categoryEn)?.subCategories.find((s) => s.en === subEn) || null
export const getCondition = (categoryEn, subEn, conditionEn) => getSubCategory(categoryEn, subEn)?.conditions.find((c) => c.en === conditionEn) || null

// Danh sách phụ thuộc (không có placeholder)
export const getSubCategoryList = (categoryEn) => (getCategory(categoryEn)?.subCategories || []).map(strip)
export const getConditionList = (categoryEn, subEn) => getSubCategory(categoryEn, subEn)?.conditions || []

// Tìm nhãn hiển thị theo giá trị `en` đã lưu (không cần biết cấp cha)
const findIn = (list, en) => list.find((i) => i.en === en)
export const findCategoryLabel = (en) => findIn(FILTER_TREE, en) || null
export const findSubCategoryLabel = (en) => {
  for (const c of FILTER_TREE) { const s = findIn(c.subCategories, en); if (s) return s }
  return null
}
export const findConditionLabel = (en) => {
  for (const c of FILTER_TREE) for (const s of c.subCategories) { const cd = findIn(s.conditions, en); if (cd) return cd }
  return null
}

// Mẫu đăng bài HÀNG BÁN - HÀNG HÓA - PHẾ LIỆU (sheet "1. HÀNG BÁN-HÀNG HÓA-PHẾ LIỆU")
export const isSaleGoodsScrap = (categoryEn, subEn, conditionEn) => categoryEn === "SALE" && subEn === "GOODS" && conditionEn === "SCRAP"

// Giữ tương thích cho các màn hình cũ: danh sách phẳng có placeholder ở vị trí 0
export const categories = [CATEGORY_PLACEHOLDER, ...FILTER_TREE.map(strip)]

export const regions = [
    { vi: "TẤT CẢ", en: "ALL" },
    { vi: "ĐÔNG NAM BỘ", en: "SOUTH EAST", num: "I" },
    { vi: "ĐÔNG BẮC BỘ", en: "NORTH EAST", num: "II" },
    { vi: "TÂY NAM BỘ", en: "SOUTH WEST", num: "III" },
    { vi: "TÂY BẮC BỘ", en: "NORTH WEST", num: "IV" },
    { vi: "BẮC TRUNG BỘ", en: "NORTH CENTRAL", num: "V" },
    { vi: "NAM TRUNG BỘ", en: "SOUTH CENTRAL", num: "VI" },
    { vi: "TÂY NGUYÊN", en: "HIGHLANDS", num: "VII" },
    { vi: "NƯỚC KHÁC", en: "OTHER COUNTRIES", num: "VIII" },
]
