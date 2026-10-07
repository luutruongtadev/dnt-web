"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import { useDispatch, useSelector } from 'react-redux';
import { getMetric } from '../services/metricService';
import { CHANGE_USER_COUNTRY } from '../context/action/filterAction';
import { getCountries, getCountryByCode, getDistrictByCode } from '../services/countries';
import { getVietnamProvinces } from '../services/vietnamInfoService';

// For Vietnam: load provinces from cached vietnam-info; fall back to external API for all other countries.
const getProvincesByCountry = async (countryName) => {
  if (countryName === "Vietnam") return getVietnamProvinces();
  return getCountryByCode(countryName);
};
import { useTranslation } from 'react-i18next';
import {
    KeyboardIcon as KeyboardIcon,
} from "lucide-react";
import { SearchSection } from './Body';
import CategorySelect from './CategorySelect';
import { categories, getSubCategoryList, getConditionList, SUBCATEGORY_PLACEHOLDER, CONDITION_PLACEHOLDER } from '../constants/filterConstants';

function EventFilterComponent() {
    const [category, setCategory] = useState({
        vi: "HÀNG BÁN",
        en: "SALE",
    });
    const [subcategory, setSubcategory] = useState({
        vi: "HÀNG HÓA",
        en: "GOODS",
    });
    const [condition, setCondition] = useState({
        vi: "PHẾ LIỆU",
        en: "SCRAP",
    });
    const [nation, setNation] = useState({
        vi: "Viet Nam",
        en: "Vietnam"
    });
    const [province, setProvince] = useState({
        vi: "Tất cả",
        en: "all",
    });
    const [district, setDistrict] = useState({
        vi: "Tất cả",
        en: "all",
    });
    const dispatch = useDispatch();

    useEffect(() => {
        localStorage.setItem("category", category?.en);
        localStorage.setItem("subcategory", subcategory?.en);
        localStorage.setItem("condition", condition?.en);
        localStorage.setItem("nation", nation?.en);
        localStorage.setItem("province", province?.en);
        localStorage.setItem("district", district?.en);
        dispatch({ type: CHANGE_USER_COUNTRY, payload: nation?.en });
    }, [category, subcategory, condition, nation, province, district]);

    // Phân loại phụ thuộc danh mục, tình trạng phụ thuộc phân loại (sheet "Bộ lọc")
    const subCategoryItems = useMemo(
        () => [SUBCATEGORY_PLACEHOLDER, ...getSubCategoryList(category?.en)],
        [category?.en]
    );
    const conditionItems = useMemo(
        () => [CONDITION_PLACEHOLDER, ...getConditionList(category?.en, subcategory?.en)],
        [category?.en, subcategory?.en]
    );

    const handleCategoryChange = (title, item) => {
        switch (title) {
            case "DANH MỤC": {
                setCategory(item);
                // Đổi danh mục: giữ phân loại/tình trạng nếu vẫn tồn tại, nếu không thì về chọn đầu tiên
                const subs = getSubCategoryList(item?.en);
                const nextSub = subs.find((s) => s.en === subcategory?.en) || subs[0] || SUBCATEGORY_PLACEHOLDER;
                setSubcategory(nextSub);
                const conds = getConditionList(item?.en, nextSub?.en);
                setCondition(conds.find((c) => c.en === condition?.en) || conds[0] || CONDITION_PLACEHOLDER);
                break;
            }
            case "Subcategories": {
                setSubcategory(item);
                const conds = getConditionList(category?.en, item?.en);
                setCondition(conds.find((c) => c.en === condition?.en) || conds[0] || CONDITION_PLACEHOLDER);
                break;
            }
            case "Conditions":
                setCondition(item);
                break;
            case "Nation":
                setNation(item);
                break;
            case "Province":
                setProvince(item);
                break;
            case "District":
                setDistrict(item);
                break;
            default:
                break;
        }
    };

    return (
        <>
            <div className="filter-container" style={{
                display: 'flex',
                flexDirection: 'row',
                width: "100%",
                marginTop: "8vh",
                alignItems: "self-start",
                gap: "10px"
            }}>
                <CategorySelect
                    title="DANH MỤC"
                    items={categories}
                    onChange={handleCategoryChange}
                    value={category}
                    placeholder={{ vi: "Chọn danh mục", en: "Select category" }}
                />
                <CategorySelect
                    title="Subcategories"
                    items={subCategoryItems}
                    onChange={handleCategoryChange}
                    value={subcategory}
                    placeholder={{ vi: "Chọn phân loại", en: "Select subcategory" }}
                />
                <CategorySelect
                    title="Conditions"
                    items={conditionItems}
                    onChange={handleCategoryChange}
                    value={condition}
                    placeholder={{ vi: "Chọn tình trạng", en: "Select condition" }}
                />
                <div className="flex-1 ">
                    <CategorySelect
                        title="Nation"
                        items={[]}
                        onChange={handleCategoryChange}
                        value={nation}
                        fetchItems={getCountries}
                        placeholder={{ vi: "Chọn quốc gia", en: "Select country" }}
                        initIndex={1}
                    />
                    <CategorySelect
                        className="flex"
                        title="Province"
                        items={[]}
                        onChange={handleCategoryChange}
                        value={province}
                        fetchItems={getProvincesByCountry}
                        dependsOn={nation?.en}
                        placeholder={{ vi: "Chọn tỉnh/thành", en: "Select province/city" }}
                        initIndex={0}
                    />
                </div>
            </div>
            <SearchSection />
        </>
    )
};

export default EventFilterComponent;
