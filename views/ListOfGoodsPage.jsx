"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "../styles/Login.css";
import { useNavigate } from '@/lib/router-compat';
import { filterProducts } from "../services/productService";
import { useTranslation } from 'react-i18next';
import { getCountries, getCountryByCode } from "../services/countries";
import { getMediaUrl } from "../services/videoService";
import { categories, getSubCategoryList, getConditionList, SUBCATEGORY_PLACEHOLDER, CONDITION_PLACEHOLDER } from "../constants/filterConstants";
import {
  Mic as MicIcon,
  SearchIcon as SearchIcon,
} from "lucide-react";

// The first entry of every list is a placeholder, and "Tất cả / ALL" means "no filter";
// both map to an empty filter value. Every other option is sent to the API as its `en`
// value, which is exactly what the Home page stores on the product.
const NO_FILTER_VALUES = ["ALL", "All", "Tất cả"];
const optionValue = (item, index) =>
  index === 0 || NO_FILTER_VALUES.includes(item.en) ? "" : item.en;

export default function ListOfGoodsPage() {
  const { t, i18n } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor"));
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    listingType: '',
    categoryType: '',
    conditionType: '',
    nation: '',
    province: '',
    name: ''
  });
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const voiceBaseTermRef = useRef("");

  const isVi = (i18n.language || 'vi').toLowerCase().startsWith('vi');

  // Phân loại phụ thuộc danh mục, tình trạng phụ thuộc phân loại (sheet "Bộ lọc")
  const subCategories = useMemo(
    () => [SUBCATEGORY_PLACEHOLDER, ...getSubCategoryList(selectedCategory)],
    [selectedCategory]
  );
  const conditions = useMemo(
    () => [CONDITION_PLACEHOLDER, ...getConditionList(selectedCategory, selectedSubcategory)],
    [selectedCategory, selectedSubcategory]
  );
  const speechSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Helper functions for displaying values on the product cards
  const getProductTitle = (event) => {
    const firstItem = event.productItems?.[0] || {};
    return firstItem.name || event.name || event.custom_id || event.id;
  };

  const getProductQuantity = (event) => {
    const firstItem = event.productItems?.[0] || {};
    return firstItem.quantityMinimum || firstItem.quantityMinRequire || "";
  };

  const getProductPrice = (event) => {
    const firstItem = event.productItems?.[0] || {};
    return firstItem.unitAskingPrice || firstItem.autoAcceptPrice || firstItem.unitMarketPrice || "";
  };

  const getProductImage = (event) => {
    const firstItem = event.productItems?.[0] || {};
    if (firstItem.image) {
      return getMediaUrl(firstItem.image);
    }
    return 'https://img.lovepik.com/png/20231125/delivery-box-3d-illustration-icon-arrows-search_698016_wh860.png';
  };

  // Sync state to filters structure when inputs change. The search term is debounced so
  // typing - and above all live voice dictation - does not fire a request per character.
  // Reset to page 1 whenever filters change so stale page numbers don't hide results.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setFilters({
        listingType: selectedCategory || '',
        categoryType: selectedSubcategory || '',
        conditionType: selectedCondition || '',
        nation: selectedCountry || '',
        province: selectedProvince || '',
        name: searchTerm.trim()
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSubcategory, selectedCondition, selectedCountry, selectedProvince, searchTerm]);

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  // Fetch products when filters or currentPage change
  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage]);

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
    const token = localStorage.getItem("authToken");
    setUser(token);
  }, [color]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch 12 items to perfectly fit the 6-column layout
      const response = await filterProducts(filters, currentPage, 12, null, true);
      setProducts(response.data.data || []);
      setTotalPages(response.data.meta.pagination.pageCount || 1);
      setCurrentPage(response.data.meta.pagination.page || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Full country list - same source as the Home page filter
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        setCountries(await getCountries() || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch provinces when country changes.
  // Vietnam uses Strapi's vietnam-info; all other countries use the external API.
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!selectedCountry) {
        setProvinces([]);
        setSelectedProvince('');
        return;
      }
      setLoadingProvinces(true);
      try {
        let provincesList = [];
        if (selectedCountry === "Vietnam") {
          const token = localStorage.getItem("authToken");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api"}/vietnam-info`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const json = await res.json();
          const tinh = json?.data?.tinh || [];
          const all = { vi: "Tất cả", en: "All" };
          provincesList = [all, ...tinh.map(p => ({ vi: p.name, en: p.name }))];
        } else {
          provincesList = await getCountryByCode(selectedCountry) || [];
        }
        setProvinces(provincesList);
        if (selectedProvince) {
          const exists = provincesList.some(p => p.en === selectedProvince || p.vi === selectedProvince);
          if (!exists) setSelectedProvince('');
        }
        const savedProvince = localStorage.getItem("province");
        if (savedProvince && !selectedProvince) {
          const exists = provincesList.some(p => p.en === savedProvince || p.vi === savedProvince);
          if (exists) setSelectedProvince(savedProvince);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [selectedCountry]);

  // Load criteria pre-filtered on the Home page (stored in localStorage). The Home page
  // stores the same `en` values this page filters on, so a case-insensitive match is enough.
  useEffect(() => {
    const restore = (list, stored, setter) => {
      if (!stored) return;
      const match = list.find(
        (item, index) =>
          optionValue(item, index) && item.en.toUpperCase() === stored.toUpperCase()
      );
      if (match) setter(match.en);
    };

    const storedCategory = localStorage.getItem("category");
    const storedSubcategory = localStorage.getItem("subcategory");
    restore(categories, storedCategory, setSelectedCategory);
    restore([SUBCATEGORY_PLACEHOLDER, ...getSubCategoryList(storedCategory)], storedSubcategory, setSelectedSubcategory);
    restore([CONDITION_PLACEHOLDER, ...getConditionList(storedCategory, storedSubcategory)], localStorage.getItem("condition"), setSelectedCondition);

    const nation = localStorage.getItem("nation");
    if (nation && !NO_FILTER_VALUES.includes(nation)) {
      setSelectedCountry(nation);
    }
  }, []);

  // Voice search: dictated text lands in the search box as it is recognised, so the
  // customer can read back what was understood before it is used as a filter.
  const toggleVoiceSearch = () => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    voiceBaseTermRef.current = searchTerm ? `${searchTerm.trim()} ` : '';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSearchTerm(voiceBaseTermRef.current + transcript);
      setCurrentPage(1);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Stop an in-flight recognition session when leaving the page
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <div className="flex min-h-screen">
      <div className="bg-transparent backdrop-blur-md p-1 rounded-lg w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between relative mb-2">
          {/* Tiêu đề ở giữa */}
          <div className="text-center relative flex-1 flex items-center justify-center gap-2">
            <input
              type="color"
              value={color}
              onChange={handleChangeColor}
              className="w-10 h-8 cursor-pointer"
            />
            <h1 className="text-3xl font-bold text-black relative inline-block">
              5 - {t('goods.listOfGoods')}
            </h1>
          </div>
        </div>

        <div className="mt-2">
          {/* 5-column grid for filters */}
          <div className="grid grid-cols-5 gap-2">
            {/* Column 1 - Categories */}
            <div className="flex items-center justify-center">
              <select
                className="w-full p-2 border border-gray-300"
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  // Phân loại/tình trạng không còn thuộc danh mục mới thì bỏ chọn
                  const subs = getSubCategoryList(e.target.value);
                  if (!subs.some((sc) => sc.en === selectedSubcategory)) {
                    setSelectedSubcategory('');
                    setSelectedCondition('');
                  } else if (!getConditionList(e.target.value, selectedSubcategory).some((cd) => cd.en === selectedCondition)) {
                    setSelectedCondition('');
                  }
                  setCurrentPage(1);
                }}
              >
                {categories.map((item, index) => (
                  <option key={item.en} value={optionValue(item, index)}>
                    {isVi ? item.vi : item.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Column 2 - Subcategories */}
            <div className="flex items-center justify-center">
              <select
                className="w-full p-2 border border-gray-300"
                value={selectedSubcategory || ''}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  if (!getConditionList(selectedCategory, e.target.value).some((cd) => cd.en === selectedCondition)) {
                    setSelectedCondition('');
                  }
                  setCurrentPage(1);
                }}
              >
                {subCategories.map((item, index) => (
                  <option key={item.en} value={optionValue(item, index)}>
                    {isVi ? item.vi : item.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Column 3 - Conditions */}
            <div className="flex items-center justify-center">
              <select
                className="w-full p-2 border border-gray-300"
                value={selectedCondition || ''}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {conditions.map((item, index) => (
                  <option key={item.en} value={optionValue(item, index)}>
                    {isVi ? item.vi : item.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Column 4 - Country (full list, same source as the Home page) */}
            <div className="flex items-center justify-center">
              <select
                className="w-full p-2 border border-gray-300"
                value={selectedCountry || ''}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedProvince('');
                  setCurrentPage(1);
                }}
                disabled={loadingCountries}
              >
                {loadingCountries && (
                  <option value="">{isVi ? 'Đang tải...' : 'Loading...'}</option>
                )}
                {countries.map((country, index) => (
                  <option key={country.cca2 || country.en} value={optionValue(country, index)}>
                    {isVi ? country.vi : country.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Column 5 - Province ("Tất cả" first, same source as the Home page) */}
            <div className="flex items-center justify-center">
              <select
                className="w-full p-2 border border-gray-300"
                value={selectedProvince || ''}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!selectedCountry || loadingProvinces}
              >
                {(loadingProvinces || provinces.length === 0) && (
                  <option value="">
                    {loadingProvinces ? (isVi ? 'Đang tải...' : 'Loading...') : (isVi ? 'Tất cả' : 'All')}
                  </option>
                )}
                {provinces.map((province, index) => (
                  <option key={province.en} value={optionValue(province, index)}>
                    {isVi ? province.vi : province.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search section */}
          <div className="mt-1 border-1 border-gray-300">
            <div className="flex items-center gap-1">
              <SearchIcon size={24} className="text-gray-400" />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  title={isVi ? 'Nhấn để nói' : 'Press to speak'}
                  aria-label={isVi ? 'Tìm kiếm bằng giọng nói' : 'Voice search'}
                  aria-pressed={isListening}
                  className={`p-1 rounded-full transition-colors ${
                    isListening ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <MicIcon size={22} />
                </button>
              )}
              <input
                type="text"
                className="flex-1 p-2 rounded focus:outline-none"
                placeholder={isListening
                  ? (isVi ? 'Đang nghe...' : 'Listening...')
                  : t('goods.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          {/* Loading details */}
          {loading && (
            <div className="p-4 text-center text-sm font-semibold text-gray-600">
              {t("common.loading", "Đang tải danh sách hàng hóa...")}
            </div>
          )}

          {/* Listing section */}
          {!loading && (
            <div className="mt-2">
              {products.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic bg-white/50 rounded-xl border border-dashed border-gray-300">
                  Không tìm thấy hàng hóa nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {products.map((product) => {
                    const detailId = product.documentId || product.id;
                    const title = getProductTitle(product);

                    return (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/list-of-goods/${detailId}`)}
                        style={{
                          backgroundColor: "white",
                          minHeight: "clamp(138px, 18vw, 230px)",
                          padding: "clamp(6px, 1vw, 10px)",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          alignItems: "stretch",
                          textAlign: "center",
                          border: "1px solid black",
                          boxSizing: "border-box",
                          cursor: "pointer",
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        <h3 style={{
                          margin: "4px 0 8px 0",
                          fontSize: "clamp(11px, 1.15vw, 14px)",
                          lineHeight: 1.25,
                          fontWeight: "bold",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflowWrap: "anywhere",
                        }}>
                          {title}
                        </h3>
                        <div style={{
                          minWidth: 0,
                          textAlign: "left",
                          fontSize: "clamp(10px, 1vw, 12px)",
                          lineHeight: 1.25,
                          fontWeight: "bold",
                        }}>
                          {product.listingType ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.listingType.toUpperCase()}</p> : null}
                          {product.categoryType ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.categoryType}</p> : null}
                          {(product.conditionType || product.status) ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.conditionType || product.status}</p> : null}
                          {(product.goodsAddress || product.address || product.province) ? <p style={{ margin: "2px 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{product.goodsAddress || product.address || product.province}</p> : null}
                          {getProductQuantity(product) ? <p style={{ margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getProductQuantity(product)}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (() => {
                const delta = 2;
                const pages = [];
                for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) pages.push(i);
                const btnCls = (active) => `px-3.5 py-1.5 border rounded-lg font-semibold text-sm transition-colors ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`;
                return (
                  <div className="flex justify-center items-center gap-1 mt-6 flex-wrap">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`${btnCls(false)} disabled:opacity-40`}>«</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`${btnCls(false)} disabled:opacity-40`}>‹</button>
                    {pages[0] > 1 && <span className="px-2 text-gray-400">…</span>}
                    {pages.map(p => (
                      <button key={p} onClick={() => setCurrentPage(p)} className={btnCls(p === currentPage)}>{p}</button>
                    ))}
                    {pages[pages.length - 1] < totalPages && <span className="px-2 text-gray-400">…</span>}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`${btnCls(false)} disabled:opacity-40`}>›</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`${btnCls(false)} disabled:opacity-40`}>»</button>
                    <span className="ml-2 text-sm text-gray-500">{currentPage}/{totalPages}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
