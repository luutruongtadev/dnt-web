"use client";
import { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from "react-i18next";
import "../styles/Login.css";
import { useParams } from '@/lib/router-compat';
import { getProductById } from "../services/productService";
import {
  Home as HomeIcon,
  KeyboardIcon as KeyboardIcon,
  Eye as EyeIcon,
  Forward as Share2Icon,
} from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import GoodsAccount from "../components/GoodsAccount";
import { findCategoryLabel, findSubCategoryLabel, findConditionLabel } from "../constants/filterConstants";


export default function DetailOfGoodsPage() {
  const { t, i18n } = useTranslation();
  const isVi = (i18n.language || "vi").toLowerCase().startsWith("vi");
  const [color, setColor] = useState(localStorage.getItem("selectedColor"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const navigate = useNavigate();
  const { id } = useParams(); // Get the ID from the URL parameter
  const [product, setProduct] = useState({});

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
    const token = localStorage.getItem("authToken");
    setUser(token);
  }, [color]);

  useEffect(() => {
    // Fetch product details using the ID
    fetchProductDetails();

  }, [id]);

  const normalizeProductItems = (nextProduct) => {
    const rawItems = nextProduct?.productItems;
    if (Array.isArray(rawItems)) return rawItems;
    if (Array.isArray(rawItems?.data)) {
      return rawItems.data.map((item) => ({
        id: item.id,
        documentId: item.documentId,
        ...(item.attributes || item),
      }));
    }
    return [];
  };

  const normalizeProduct = (rawProduct) => ({
    id: rawProduct?.id,
    documentId: rawProduct?.documentId,
    ...(rawProduct?.attributes || rawProduct || {}),
  });

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProductById(id);
      const nextProduct = normalizeProduct(response.data?.data || {});
      setProduct(nextProduct);
      setSelectedCountry(nextProduct.nation || "");
      setSelectedProvince(nextProduct.province || "");
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError(err.message || "Error fetching product details");
    } finally {
      setLoading(false);
    }
  };

  const normalizedProductItems = normalizeProductItems(product);
  const productItems = normalizedProductItems.length
    ? normalizedProductItems
    : [product];
  const productEndDate = product.endPostDate || product.endPostTime;
  const productAddress = product.goodsAddress || product.address || product.province || "";
  const productDisplayId = product.custom_id || product.documentId || product.id || "";
  const goodsLat = product.goodsLat ?? product.lat ?? product.latitude;
  const goodsLng = product.goodsLng ?? product.lng ?? product.longitude;
  const hasGoodsCoordinates = goodsLat !== undefined && goodsLat !== null && goodsLat !== "" && goodsLng !== undefined && goodsLng !== null && goodsLng !== "";
  const aiLiveGoodsId = product.documentId || product.id || id;

  return (
    <div className="min-h-screen w-full">
      <div className="bg-transparent p-4 w-full">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between relative mb-2">
          <button
            className="text-red-600 hover:text-red-800 relative"
            onClick={() => navigate("/")}
          >
            <HomeIcon size={28} />
          </button>
          {/* Tiêu đề ở giữa */}
          <div className="text-center relative flex-1 flex items-center justify-center gap-2">
            <input
              type="color"
              value={color}
              onChange={handleChangeColor}
              className="w-10 h-8 cursor-pointer"
            />
            <h1 className="text-3xl font-bold text-black relative inline-block">
              6 - {t('detailOfGoods.title')}
            </h1>
          </div>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => navigate("/admin-control")}
          >
            <KeyboardIcon size={28} />
          </button>
        </div>
        {/* TÀI KHOẢN HÀNG HÓA Section - Chỉ hiển thị khi đã đăng nhập */}
        {user && (
          <GoodsAccount title={t("goods.accountOfGoods")} onTransfer={() => { /* TODO: thêm handler nếu cần */ }} />
        )}
        {/* Category Selection - Tối ưu không gian */}
        <div className="mt-2">
          <div className="grid grid-cols-5 gap-2">
            {[
              [product.listingType, findCategoryLabel],
              [product.categoryType, findSubCategoryLabel],
              [product.conditionType, findConditionLabel],
            ].map(([value, findLabel], idx) => {
              const label = findLabel(value);
              return (
                <div key={idx} className="flex items-center justify-center">
                  <select className="w-full p-2 border border-gray-300" value={value || ""} disabled>
                    <option value="">{t('detailOfGoods.selectType')}</option>
                    {value && <option value={value}>{label ? (isVi ? label.vi : label.en) : value}</option>}
                  </select>
                </div>
              );
            })}
            <div className="flex items-center justify-center">
              <select className="w-full p-2 border border-gray-300" disabled value={selectedCountry || ""}>
                <option value="">{t('detailOfGoods.selectCountry')}</option>
                {selectedCountry && (
                  <option value={selectedCountry}>{selectedCountry}</option>
                )}
              </select>
            </div>
            <div className="flex items-center justify-center">
              <select className="w-full p-2 border border-gray-300" disabled value={selectedProvince || ""}>
                <option value="">{t('detailOfGoods.selectProvince')}</option>
                {selectedProvince && (
                  <option value={selectedProvince}>{selectedProvince}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* ID Section */}
        <div className="flex items-center border border-gray-300">
          <label className="w-20 text-center font-bold">ID:</label>
          <div className="w-full p-2  border-gray-300 text-center grid grid-cols-12">
            <div className="col-span-11 text-left">
              {productDisplayId}
            </div>
            <div className="col-span-1 flex items-center gap-2 justify-end">
              <EyeIcon size={16} />
              <Share2Icon size={16} />
            </div>

          </div>
        </div>
        {loading && <div className="p-2 text-center text-sm">{t("common.loading", "Đang tải...")}</div>}
        {error && <div className="p-2 text-center text-sm text-red-600">{error}</div>}
        <ProductGrid products={productItems} readOnly={true} />

        {/* Product Details Section */}

        {/* Product Information */}
        <div className="w-full border border-gray-300 mt-4 rounded-md overflow-hidden">
          <div className="grid grid-cols-3 divide-y divide-gray-300">
            <div className="p-2 text-left font-bold">
              {t('detailOfGoods.timeReviewPrice')}:
            </div>
            <div className="p-2 text-center border-l border-gray-300">
              <span className="text-sm italic">{product.priceReviewTime || "24:00"}</span>
            </div>
            <div className="border-l border-gray-300"></div>

            <div className="p-2 text-left font-bold">
              {t('detailOfGoods.endTime')}:
            </div>
            <div className="p-2 text-center border-l border-gray-300">
              {productEndDate ? new Date(productEndDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) : ''}
            </div>
            <div className="p-2 text-center border-l border-gray-300">
              {productEndDate ? new Date(productEndDate).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }) : ''}
            </div>

            <div className="p-2 text-left font-bold">
              {t('detailOfGoods.goodsAddress')}:
            </div>
            <div className="p-2 text-center border-l border-gray-300">
              {productAddress}
            </div>
            <div className="p-2 text-center border-l border-gray-300">
              {hasGoodsCoordinates ? (
                <div className="flex flex-col items-center gap-1">
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="120"
                    loading="lazy"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${goodsLat},${goodsLng}&z=16&output=embed`}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${goodsLat},${goodsLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-xs underline"
                  >
                    Mở Google Maps
                  </a>
                </div>
              ) : (
                "#Map#"
              )}
            </div>

            {/* Column 1: XÁC MINH HÀNG HÓA */}
            {/* Column 1: XÁC MINH HÀNG HÓA */}
            <div className="p-2 text-center flex flex-col items-center justify-center">
              <div className="font-bold">{t('detailOfGoods.goodsVerify')}</div>
              <button className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded text-sm mt-1">
                {t('detailOfGoods.clickToOpen')}
              </button>
            </div>
            {/* Column 2: THƯƠNG HIỆU NGƯỜI ĐĂNG BÀI */}
            <div className="p-2 text-center flex flex-col items-center justify-center border-l border-gray-300">
              <div className="font-bold">{t('detailOfGoods.posterBrand')}</div>
              <button className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded text-sm mt-1">
                {t('detailOfGoods.clickToOpen')}
              </button>
            </div>
            {/* Column 3: LIVESTREAM HÀNG HÓA */}
            <div className="p-2 text-center flex flex-col items-center justify-center border-l border-gray-300">
              <div className="font-bold">{t('detailOfGoods.goodsLivestream')}</div>
              <button
                type="button"
                onClick={() => navigate(`/ai-live/video-goods/${aiLiveGoodsId}`)}
                className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded text-sm mt-1"
              >
                {t('detailOfGoods.clickToOpen')}
              </button>
            </div>
          </div>
        </div>


        {/* Accept Section - Temp Hidden */}
        {/* <div className="w-full  mt-4">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className=" p-2 text-center"
                  width="30%"
                ></td>
                <td
                  className=" p-2 text-center font-bold"
                  width="40%"
                >
                  <button
                    onClick={handlePriceUpdate}

                    className="px-6 py-2 border rounded hover:bg-green-600 font-bold w-full"
                  >
                    {t('detailOfGoods.accept')}
                  </button>
                </td>
                <td
                  className=" p-2 text-center"
                  width="30%"
                ></td>
              </tr>
            </tbody>
          </table>
        </div> */}

        {/* Back Button */}

      </div>
    </div>
  );
}
