"use client";
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import { FILTER_TREE, getSubCategoryList, getConditionList } from "../../constants/filterConstants"
import Select from "../atoms/Select"

export default function CategoryRow({ selectedType, 
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
 }) {
  const { t, i18n } = useTranslation()
  const isVi = (i18n.language || "vi").toLowerCase().startsWith("vi")

  // Danh mục -> phân loại -> tình trạng theo sheet "Bộ lọc"; giá trị lưu là `en`
  const label = (item) => (isVi ? item.vi : item.en)
  const categoryOptions = [{ label: t("goods.selectCategory"), value: "" }, ...FILTER_TREE.map((c) => ({ label: label(c), value: c.en }))]
  const subcategoryOptions = [{ label: t("goods.selectSubcategoryPlaceholder"), value: "" }, ...getSubCategoryList(selectedType).map((sc) => ({ label: label(sc), value: sc.en }))]
  const conditionOptions = [{ label: t("goods.selectConditionPlaceholder"), value: "" }, ...getConditionList(selectedType, selectedCategory).map((cd) => ({ label: label(cd), value: cd.en }))]

  const countryOptions = [{ label: t("goods.selectCountry"), value: "" }, ...(countries || []).map((c) => ({ label: c.vi || c.en, value: c.en || c.vi }))]
  const provinceOptions = [{ label: t("goods.selectProvince"), value: "" }, ...(provinces || []).map((p) => ({ label: p.vi || p.en, value: p.en || p.vi }))]
  
  return (
    <div className="grid grid-cols-4 border-b border-gray-300">
      <div className="p-2">
        <div className="text-center">
          <Select value={selectedType} onChange={onTypeChange} options={categoryOptions} className="w-full border border-gray-300 p-1" />
        </div>
      </div>
      <div className="p-2">
        <div className="text-center">
          <Select value={selectedCategory} onChange={onCategoryChange} options={subcategoryOptions} className="w-full border border-gray-300 p-1" disabled={!selectedType} />
        </div>
      </div>
      <div className="p-2">
        <div className="text-center">
          <Select value={selectedCondition} onChange={onConditionChange} options={conditionOptions} className="w-full border border-gray-300 p-1" disabled={!selectedCategory} />
        </div>
      </div>
      <div className="p-2">
        <div className="text-center">
          <Select value={selectedCountry} onChange={onCountryChange} options={countryOptions} className="w-full border border-gray-300 p-1 mb-2" />
        </div>
        <div className="text-center">
          <Select value={selectedProvince} onChange={onProvinceChange} options={provinceOptions} className="w-full border border-gray-300 p-1 mb-2" disabled={!selectedCountry} />
        </div>
      </div>
    </div>
  )
}

CategoryRow.propTypes = {
  selectedType: PropTypes.string,
  selectedCategory: PropTypes.string,
  selectedCondition: PropTypes.string,
  onTypeChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
}