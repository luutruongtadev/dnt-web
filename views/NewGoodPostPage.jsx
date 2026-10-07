"use client";
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import "../styles/Login.css"
import { useNavigate } from '@/lib/router-compat'
import { createProduct } from "../services/productService"
import PostTypeMenu from "../components/PostTypeMenu"
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx"
import AppPageLayout from "../components/layouts/AppPageLayout.jsx"
import GoodsFormRows from "../components/organisms/GoodsFormRows.jsx"
import ScrapSaleFormRows from "../components/organisms/ScrapSaleFormRows.jsx"
import { SCRAP_DURATION, emptyScrapItem, estimatedTotal, invoiceTypeForAccount, minTrustDeposit, remainingPayment } from "../utils/scrapSalePost.js"
import { getConditionList, getSubCategoryList, isSaleGoodsScrap } from "../constants/filterConstants.js"
import { toNumber } from "../utils/currency.js"
import usePersistentColor from "../hooks/usePersistentColor.js"
import useLocationSelection from "../hooks/useLocationSelection.js"
import useGoodsForm from "../hooks/useGoodsForm.js"
import { buildGoodsDraft, deleteGoodsDraft, loadGoodsDraft, saveGoodsDraft } from "../utils/goodsDraft.js"

export default function NewGoodPostPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { color, onColorChange } = usePersistentColor()
  const [selectedType, setSelectedType] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCondition, setSelectedCondition] = useState("")
  const { countries, provinces, districts, selectedCountry, selectedProvince, selectedDistrict, handleCountryChange, handleProvinceChange, handleDistrictChange, setLocationSelection } = useLocationSelection()
  const { goodsItems, goodsInfo, setGoodsInfo, handleInputChange, formatPriceReviewTime, handleItemsChange } = useGoodsForm()
  const [errorMessage, setErrorMessage] = useState("")
  const [draftMessage, setDraftMessage] = useState("")
  const isScrapSale = isSaleGoodsScrap(selectedType, selectedCategory, selectedCondition)
  const accountType = (() => {
    try {
      return localStorage.getItem("account_type") || JSON.parse(localStorage.getItem("user") || "{}")?.account_type || "ca_nhan"
    } catch {
      return "ca_nhan"
    }
  })()

  // Bộ lọc phụ thuộc: đổi danh mục/phân loại thì bỏ chọn cấp dưới nếu không còn hợp lệ
  const handleTypeChange = (e) => {
    const type = e.target.value
    setSelectedType(type)
    if (!getSubCategoryList(type).some((sc) => sc.en === selectedCategory)) {
      setSelectedCategory("")
      setSelectedCondition("")
    } else if (!getConditionList(type, selectedCategory).some((cd) => cd.en === selectedCondition)) {
      setSelectedCondition("")
    }
  }

  const handleCategoryChange = (e) => {
    const category = e.target.value
    setSelectedCategory(category)
    if (!getConditionList(selectedType, category).some((cd) => cd.en === selectedCondition)) {
      setSelectedCondition("")
    }
  }

  // Mẫu PHẾ LIỆU dùng bảng hàng hóa riêng: đổi mẫu thì làm mới các dòng chưa nhập gì
  const isScrapItem = (item) => "quantityEstimated" in item
  useEffect(() => {
    const blank = goodsItems.length === 1 && !goodsItems[0].name
    if (isScrapSale && !goodsItems.every(isScrapItem) && blank) {
      handleItemsChange([{ ...emptyScrapItem(1), invoiceType: invoiceTypeForAccount(accountType) }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrapSale])

  const scrapItemsPayload = () =>
    goodsItems.map((item) => ({
      ...item,
      contractDurationMultiplicity: item.contractDurationMultiplicity || SCRAP_DURATION.ONE_TIME,
      handoverLocation: "Kho người bán",
      invoiceType: invoiceTypeForAccount(accountType),
      totalEstimated: item.contractDurationMultiplicity === SCRAP_DURATION.ONE_YEAR ? "" : estimatedTotal(item),
      remainingPayment: item.contractDurationMultiplicity === SCRAP_DURATION.ONE_YEAR ? "" : remainingPayment(item),
    }))

  // Kiểm tra các trường bắt buộc (*) của mẫu HÀNG BÁN - HÀNG HÓA - PHẾ LIỆU
  const validateScrapPost = () => {
    const missing = []
    goodsItems.forEach((item, idx) => {
      const yearly = item.contractDurationMultiplicity === SCRAP_DURATION.ONE_YEAR
      const row = `dòng ${idx + 1}`
      if (!item.name) missing.push(`(1) Tên phế liệu - ${row}`)
      if (!item.image) missing.push(`(6) Hình ảnh - ${row}`)
      if (!item.videoFile) missing.push(`(7) Quay phim - ${row}`)
      if (!item.qualityInfoText && !item.qualityInfoFile) missing.push(`(8) Chất lượng, thông tin hàng hóa - ${row}`)
      if (!item.maxDeliveryDaysAfterAcceptance) missing.push(`Thời gian giao nhận hàng - ${row}`)
      if (yearly ? !item.quantityStock || !item.quantityMonthly : !item.quantityEstimated) missing.push(`Số lượng - ${row}`)
      if (!item.unit) missing.push(`Đơn vị tính - ${row}`)
      if (!item.unitAskingPrice) missing.push(`Đơn giá mong muốn - ${row}`)
      if (item.depositRequirement === "" || item.depositRequirement === undefined) missing.push(`Yêu cầu đặt cọc, ký quỹ - ${row}`)
    })
    if (!goodsInfo.priceReviewTimeHour && !goodsInfo.priceReviewTimeMinute && !goodsInfo.priceReviewTimeSecond) missing.push("(3) Thời lượng duyệt giá")
    if (!goodsInfo.onlineVerificationTime) missing.push("(4) Thời gian xác minh trực tuyến")
    if (!goodsInfo.onsiteSurveyTime) missing.push("(5) Thời gian khảo sát thực tế")
    if (!goodsInfo.goodsAddress) missing.push("(6) Địa chỉ hàng hóa")
    if (!goodsInfo.endPostDate) missing.push("(8) Thời gian kết thúc bài đăng")
    if (!goodsInfo.postDisplayFee || !goodsInfo.postDisplayDays) missing.push("(9) Phí hiển thị bài đăng")
    if (goodsInfo.affiliateFeePercent === undefined || goodsInfo.affiliateFeePercent === "") missing.push("(10) Phí tiếp thị liên kết")
    if (goodsInfo.successFee === undefined || goodsInfo.successFee === "") missing.push("(12) Phí thành công")
    if (missing.length) return `Vui lòng nhập: ${missing.join(", ")}`
    if (goodsInfo.trustPlatform && toNumber(goodsInfo.trustDepositAmount) < minTrustDeposit(goodsItems)) {
      return `Số tiền ký quỹ ủy thác tối thiểu là ${Math.ceil(minTrustDeposit(goodsItems)).toLocaleString("vi-VN")} D`
    }
    if (!goodsInfo.agreeTerms) return "Vui lòng tick cam kết thông tin đăng tải."
    return ""
  }

  useEffect(() => {
    let mounted = true
    const loadDraft = async () => {
      try {
        const draft = await loadGoodsDraft()
        if (!draft || !mounted) return
        setSelectedType(draft.selectedType || "")
        setSelectedCategory(draft.selectedCategory || "")
        setSelectedCondition(draft.selectedCondition || "")
        setGoodsInfo(draft.goodsInfo || {})
        handleItemsChange(draft.goodsItems?.length ? draft.goodsItems : goodsItems)
        await setLocationSelection({
          country: draft.selectedCountry || "",
          province: draft.selectedProvince || "",
          district: draft.selectedDistrict || "",
        })
        if (mounted) {
          setDraftMessage("Đã tải bản nháp vào form.")
        }
      } catch (err) {
        console.error("Cannot load goods draft:", err)
        deleteGoodsDraft().catch((deleteErr) => console.error("Cannot delete invalid goods draft:", deleteErr))
      }
    }

    loadDraft()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onGoodsInfoChange = (e) => {
    handleInputChange(e)
  }

  const buildPayload = (status) => ({
    ...goodsInfo,
    status,
    listingType: selectedType,
    categoryType: selectedCategory,
    conditionType: selectedCondition,
    nation: selectedCountry,
    province: selectedProvince,
    address: selectedDistrict,
    priceReviewTime: formatPriceReviewTime(),
    items: isScrapSale ? scrapItemsPayload() : goodsItems,
  })

  const submitForm = async (status) => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      setErrorMessage("Bạn cần đăng nhập để đăng hàng hóa.")
      return
    }
    if (isScrapSale) {
      const error = validateScrapPost()
      if (error) {
        setErrorMessage(error)
        return
      }
    }
    try {
      const res = await createProduct(token, buildPayload(status))
      console.log("Created product:", res.data)
      await deleteGoodsDraft()
      navigate("/")
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || "Tạo hàng hóa thất bại")
    }
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    setErrorMessage("")
    setDraftMessage("")
    buildGoodsDraft({
      selectedType,
      selectedCategory,
      selectedCondition,
      selectedCountry,
      selectedProvince,
      selectedDistrict,
      goodsInfo,
      goodsItems,
    })
      .then((draft) => {
        return saveGoodsDraft(draft)
      })
      .then(() => {
        setDraftMessage("Đã lưu bản nháp trên thiết bị này.")
      })
      .catch((err) => {
        console.error("Cannot save goods draft:", err)
        setErrorMessage("Lưu bản nháp thất bại. Vui lòng thử lại.")
      })
  }

  const handleSendRequest = (e) => {
    e.preventDefault()
    submitForm("pending")
  }

  return (
    <AppPageLayout>
      <PageHeaderWithOutColorPicker
        color={color}
        onColorChange={onColorChange}
        titlePrefix="4"
        title={t("goods.newPost")}
      />
      <div className="mt-1">
        <form className="border-gray-300">
          <PostTypeMenu activeType="goods" />
          {isScrapSale ? (
            <ScrapSaleFormRows
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              selectedCondition={selectedCondition}
              onTypeChange={handleTypeChange}
              onCategoryChange={handleCategoryChange}
              onConditionChange={(e) => setSelectedCondition(e.target.value)}
              countries={countries}
              provinces={provinces}
              selectedCountry={selectedCountry}
              selectedProvince={selectedProvince}
              onCountryChange={handleCountryChange}
              onProvinceChange={(e) => {
                handleProvinceChange(e)
                setGoodsInfo((prev) => ({ ...prev, province: e.target.value }))
              }}
              goodsInfo={goodsInfo}
              onGoodsInfoChange={onGoodsInfoChange}
              goodsItems={goodsItems}
              onItemsChange={handleItemsChange}
              accountType={accountType}
            />
          ) : (
            <GoodsFormRows
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              selectedCondition={selectedCondition}
              onTypeChange={handleTypeChange}
              onCategoryChange={handleCategoryChange}
              onConditionChange={(e) => setSelectedCondition(e.target.value)}
              countries={countries}
              provinces={provinces}
              districts={districts}
              selectedCountry={selectedCountry}
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              onCountryChange={handleCountryChange}
              onProvinceChange={(e) => {
                handleProvinceChange(e)
                setGoodsInfo((prev) => ({ ...prev, province: e.target.value }))
              }}
              onDistrictChange={(e) => {
                handleDistrictChange(e)
                setGoodsInfo((prev) => ({ ...prev, address: e.target.value }))
              }}
              goodsInfo={goodsInfo}
              onGoodsInfoChange={onGoodsInfoChange}
              goodsItems={goodsItems}
              onItemsChange={handleItemsChange}
            />
          )}
          {/* <AdvertisingSection goodsInfo={goodsInfo} onGoodsInfoChange={onGoodsInfoChange} /> */}
          <div className="border-t border-gray-300 p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" name="agreeTerms" checked={goodsInfo.agreeTerms || false} onChange={onGoodsInfoChange} className="w-4 h-4 mt-1 flex-shrink-0" required />
              <div className="text-justify text-sm">
                <div className="mb-2 whitespace-pre-line">{t("goods.termsAgreement")}</div>
              </div>
            </div>
          </div>
          {draftMessage && <div className="text-green-600 text-sm text-center px-4 pb-2">{draftMessage}</div>}
          {errorMessage && <div className="text-red-500 text-sm text-center px-4 pb-2">{errorMessage}</div>}
          <div className="flex justify-center gap-4 p-4 border-t border-gray-300">
            <button type="button" onClick={handleSaveDraft} className="bg-gray-300 hover:bg-gray-100 text-black font-bold py-2 px-6 border border-gray-200">{t("goods.saveDraff")}</button>
            <button type="button" onClick={handleSendRequest} className="bg-gray-300 hover:bg-gray-100 text-black font-bold py-2 px-6 border border-gray-200">{t("goods.sendRequirement")}</button>
          </div>
        </form>
      </div>
    </AppPageLayout>
  )
}
