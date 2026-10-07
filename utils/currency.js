import { COUNTRY_CURRENCY_RATES, CURRENCY_LABELS, COUNTRY_ALIASES } from "../constants/currencyRates"
import { getUserCountry } from "./user"

// Số D cho 1 đơn vị tiền tệ, tra theo mã (VD: VND = 1, USD = 25.000)
export const D_PER_CURRENCY = COUNTRY_CURRENCY_RATES.reduce((acc, [, code, rate]) => {
  if (!(code in acc)) acc[code] = rate
  return acc
}, {})

const RATE_BY_COUNTRY = new Map(COUNTRY_CURRENCY_RATES.map(([country, code, rate]) => [country.toLowerCase(), { country, code, rate }]))

export const DEFAULT_CURRENCY = { country: "Vietnam", code: "VND", rate: 1 }

// Đơn vị tiền tệ của một quốc gia; không có trong bảng thì dùng VNĐ
export const getCurrencyByCountry = (country) => {
  const key = String(country || "").trim().toLowerCase()
  if (!key) return DEFAULT_CURRENCY
  const alias = COUNTRY_ALIASES[key]
  return RATE_BY_COUNTRY.get(alias ? alias.toLowerCase() : key) || DEFAULT_CURRENCY
}

// Đơn vị tiền tệ theo quốc gia người dùng đăng ký
export const getUserCurrency = () => getCurrencyByCountry(getUserCountry())

export const currencyLabel = (code) => CURRENCY_LABELS[code] || code

export const toNumber = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// Đổi số D sang đơn vị tiền tệ (mặc định: tiền tệ của người dùng); "" khi chưa nhập để ô quy đổi để trống
export const convertD = (amountD, currency = getUserCurrency().code) => {
  if (amountD === "" || amountD === null || amountD === undefined) return ""
  return toNumber(amountD) / (D_PER_CURRENCY[currency] || 1)
}

export const formatMoney = (value, currency = getUserCurrency().code) => {
  if (value === "" || value === null || value === undefined) return ""
  // Tiền tệ có giá trị lớn hơn D (VD: USD, EURO) cần hiện phần lẻ
  const decimals = (D_PER_CURRENCY[currency] || 1) > 1 ? 2 : 0
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: decimals })
}
