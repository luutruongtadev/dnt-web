"use client";
import React, { useEffect, useMemo } from "react"
import PropTypes from "prop-types"
import RowNumberCell from "../atoms/RowNumberCell"
import CategoryRow from "../molecules/CategoryRow"
import NumberInput from "../atoms/NumberInput"
import FileInput from "../atoms/FileInput"
import Select from "../atoms/Select"
import ScrapSaleProductGrid from "../ScrapSaleProductGrid"
import { SALE_MODES, POST_DISPLAY_FEE_DEFAULT, minTrustDeposit } from "../../utils/scrapSalePost"
import { getCondition } from "../../constants/filterConstants"
import { getUserCountry } from "../../utils/user"
import { convertD, currencyLabel, formatMoney, getUserCurrency, toNumber } from "../../utils/currency"

// Mẫu đăng bài HÀNG BÁN - HÀNG HÓA - PHẾ LIỆU (sheet "1. HÀNG BÁN-HÀNG HÓA-PHẾ LIỆU 1" và "(2)")
const SURVEY_HOLD_D = 50000

const labelCls = "col-span-6 border-r border-gray-300 p-2 flex items-center font-medium"

function ConvertedD({ value }) {
  // Quy đổi sang tiền tệ của quốc gia người dùng đăng ký
  const { code } = getUserCurrency()
  return <div className="text-xs text-gray-600">{currencyLabel(code)} {formatMoney(convertD(value, code), code) || "………"} <span className="italic">(tự động quy đổi)</span></div>
}

ConvertedD.propTypes = { value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }

// % + số tiền D (dùng cho các dòng phí ở mục 12)
function PercentPlusD({ percentName, amountName, goodsInfo, onChange }) {
  return (
    <>
      <div className="col-span-3 border-r border-gray-300 p-2 flex items-center gap-1">
        <NumberInput name={percentName} value={goodsInfo[percentName]} onChange={onChange} step="any" className="w-full border border-gray-300 p-1 text-right" placeholder="(nhập)" />
        <span>%</span>
      </div>
      <div className="col-span-1 border-r border-gray-300 flex items-center justify-center">+</div>
      <div className="col-span-5 border-r border-gray-300 p-2 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1">
          <NumberInput name={amountName} value={goodsInfo[amountName]} onChange={onChange} className="w-full border border-gray-300 p-1 text-right" placeholder="(nhập)" />
          <span className="font-bold">D</span>
        </div>
        <ConvertedD value={goodsInfo[amountName]} />
      </div>
    </>
  )
}

