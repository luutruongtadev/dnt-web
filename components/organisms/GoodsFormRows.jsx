"use client";
import React, { useEffect, useState, useMemo } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import RowNumberCell from "../atoms/RowNumberCell"
import CategoryRow from "../molecules/CategoryRow"
import LocationSelectors from "../molecules/LocationSelectors"
import NumberInput from "../atoms/NumberInput"
import TextInput from "../atoms/TextInput"
import TextArea from "../atoms/TextArea"
import Checkbox from "../atoms/Checkbox"
import FileInput from "../atoms/FileInput"
import ProductGrid from "../ProductGrid"
import TwoLineUnitInput from "../atoms/TwoLineUnitInput"
import Select from "../atoms/Select"
import { calculateTaxPercent, isTaxRequired } from "../../utils/taxCalculator"

export default function GoodsFormRows({
  selectedType,
  selectedCategory,
  selectedCondition,
  onTypeChange,
  onCategoryChange,
  onConditionChange,
  countries,
  provinces,
  districts,
  selectedCountry,
  selectedProvince,
  selectedDistrict,
  onCountryChange,
  onProvinceChange,
  onDistrictChange,
  goodsInfo,
  onGoodsInfoChange,
  goodsItems,
  onItemsChange,
  accountType = "ca_nhan", // Default: tài khoản cá nhân (can be passed from parent)
}) {
  const { t } = useTranslation()
  const [accountTypeState, setAccountTypeState] = useState(accountType)

  // Tính tax % tự động dựa trên loại tài khoản + loại giao dịch + phân loại
  const calculatedTaxPercent = useMemo(() => {
    return calculateTaxPercent(accountTypeState, selectedType, selectedCategory)
  }, [accountTypeState, selectedType, selectedCategory])

  // TỔNG PHÍ NỀN TẢNG = cộng tất cả phí ở trên (cột % và cột số tiền)
  const sumFields = (fields) => fields.reduce((acc, key) => acc + (parseFloat(goodsInfo[key]) || 0), 0)
  const totalPlatformPercent = useMemo(
    () => sumFields(["successFee", "eventPercentFee", "livestreamPercentFee", "advertisingPercent", "regLivestreamGoodsPercent", "regProductAdPercent", "regPersonalBrandPercent"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goodsInfo]
  )
  const totalPlatformAmount = useMemo(
    () => sumFields(["eventFee", "livestreamFee", "advertisingFee", "regLivestreamGoodsFee", "regProductAdFee", "regPersonalBrandFee"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goodsInfo]
  )

  // Reverse-geocode toạ độ -> địa chỉ dạng chữ bằng Nominatim (OpenStreetMap, free, ko cần key)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=vi`,
        { headers: { Accept: "application/json" } }
      )
      const data = await res.json()
      return data?.display_name || `Vĩ độ: ${latitude}, Kinh độ: ${longitude}`
    } catch {
      return `Vĩ độ: ${latitude}, Kinh độ: ${longitude}`
    }
  }

  const fillCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      // Lưu toạ độ để pin lên Google Maps
      onGoodsInfoChange({ target: { name: "goodsLat", value: latitude, type: "text" } })
      onGoodsInfoChange({ target: { name: "goodsLng", value: longitude, type: "text" } })
      const address = await reverseGeocode(latitude, longitude)
      onGoodsInfoChange({ target: { name: "goodsAddress", value: address, type: "text" } })
    })
  }

  // Tự động điền vị trí hiện tại của user vào ô địa chỉ khi mở form (nếu còn trống)
  useEffect(() => {
    if (goodsInfo.goodsAddress) return
    fillCurrentLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const countryOptions = (countries || []).map((c) => ({ label: c.vi || c.en, value: c.en || c.vi }))
  const provinceOptions = (provinces || []).map((p) => ({ label: p.vi || p.en, value: p.en || p.vi }))

  return (
    <div className="grid grid-cols-1">
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

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={2} required className="col-span-1" />
        <div className="col-span-29 min-w-0">
          <ProductGrid products={goodsItems} category={selectedType} onItemsChange={onItemsChange} />
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={3} required className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.priceReviewTime")}</div>
        </div>
        <div className="col-span-12 border-r border-gray-300 p-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              name="priceReviewTimeHour"
              value={goodsInfo.priceReviewTimeHour || ""}
              onChange={(e) => {
                const hour = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                onGoodsInfoChange({ target: { name: "priceReviewTimeHour", value: hour.toString().padStart(2, "0"), type: "text" } })
              }}
              min="0"
              max="23"
              className="w-12 border border-gray-300 p-1 text-center"
              placeholder="00"
            />
            <span>:</span>
            <input
              type="number"
              name="priceReviewTimeMinute"
              value={goodsInfo.priceReviewTimeMinute || ""}
              onChange={(e) => {
                const minute = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                onGoodsInfoChange({ target: { name: "priceReviewTimeMinute", value: minute.toString().padStart(2, "0"), type: "text" } })
              }}
              min="0"
              max="59"
              className="w-12 border border-gray-300 p-1 text-center"
              placeholder="00"
            />
          </div>
          <small className="text-gray-500 text-xs">(HH:mm)</small>
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={4} required className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.timeLive")}</div>
        </div>
        <div className="col-span-12 border-r border-gray-300 p-2">
          <input
            type="datetime-local"
            name="timeLive"
            value={goodsInfo.timeLive || ""}
            onChange={onGoodsInfoChange}
            className="max-w-80 border border-gray-300 p-1 text-right"
            placeholder={t("goods.enter")}
            style={{ border: "none" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={5} required className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.endPostTime")}</div>
        </div>
        <div className="col-span-12 border-r border-gray-300 p-2">
          <input
            type="datetime-local"
            name="endPostDate"
            value={goodsInfo.endPostDate || ""}
            onChange={onGoodsInfoChange}
            className="max-w-80 border border-gray-300 p-1 text-right"
            placeholder={t("goods.enter")}
            style={{ border: "none" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={6} required className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.goodsAddress")}</div>
        </div>
        <div className="col-span-10 border-r border-gray-300 p-2">
          <TextArea value={goodsInfo.goodsAddress} onChange={(e) => onGoodsInfoChange({ target: { name: "goodsAddress", value: e.target.value, type: "text" } })} className="w-full border-gray-300 p-1 text-left" />
        </div>
        <div className="col-span-2 border-r border-gray-300 p-2 text-center flex flex-col items-center justify-center gap-1">
          {goodsInfo.goodsLat && goodsInfo.goodsLng ? (
            <>
              <iframe
                title="Google Maps"
                width="100%"
                height="110"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${goodsInfo.goodsLat},${goodsInfo.goodsLng}&z=16&output=embed`}
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${goodsInfo.goodsLat},${goodsInfo.goodsLng}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-[10px] underline"
              >
                Mở Google Maps
              </a>
            </>
          ) : (
            <span>(MAP)</span>
          )}
          <button
            type="button"
            onClick={fillCurrentLocation}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
          >
            📍 {t("goods.locate", "Định vị")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={7} required className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.location")}</div>
        </div>
        <div className="col-span-12 border-r border-gray-300 p-2">
           <div className="flex items-center gap-2">
              <Select value={selectedCountry} onChange={onCountryChange} options={countryOptions} className="w-full border border-gray-300 p-1 mb-2" />
              <Select value={selectedProvince} onChange={onProvinceChange} options={[{ label: "Tất cả", value: "" }, ...provinceOptions]} className="w-full border border-gray-300 p-1 mb-2" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-30 border-b border-gray-300">
        <RowNumberCell number={8} className="col-span-1 p-2" />
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
          <div>{t("goods.taxGtgtAndPit", "NỘP HỘ THUẾ GTGT + TNCN")}</div>
        </div>
        <div className="col-span-6 border-r border-gray-300 p-2 flex items-center justify-end">
          <span className="font-medium">{calculatedTaxPercent}</span>
          <span className="ml-1 text-gray-700">%</span>
        </div>
        {isTaxRequired(accountTypeState) && calculatedTaxPercent > 0 && (
          <div className="col-span-17 border-r border-gray-300 p-2 flex items-center text-xs text-gray-500">
            <small>({accountTypeState === "ho_kinh_doanh" ? "Hộ kinh doanh" : "Cá nhân"})</small>
          </div>
        )}
      </div>

      <div id="row10" className="grid grid-cols-30 border-b border-gray-300">
        <div className="col-span-1 border-r border-t border-gray-300 p-2 text-center flex items-center justify-center">
          <span className="font-bold">10</span>
        </div>
        <div className="col-span-29">

          {/* PHÍ THÀNH CÔNG */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
              <div>{t("goods.successFee", "PHÍ THÀNH CÔNG")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="successFee" value={goodsInfo.successFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-16 p-2 flex items-center">
              <span className="text-red-500 font-bold ml-2">*</span>
            </div>
          </div>

          {/* PHÍ HIỂN THỊ TRÊN TRANG CHỦ */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
              <div>{t("goods.eventFee", "PHÍ HIỂN THỊ TRÊN TRANG CHỦ")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="eventPercentFee" value={goodsInfo.eventPercentFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="eventFee" value={goodsInfo.eventFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            <div className="col-span-7 border-r border-gray-300 p-2 flex items-center justify-center gap-2 min-w-0">
              <NumberInput name="mainPageViewCount" value={goodsInfo.mainPageViewCount} onChange={onGoodsInfoChange} className="flex-1 min-w-[50px] border border-gray-300 rounded p-1 text-center text-xs" placeholder={t("goods.enterNum", "(nhập số)")} />
              <div className="flex items-center gap-1 text-[10px] text-gray-600 shrink basis-[70px] whitespace-normal leading-none">
                <TwoLineUnitInput unitBottom="D" centerOnly={true} className="!text-[10px] !w-auto" />
                <span>/ GIẤY / LƯỢT XEM</span>
              </div>
            </div>
          </div>

          {/* PHÍ LIVESTREAM HÀNG HÓA */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
              <div>{t("goods.livestreamFee")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="livestreamPercentFee" value={goodsInfo.livestreamPercentFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="livestreamFee" value={goodsInfo.livestreamFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            {/* (Tải video) LIVESTREAM HÀNG HÓA */}
            <div className="col-span-4 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="livestreamVideoFile" label={<span className="text-black text-[11px]">(Tải video)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.livestreamVideoFile} />
              <div className="text-[11px] leading-tight font-bold text-black">LIVESTREAM HÀNG HÓA</div>
            </div>
            {/* (Tải lên) GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO */}
            <div className="col-span-3 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="livestreamCertFile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.livestreamCertFile} />
              <div className="text-[11px] leading-tight font-bold text-black">GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO</div>
            </div>
          </div>

          {/* PHÍ QUẢNG CÁO */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-center">
              <div className="uppercase">{t("goods.advertisingFee", "PHÍ QUẢNG CÁO")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="advertisingPercent" value={goodsInfo.advertisingPercent} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="advertisingFee" value={goodsInfo.advertisingFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            {/* Nhập số D / GIẤY / LƯỢT XEM */}
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center gap-1 min-w-0">
              <NumberInput name="advertisingAmount" value={goodsInfo.advertisingAmount} onChange={onGoodsInfoChange} className="flex-1 min-w-[40px] border border-gray-300 rounded p-1 text-center text-xs" placeholder={t("goods.enterNum", "(nhập số)")} />
              <div className="flex items-center gap-1 text-[10px] text-gray-600 shrink basis-[55px] whitespace-normal leading-none">
                <TwoLineUnitInput unitBottom="D" centerOnly={true} className="!text-[10px] !w-auto" />
                <span>/ GIẤY / LƯỢT XEM</span>
              </div>
            </div>
            {/* (Tải video) QUẢNG CÁO */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="advertisingVideoFile" label={<span className="text-black text-[11px]">(Tải video)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.advertisingVideoFile} />
              <div className="text-[11px] leading-tight font-bold text-black">QUẢNG CÁO</div>
            </div>
            {/* (Tải lên) GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="advertisingCertFile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.advertisingCertFile} />
              <div className="text-[11px] leading-tight font-bold text-black">GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO</div>
            </div>
          </div>

          {/* ĐĂNG KÝ LÀM VIDEO — 3 rows, each with its own right-side columns */}
          {/* Row 1: LIVESTREAM HÀNG HÓA */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-start gap-2">
              <Checkbox name="regLivestreamGoods" checked={goodsInfo.regLivestreamGoods} onChange={onGoodsInfoChange} className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="leading-tight font-medium">
                <span>ĐĂNG KÝ LÀM VIDEO</span>
                <br />
                <span className="text-red-600 font-bold">LIVESTREAM HÀNG HÓA</span>
              </div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regLivestreamGoodsPercent" value={goodsInfo.regLivestreamGoodsPercent} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regLivestreamGoodsFee" value={goodsInfo.regLivestreamGoodsFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            {/* AI / Người thực */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col gap-1 justify-center">
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regLivestreamGoodsAI" checked={goodsInfo.regLivestreamGoodsAI || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>AI</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regLivestreamGoodsPerson" checked={goodsInfo.regLivestreamGoodsPerson || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>Người thực</span>
              </label>
            </div>
            {/* (Tải lên) HỒ SƠ ĐẦY ĐỦ CỦA SẢN PHẨM */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regLivestreamProductProfile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regLivestreamProductProfile} />
              <div className="text-[11px] leading-tight font-bold text-black">HỒ SƠ ĐẦY ĐỦ CỦA SẢN PHẨM</div>
            </div>
            {/* (Tải lên) GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO */}
            <div className="col-span-3 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regLivestreamCertFile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regLivestreamCertFile} />
              <div className="text-[11px] leading-tight font-bold text-black">GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO</div>
            </div>
          </div>

          {/* Row 2: QUẢNG CÁO SẢN PHẨM */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-start gap-2">
              <Checkbox name="regProductAdVideo" checked={goodsInfo.regProductAdVideo} onChange={onGoodsInfoChange} className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="leading-tight font-medium">
                <span>ĐĂNG KÝ LÀM VIDEO</span>
                <br />
                <span className="text-red-600 font-bold">QUẢNG CÁO SẢN PHẨM</span>
              </div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regProductAdPercent" value={goodsInfo.regProductAdPercent} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regProductAdFee" value={goodsInfo.regProductAdFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            {/* AI / Người thực */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col gap-1 justify-center">
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regProductAdAI" checked={goodsInfo.regProductAdAI || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>AI</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regProductAdPerson" checked={goodsInfo.regProductAdPerson || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>Người thực</span>
              </label>
            </div>
            {/* (Tải lên) HỒ SƠ ĐẦY ĐỦ NGƯỜI ĐĂNG BÀI */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regProductAdCompanyProfile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regProductAdCompanyProfile} />
              <div className="text-[11px] leading-tight font-bold text-black">HỒ SƠ ĐẦY ĐỦ NGƯỜI ĐĂNG BÀI</div>
            </div>
            {/* (Tải lên) GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO + Nền tảng hỗ trợ */}
            <div className="col-span-3 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regProductAdCertFile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regProductAdCertFile} />
              <div className="text-[11px] leading-tight font-bold text-black">GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO</div>
              <label className="flex items-center gap-1 text-[10px] cursor-pointer mt-1">
                <input type="checkbox" name="regProductAdPlatformSupport" checked={goodsInfo.regProductAdPlatformSupport || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>Nền tảng hỗ trợ</span>
              </label>
            </div>
          </div>

          {/* Row 3: THƯƠNG HIỆU BẢN THÂN */}
          <div className="grid grid-cols-24 border-b border-gray-300">
            <div className="col-span-6 border-r border-gray-300 p-2 flex items-start gap-2">
              <Checkbox name="regPersonalBrandVideo" checked={goodsInfo.regPersonalBrandVideo} onChange={onGoodsInfoChange} className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="leading-tight font-medium">
                <span>ĐĂNG KÝ LÀM VIDEO</span>
                <br />
                <span className="text-red-600 font-bold">THƯƠNG HIỆU BẢN THÂN</span>
              </div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regPersonalBrandPercent" value={goodsInfo.regPersonalBrandPercent} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
              <span className="text-gray-700">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center">
              <NumberInput name="regPersonalBrandFee" value={goodsInfo.regPersonalBrandFee} onChange={onGoodsInfoChange} className="w-full border-gray-300 p-1 text-right" placeholder={t("goods.enter")} />
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            {/* AI / Người thực */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col gap-1 justify-center">
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regPersonalBrandAI" checked={goodsInfo.regPersonalBrandAI || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>AI</span>
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer font-medium">
                <input type="checkbox" name="regPersonalBrandPerson" checked={goodsInfo.regPersonalBrandPerson || false} onChange={onGoodsInfoChange} className="w-3 h-3" />
                <span>Người thực</span>
              </label>
            </div>
            {/* (Tải lên) HỒ SƠ ĐẦY ĐỦ CỦA SẢN PHẨM */}
            <div className="col-span-2 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regPersonalBrandProductProfile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regPersonalBrandProductProfile} />
              <div className="text-[11px] leading-tight font-bold text-black">HỒ SƠ ĐẦY ĐỦ CỦA SẢN PHẨM</div>
            </div>
            {/* (Tải lên) GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO */}
            <div className="col-span-3 border-r border-gray-300 p-2 flex flex-col items-center justify-center gap-1 text-center">
              <FileInput name="regPersonalBrandCertFile" label={<span className="text-black text-[11px]">(Tải lên)</span>} onChange={onGoodsInfoChange} selectedFile={goodsInfo.regPersonalBrandCertFile} />
              <div className="text-[11px] leading-tight font-bold text-black">GIẤY XÁC NHẬN NỘI DUNG QUẢNG CÁO</div>
            </div>
          </div>

          {/* TỔNG PHÍ NỀN TẢNG */}
          <div className="grid grid-cols-24">
            <div className="col-span-6 border-r border-gray-300 p-2 flex flex-col justify-center">
              <div className="font-bold text-red-600">{t("goods.totalPlatformFee", "TỔNG PHÍ NỀN TẢNG")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-end">
              <span className="font-bold text-red-600">{Number.isInteger(totalPlatformPercent) ? totalPlatformPercent : totalPlatformPercent.toFixed(2)}</span>
              <span className="ml-1 text-red-600">%</span>
            </div>
            <div className="col-span-1 border-r border-gray-300 px-0 py-2 flex items-center justify-center">+</div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-end">
              <div className="w-full p-1 text-right font-bold text-red-600">{totalPlatformAmount.toLocaleString("vi-VN")}</div>
            </div>
            <div className="col-span-2 border-r border-gray-300 p-2 flex items-center justify-center">
              <TwoLineUnitInput centerOnly={true} />
            </div>
            <div className="col-span-3 border-r border-gray-300 p-2 flex items-center justify-center"><span>{t("goods.prepay")}</span></div>
            <div className="col-span-7 border-r border-gray-300 p-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

GoodsFormRows.propTypes = {
  selectedType: PropTypes.string,
  selectedCategory: PropTypes.string,
  selectedCondition: PropTypes.string,
  onTypeChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  countries: PropTypes.array,
  provinces: PropTypes.array,
  districts: PropTypes.array,
  selectedCountry: PropTypes.string,
  selectedProvince: PropTypes.string,
  selectedDistrict: PropTypes.string,
  onCountryChange: PropTypes.func.isRequired,
  onProvinceChange: PropTypes.func.isRequired,
  onDistrictChange: PropTypes.func.isRequired,
  goodsInfo: PropTypes.object.isRequired,
  onGoodsInfoChange: PropTypes.func.isRequired,
  goodsItems: PropTypes.array.isRequired,
}
