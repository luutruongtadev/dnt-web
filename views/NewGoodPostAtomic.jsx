"use client";
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import "../styles/Login.css"
import { useNavigate } from '@/lib/router-compat'
import { Home as HomeIcon, KeyboardIcon as KeyboardIcon } from "lucide-react"
import { createProduct } from "../services/productService"
import PostTypeMenu from "../components/PostTypeMenu"
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx"
import GoodsAccount from "../components/GoodsAccount.jsx"
import AppPageLayout from "../components/layouts/AppPageLayout.jsx"
import GoodsFormRows from "../components/organisms/GoodsFormRows.jsx"
import AdvertisingSection from "../components/organisms/AdvertisingSection.jsx"
import usePersistentColor from "../hooks/usePersistentColor.js"
import useLocationSelection from "../hooks/useLocationSelection.js"
import useGoodsForm from "../hooks/useGoodsForm.js"

export default function NewGoodPostAtomic() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { color, onColorChange } = usePersistentColor()
  const [selectedType, setSelectedType] = useState(localStorage.getItem("category") || "")
  const [selectedCategory, setSelectedCategory] = useState(localStorage.getItem("subcategory") || "")
  const [selectedCondition, setSelectedCondition] = useState(localStorage.getItem("condition") || "")
  const { countries, provinces, districts, selectedCountry, selectedProvince, selectedDistrict, handleCountryChange, handleProvinceChange, handleDistrictChange } = useLocationSelection()
  const { goodsItems, goodsInfo, setGoodsInfo, handleInputChange } = useGoodsForm()
  const [errorMessage, setErrorMessage] = useState("")

  const onGoodsInfoChange = (e) => {
    handleInputChange(e)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formattedData = {
      ...goodsInfo,
      price: goodsInfo.price ? parseFloat(goodsInfo.price) : 0,
      askingPrice: goodsInfo.askingPrice ? parseFloat(goodsInfo.askingPrice) : 0,
      estimatedValue: goodsInfo.estimatedValue ? parseFloat(goodsInfo.estimatedValue) : 0,
      autoAcceptPrice: goodsInfo.autoAcceptPrice ? parseFloat(goodsInfo.autoAcceptPrice) : 0,
      marketPrice: goodsInfo.marketPrice ? parseFloat(goodsInfo.marketPrice) : 0,
      lowestUnitAskingPrice: goodsInfo.lowestUnitAskingPrice ? parseFloat(goodsInfo.lowestUnitAskingPrice) : 0,
      highestUnitAskingPrice: goodsInfo.highestUnitAskingPrice ? parseFloat(goodsInfo.highestUnitAskingPrice) : 0,
      deliveryDays: goodsInfo.deliveryDays ? parseInt(goodsInfo.deliveryDays) : 0,
      lowestAmount: goodsInfo.lowestAmount ? parseInt(goodsInfo.lowestAmount) : 0,
      highestAmount: goodsInfo.highestAmount ? parseInt(goodsInfo.highestAmount) : 0,
      lowestAutoAcceptPrice: goodsInfo.lowestAutoAcceptPrice ? parseFloat(goodsInfo.lowestAutoAcceptPrice) : 0,
      highestAutoAcceptPrice: goodsInfo.highestAutoAcceptPrice ? parseFloat(goodsInfo.highestAutoAcceptPrice) : 0,
      contractDuration: goodsInfo.contractDuration ? parseInt(goodsInfo.contractDuration) : 0,
      eventFeePercentage: goodsInfo.eventFeePercentage ? parseFloat(goodsInfo.eventFeePercentage) : 0,
      livestreamFee: goodsInfo.livestreamFee ? parseFloat(goodsInfo.livestreamFee) : 0,
      advertisingAmount: goodsInfo.advertisingAmount ? parseFloat(goodsInfo.advertisingAmount) : 0,
      successFee: goodsInfo.successFee ? parseFloat(goodsInfo.successFee) : 0,
      totalFees: goodsInfo.totalFees ? parseFloat(goodsInfo.totalFees) : 0,
      image: "https://example.com/image.jpg",
      qualityFiles: ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"],
      advertisingUrl: "https://example.com/advertising",
    }
    createProduct("token", formattedData)
      .then((res) => {
        console.log(res.data)
        alert("Create success " + goodsInfo.name)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  return (
    <AppPageLayout>
      <PageHeaderWithOutColorPicker
        color={color}
        onColorChange={onColorChange}
        titlePrefix="4"
        leftButton={<button className="text-red-600 hover:text-red-800 relative" onClick={() => navigate("/")}><HomeIcon size={28} /></button>}
        rightButton={<button className="text-red-600 hover:text-red-800" onClick={() => navigate("/admin-control")}><KeyboardIcon size={28} /></button>}
        title={t("goods.newPost")}
      />
      <div className="mt-1">
        <form onSubmit={handleSubmit} className=" border-gray-300">
          <PostTypeMenu activeType="goods" />
          <GoodsAccount title={t("goods.accountOfGoods")} onTransfer={() => {}} />
          <GoodsFormRows
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            selectedCondition={selectedCondition}
            onTypeChange={(e) => setSelectedType(e.target.value)}
            onCategoryChange={(e) => setSelectedCategory(e.target.value)}
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
          />
          <AdvertisingSection goodsInfo={goodsInfo} onGoodsInfoChange={onGoodsInfoChange} />
          <div className="border-t border-gray-300 p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" name="agreeTerms" checked={goodsInfo.agreeTerms || false} onChange={onGoodsInfoChange} className="w-4 h-4 mt-1 flex-shrink-0" required />
              <div className="text-justify text-sm">
                <div className="mb-2">{t("goods.termsAgreement")}</div>
              </div>
            </div>
          </div>
           <div className="text-center p-4 border-t border-gray-300">
            <button type="submit" className="bg-gray-300 hover:bg-gray-100 text-black font-bold py-2 px-6 border border-gray-200">{t("goods.saveDraff")}</button>
          </div>
          <div className="text-center p-4 border-t border-gray-300">
            <button type="submit" className="bg-gray-300 hover:bg-gray-100 text-black font-bold py-2 px-6 border border-gray-200">{t("goods.sendRequirement")}</button>
          </div>
        </form>
      </div>
    </AppPageLayout>
  )
}