PercentPlusD.propTypes = {
  percentName: PropTypes.string.isRequired,
  amountName: PropTypes.string.isRequired,
  goodsInfo: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

function PerViewInput({ name, goodsInfo, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-1">
        <NumberInput name={name} value={goodsInfo[name]} onChange={onChange} className="w-full border border-gray-300 p-1 text-right" placeholder="(nhập)" />
        <span className="font-bold whitespace-nowrap text-xs">D / GIÂY / LƯỢT XEM</span>
      </div>
      <ConvertedD value={goodsInfo[name]} />
    </div>
  )
}

PerViewInput.propTypes = { name: PropTypes.string.isRequired, goodsInfo: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired }

export default function ScrapSaleFormRows({
  selectedType,
  selectedCategory,
  selectedCondition,
  onTypeChange,
  onCategoryChange,
  onConditionChange,
  countries,
  provinces,
  selectedCountry,
  selectedProvince,
  onCountryChange,
  onProvinceChange,
  goodsInfo,
  onGoodsInfoChange,
  goodsItems,
  onItemsChange,
  accountType = "ca_nhan",
}) {
  const setField = (name, value) => onGoodsInfoChange({ target: { name, value, type: "text" } })
  const userCountry = getUserCountry()

  // NỘP HỘ THUẾ chỉ áp dụng cho tài khoản cá nhân / hộ kinh doanh (không có hóa đơn GTGT)
  const condition = getCondition(selectedType, selectedCategory, selectedCondition)
  const collectsTax = accountType !== "doanh_nghiep"
  const vatPercent = collectsTax ? condition?.vatPercent ?? 0 : 0
  const pitPercent = collectsTax ? condition?.pitPercent ?? 0 : 0

  const totalPlatformPercent = ["successFee", "eventPercentFee", "livestreamPercentFee", "advertisingPercent"].reduce((s, k) => s + toNumber(goodsInfo[k]), 0)
  const totalPlatformAmount = ["eventFee", "livestreamFee", "advertisingFee"].reduce((s, k) => s + toNumber(goodsInfo[k]), 0)
  const minDeposit = useMemo(() => minTrustDeposit(goodsItems), [goodsItems])

  // Giá trị mặc định của mẫu + lưu % thuế để gửi kèm bài đăng
  useEffect(() => {
    if (!goodsInfo.saleMode) setField("saleMode", SALE_MODES[0].value)
    if (goodsInfo.postDisplayFee === undefined) setField("postDisplayFee", String(POST_DISPLAY_FEE_DEFAULT.fee))
    if (goodsInfo.postDisplayDays === undefined) setField("postDisplayDays", String(POST_DISPLAY_FEE_DEFAULT.days))
    if (!goodsInfo.geographicScope) setField("geographicScope", "ALL")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setField("vatPercent", vatPercent)
    setField("pitPercent", pitPercent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vatPercent, pitPercent])

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`, { headers: { Accept: "application/json" } })
      const data = await res.json()
      return data?.display_name || `Vĩ độ: ${latitude}, Kinh độ: ${longitude}`
    } catch {
      return `Vĩ độ: ${latitude}, Kinh độ: ${longitude}`
    }
  }

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      setField("goodsLat", coords.latitude)
      setField("goodsLng", coords.longitude)
      setField("goodsAddress", await reverseGeocode(coords.latitude, coords.longitude))
    })
  }

  useEffect(() => {
    if (!goodsInfo.goodsAddress) fillCurrentLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTimePart = (part, max) => (e) => {
    const v = Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0))
    setField(part, String(v).padStart(2, "0"))
  }

  const provinceLabel = (provinces || []).find((p) => (p.en || p.vi) === selectedProvince)
  const scopeOptions = [{ label: "TẤT CẢ", value: "ALL" }, ...(provinces || []).filter((p) => !["All", "Tất cả"].includes(p.en)).map((p) => ({ label: p.vi || p.en, value: p.en || p.vi }))]

  return (
    <div className="grid grid-cols-1">
      {/* 1 - Bộ lọc (quốc gia/tỉnh đặt hàng hóa, đồng bộ với địa chỉ hàng hóa ở mục 6) */}
      <div className="grid grid-cols-30 border-gray-300">
        <RowNumberCell number={1} required className="col-span-1 border-b" />
        <div className="col-span-29">
          <CategoryRow
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            selectedCondition={selectedCondition}
            onTypeChange={onTypeChange}
            onCategoryChange={onCategoryChange}
            onConditionChange={onConditionChange}
            countries={countries}
            provinces={provinces}
            selectedCountry={selectedCountry}
            selectedProvince={selectedProvince}
            onCountryChange={onCountryChange}
            onProvinceChange={onProvinceChange}
          />
        </div>
      </div>

      {/* 2 - Bảng hàng hóa */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={2} required className="col-span-1" />
        <div className="col-span-29 min-w-0">
          <ScrapSaleProductGrid products={goodsItems} onItemsChange={onItemsChange} accountType={accountType} />
          <div className="flex items-center gap-2 p-2 border-t border-gray-300">
            <span className="text-red-500 font-bold">*</span>
            <Select value={goodsInfo.saleMode || SALE_MODES[0].value} onChange={(e) => setField("saleMode", e.target.value)} options={SALE_MODES} className="border border-gray-300 p-1 font-bold" />
          </div>
        </div>
      </div>

      {/* 3 - THỜI LƯỢNG DUYỆT GIÁ (hh:mm:ss) */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={3} required className="col-span-1 p-2" />
        <div className={labelCls}>THỜI LƯỢNG DUYỆT GIÁ</div>
        <div className="col-span-23 p-2 flex items-center gap-1">
          {[["priceReviewTimeHour", 99], ["priceReviewTimeMinute", 59], ["priceReviewTimeSecond", 59]].map(([name, max], idx) => (
            <React.Fragment key={name}>
              {idx > 0 && <span>:</span>}
              <input type="number" name={name} min="0" max={max} value={goodsInfo[name] || ""} onChange={setTimePart(name, max)} className="w-14 border border-gray-300 p-1 text-center" placeholder="00" />
            </React.Fragment>
          ))}
          <small className="text-gray-500 text-xs ml-1">(hh:mm:ss)</small>
        </div>
      </div>

      {/* 4 - THỜI GIAN XÁC MINH TRỰC TUYẾN */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={4} required className="col-span-1 p-2" />
        <div className={labelCls}>THỜI GIAN XÁC MINH TRỰC TUYẾN</div>
        <div className="col-span-23 p-2">
          <input type="datetime-local" step="1" name="onlineVerificationTime" value={goodsInfo.onlineVerificationTime || ""} onChange={onGoodsInfoChange} className="border border-gray-300 p-1" />
        </div>
      </div>

      {/* 5 - THỜI GIAN KHẢO SÁT THỰC TẾ */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={5} required className="col-span-1 p-2" />
        <div className={labelCls}>THỜI GIAN KHẢO SÁT THỰC TẾ</div>
        <div className="col-span-8 border-r border-gray-300 p-2 flex items-center">
          <input type="datetime-local" step="1" name="onsiteSurveyTime" value={goodsInfo.onsiteSurveyTime || ""} onChange={onGoodsInfoChange} className="border border-gray-300 p-1" />
        </div>
        <div className="col-span-15 p-2 text-xs text-gray-700 flex items-center">
          Trừ {SURVEY_HOLD_D.toLocaleString("vi-VN")} D từ tài khoản VÍ của thành viên đăng ký tham gia khảo sát và trả lại nếu được bên đăng bài xác nhận có đến khảo sát hàng hóa của bài đăng này.
        </div>
      </div>

      {/* 6 - ĐỊA CHỈ HÀNG HÓA */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={6} required className="col-span-1 p-2" />
        <div className={labelCls}>ĐỊA CHỈ HÀNG HÓA</div>
        <div className="col-span-9 border-r border-gray-300 p-2 flex flex-col gap-1">
          <textarea value={goodsInfo.goodsAddress || ""} onChange={(e) => setField("goodsAddress", e.target.value)} rows={3} className="w-full border border-gray-300 p-1 text-sm" />
          <small className="text-[10px] text-gray-500">(hiện vị trí địa chỉ lúc chụp hình hoặc quay phim, có thể chỉnh sửa)</small>
        </div>
        <div className="col-span-5 border-r border-gray-300 p-2 flex flex-col justify-center gap-1 text-center">
          <div className="font-bold">{selectedCountry || "—"}</div>
          <div className="font-bold">{provinceLabel ? provinceLabel.vi || provinceLabel.en : selectedProvince || "—"}</div>
          <small className="text-[10px] text-gray-500">(tự động theo bộ lọc mục 1, không được chỉnh sửa)</small>
        </div>
        <div className="col-span-9 p-2 flex flex-col items-center justify-center gap-1">
          {goodsInfo.goodsLat && goodsInfo.goodsLng ? (
            <iframe title="Google Maps" width="100%" height="110" loading="lazy" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${goodsInfo.goodsLat},${goodsInfo.goodsLng}&z=16&output=embed`} />
          ) : (
            <span>(MAP)</span>
          )}
          <button type="button" onClick={fillCurrentLocation} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">📍 Định vị</button>
        </div>
      </div>

      {/* 7 - PHẠM VI ĐỊA LÝ ÁP DỤNG */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={7} required className="col-span-1 p-2" />
        <div className={labelCls}>PHẠM VI ĐỊA LÝ ÁP DỤNG</div>
        <div className="col-span-8 border-r border-gray-300 p-2 flex flex-col justify-center">
          <div className="font-bold">{userCountry}</div>
          <small className="text-[10px] text-gray-500">(mặc định quốc gia đăng ký tài khoản, chỉ chọn khác khi đăng bài XUẤT - NHẬP KHẨU)</small>
        </div>
        <div className="col-span-15 p-2 flex items-center">
          <Select value={goodsInfo.geographicScope || "ALL"} onChange={(e) => setField("geographicScope", e.target.value)} options={scopeOptions} className="w-full max-w-80 border border-gray-300 p-1" />
        </div>
      </div>

      {/* 8 - THỜI GIAN KẾT THÚC BÀI ĐĂNG */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={8} required className="col-span-1 p-2" />
        <div className={labelCls}>THỜI GIAN KẾT THÚC BÀI ĐĂNG</div>
        <div className="col-span-23 p-2">
          <input type="datetime-local" step="1" name="endPostDate" value={goodsInfo.endPostDate || ""} onChange={onGoodsInfoChange} className="border border-gray-300 p-1" />
        </div>
      </div>

      {/* 9 - PHÍ HIỂN THỊ BÀI ĐĂNG */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={9} required className="col-span-1 p-2" />
        <div className={labelCls}>PHÍ HIỂN THỊ BÀI ĐĂNG</div>
        <div className="col-span-9 border-r border-gray-300 p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <NumberInput name="postDisplayFee" value={goodsInfo.postDisplayFee} onChange={onGoodsInfoChange} className="w-28 border border-gray-300 p-1 text-right" />
            <span className="font-bold">D /</span>
            <NumberInput name="postDisplayDays" value={goodsInfo.postDisplayDays} onChange={onGoodsInfoChange} className="w-14 border border-gray-300 p-1 text-right" />
            <span className="font-bold">NGÀY</span>
          </div>
          <ConvertedD value={goodsInfo.postDisplayFee} />
        </div>
        <div className="col-span-14 p-2 text-xs text-gray-700 flex items-center">
          (cài đặt {POST_DISPLAY_FEE_DEFAULT.fee.toLocaleString("vi-VN")} D / {POST_DISPLAY_FEE_DEFAULT.days} ngày), trừ ngay tài khoản VÍ của người đăng
        </div>
      </div>

      {/* 10 - PHÍ TIẾP THỊ LIÊN KẾT */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={10} required className="col-span-1 p-2" />
        <div className={labelCls}>PHÍ TIẾP THỊ LIÊN KẾT</div>
        <div className="col-span-23 p-2 flex items-center gap-1">
          <NumberInput name="affiliateFeePercent" value={goodsInfo.affiliateFeePercent} onChange={onGoodsInfoChange} step="any" className="w-24 border border-gray-300 p-1 text-right" placeholder="(nhập)" />
          <span>%</span>
        </div>
      </div>

      {/* 11 - NỘP HỘ THUẾ GTGT + TNCN */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={11} required className="col-span-1 p-2" />
        <div className="col-span-29">
          {[["NỘP HỘ THUẾ GTGT", vatPercent], ["NỘP HỘ THUẾ TNCN", pitPercent]].map(([label, percent], idx) => (
            <div key={label} className={`grid grid-cols-29 ${idx === 0 ? "border-b border-gray-300" : ""}`}>
              <div className={labelCls}>{label}</div>
              <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-end font-bold">{percent}%</div>
              <div className="col-span-20 p-2 text-xs text-gray-700 flex items-center">
                {collectsTax
                  ? "(đối với tài khoản cá nhân, hộ kinh doanh không có Hóa đơn GTGT, mà chỉ có Hóa đơn bán hàng do nền tảng cung cấp miễn phí)"
                  : "(tài khoản doanh nghiệp tự xuất Hóa đơn GTGT)"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12 - PHÍ NỀN TẢNG */}
      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={12} required className="col-span-1 p-2" />
        <div className="col-span-29">
          <div className="grid grid-cols-29 border-b border-gray-300">
            <div className={labelCls}>PHÍ THÀNH CÔNG</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center gap-1">
              <NumberInput name="successFee" value={goodsInfo.successFee} onChange={onGoodsInfoChange} step="any" className="w-full border border-gray-300 p-1 text-right" placeholder="(nhập)" />
              <span>%</span>
            </div>
          </div>

          <div className="grid grid-cols-29 border-b border-gray-300">
            <div className={labelCls}>PHÍ HIỂN THỊ TRÊN TRANG CHỦ</div>
            <PercentPlusD percentName="eventPercentFee" amountName="eventFee" goodsInfo={goodsInfo} onChange={onGoodsInfoChange} />
            <div className="col-span-14 p-2 flex items-center">
              <PerViewInput name="mainPageViewCount" goodsInfo={goodsInfo} onChange={onGoodsInfoChange} />
            </div>
          </div>

          <div className="grid grid-cols-29 border-b border-gray-300">
            <div className={labelCls}>PHÍ LIVESTREAM</div>
            <PercentPlusD percentName="livestreamPercentFee" amountName="livestreamFee" goodsInfo={goodsInfo} onChange={onGoodsInfoChange} />
            <div className="col-span-7 border-r border-gray-300 p-2 flex flex-col items-center justify-center text-center">
              <FileInput name="livestreamVideoFile" label={<span className="text-[11px] text-blue-600 underline">(Tải video livestream)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.livestreamVideoFile} />
            </div>
            <div className="col-span-7 p-2 flex flex-col items-center justify-center text-center">
              <FileInput name="livestreamCertFile" label={<span className="text-[11px] text-blue-600 underline">(Tải Giấy xác nhận nội dung quảng cáo)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.livestreamCertFile} />
            </div>
          </div>

          <div className="grid grid-cols-29 border-b border-gray-300">
            <div className={labelCls}>PHÍ QUẢNG CÁO</div>
            <PercentPlusD percentName="advertisingPercent" amountName="advertisingFee" goodsInfo={goodsInfo} onChange={onGoodsInfoChange} />
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
              <PerViewInput name="advertisingAmount" goodsInfo={goodsInfo} onChange={onGoodsInfoChange} />
            </div>
            <div className="col-span-4 border-r border-gray-300 p-2 flex flex-col items-center justify-center text-center">
              <FileInput name="advertisingVideoFile" label={<span className="text-[11px] text-blue-600 underline">(Tải video quảng cáo)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.advertisingVideoFile} />
            </div>
            <div className="col-span-4 p-2 flex flex-col items-center justify-center text-center">
              <FileInput name="advertisingCertFile" label={<span className="text-[11px] text-blue-600 underline">(Tải Giấy xác nhận nội dung quảng cáo)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.advertisingCertFile} />
            </div>
          </div>

          <div className="grid grid-cols-29">
            <div className={`${labelCls} font-bold text-red-600`}>TỔNG PHÍ NỀN TẢNG</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-end font-bold text-red-600">
              {Number.isInteger(totalPlatformPercent) ? totalPlatformPercent : totalPlatformPercent.toFixed(2)}%
            </div>
            <div className="col-span-1 border-r border-gray-300 flex items-center justify-center">+</div>
            <div className="col-span-5 border-r border-gray-300 p-2 flex flex-col justify-center items-end">
              <div className="font-bold text-red-600">{totalPlatformAmount.toLocaleString("vi-VN")} D</div>
              <ConvertedD value={totalPlatformAmount} />
            </div>
          </div>
        </div>
      </div>

      {/* Tick - Ủy thác cho Nền tảng làm đại lý */}
      <div className="border-b border-gray-300 p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            name="trustPlatform"
            checked={goodsInfo.trustPlatform || false}
            onChange={(e) => {
              onGoodsInfoChange(e)
              if (e.target.checked && !goodsInfo.trustDepositAmount) setField("trustDepositAmount", String(Math.ceil(minDeposit)))
            }}
            className="w-4 h-4 mt-1 flex-shrink-0"
          />
          <div className="text-justify text-sm space-y-2">
            <div>
              Tôi ủy thác cho Nền tảng làm đại lý trực tuyến trực tiếp đại diện để bán, mua hàng hóa, dịch vụ của bài đăng này với đơn giá
              <span className="font-bold"> theo bảng nhập (bằng giá tự động từ chối) </span>
              và tôi đồng ý KÝ QUỸ cho Nền tảng số tiền
              <span className="inline-flex items-center gap-1 mx-1 align-middle">
                <NumberInput name="trustDepositAmount" value={goodsInfo.trustDepositAmount} onChange={onGoodsInfoChange} className="w-32 border border-gray-300 p-1 text-right" placeholder="(nhập)" />
                <span className="font-bold">D</span>
              </span>
              <span className="text-xs text-gray-600">(tối thiểu {Math.ceil(minDeposit).toLocaleString("vi-VN")} D: lớn hơn 10% tổng giá trị bài đăng hoặc bằng tổng yêu cầu đặt cọc nếu nó lớn hơn 10%)</span>
              {" "}để cam kết đảm bảo thực hiện giao dịch này cũng như kiểm soát đúng chất lượng hàng hóa, dịch vụ như công bố, đồng thời cung cấp đầy đủ quy trình quản lý, báo cáo chất lượng và cho phép Nền tảng trực tiếp đến khảo sát, kiểm tra, kiểm soát chất lượng sản phẩm từ nguyên liệu, sản xuất, đóng gói, vận chuyển, bảo hành và sửa chữa đảm bảo quyền lợi người tiêu dùng.
            </div>
            <div>Tôi xin tự chịu hoàn toàn trách nhiệm trước pháp luật nếu chất lượng sản phẩm, dịch vụ không đúng như quy trình thực hiện, báo cáo chất lượng đã công bố.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

ScrapSaleFormRows.propTypes = {
  selectedType: PropTypes.string,
  selectedCategory: PropTypes.string,
  selectedCondition: PropTypes.string,
  onTypeChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  countries: PropTypes.array,
  provinces: PropTypes.array,
  selectedCountry: PropTypes.string,
  selectedProvince: PropTypes.string,
  onCountryChange: PropTypes.func.isRequired,
  onProvinceChange: PropTypes.func.isRequired,
  goodsInfo: PropTypes.object.isRequired,
  onGoodsInfoChange: PropTypes.func.isRequired,
  goodsItems: PropTypes.array.isRequired,
  onItemsChange: PropTypes.func.isRequired,
  accountType: PropTypes.string,
}
