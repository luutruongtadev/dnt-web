"use client";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from '@/lib/router-compat';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { filterProducts } from "../services/productService";
import { getMediaUrl } from "../services/videoService";

const isVideoFile = (media) => {
  if (!media) return false;
  const mime = media.mime || media.attributes?.mime || media.data?.attributes?.mime;
  if (mime && typeof mime === "string") return mime.startsWith("video/");
  const url = typeof media === "string"
    ? media
    : (media.url || media.attributes?.url || media.data?.attributes?.url || "");
  if (url && typeof url === "string") return /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(url);
  return false;
};

const ITEM_WIDTH = 192; // w-48
const GAP = 16;         // gap-4

export default function AdBanner() {
  const [showAd, setShowAd] = useState(true);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const [adProducts, setAdProducts] = useState([]);
  const [paused, setPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [offsetPx, setOffsetPx] = useState(0);
  const marqueeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowCloseBtn(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchAdProducts = async () => {
      try {
        const response = await filterProducts({}, 1, 50, null, false);
        if (!mounted) return;
        const productsList = response.data?.data || [];
        const productsWithAdFile = productsList
          .filter((p) => p.advertisingVideoFile)
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .slice(0, 20);

        if (productsWithAdFile.length > 0) {
          setAdProducts(productsWithAdFile);
        } else if (productsList.length > 0) {
          setAdProducts([...productsList].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 20));
        }
      } catch (err) {
        console.error("Failed to load ad products:", err);
      }
    };
    fetchAdProducts();
    return () => { mounted = false; };
  }, []);

  const getAdMediaUrl = (product) => {
    if (product.advertisingVideoFile) return getMediaUrl(product.advertisingVideoFile);
    if (product.videoFile) return getMediaUrl(product.videoFile);
    const items = product.productItems || [];
    if (items.length > 0) {
      const firstItem = items[0];
      if (firstItem.videoFile) return getMediaUrl(firstItem.videoFile);
      if (firstItem.image) return getMediaUrl(firstItem.image);
    }
    return "";
  };

  const isProductMediaVideo = (product) => {
    if (product.advertisingVideoFile) return isVideoFile(product.advertisingVideoFile);
    if (product.videoFile) return isVideoFile(product.videoFile);
    const items = product.productItems || [];
    if (items.length > 0) {
      if (items[0].videoFile) return true;
      if (items[0].image) return false;
    }
    return false;
  };

  if (!showAd) return null;

  // Duplicate for seamless loop
  const items = adProducts.length > 0 ? [...adProducts, ...adProducts] : null;
  // Total width of one set of items
  const totalWidth = adProducts.length * (ITEM_WIDTH + GAP);
  // Speed: px per second
  const speed = 60;
  const duration = totalWidth / speed;

  const renderCard = (product, idx) => {
    const mediaUrl = getAdMediaUrl(product);
    const isVideo = isProductMediaVideo(product);
    const detailId = product.documentId || product.id;
    return (
      <div
        key={`${product.id}-${idx}`}
        onClick={() => detailId && navigate(`/list-of-goods/${detailId}`)}
        style={{ width: ITEM_WIDTH, flexShrink: 0, marginRight: GAP }}
        className="h-20 bg-gray-100 flex items-center justify-center rounded border-2 border-gray-800 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden cursor-pointer relative group"
        title={product.name}
      >
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <img src={mediaUrl} alt={product.name} className="w-full h-full object-cover pointer-events-none" onError={(e) => { e.target.style.display = "none"; }} />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-900 font-bold text-center px-3 text-[11px] leading-snug break-words whitespace-normal pointer-events-none">
            {product.name}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[10px] px-2 py-0.5 truncate font-semibold text-center group-hover:bg-black/90 pointer-events-none">
          {product.name}
        </div>
      </div>
    );
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-[100000] h-[100px] border-t font-bold bg-white flex items-center overflow-hidden"
      onMouseEnter={() => {
        // capture current visual offset before pausing
        if (marqueeRef.current && totalWidth > 0) {
          const matrix = window.getComputedStyle(marqueeRef.current).transform;
          if (matrix && matrix !== "none") {
            const match = matrix.match(/matrix.*\((.+)\)/);
            if (match) {
              const vals = match[1].split(", ");
              const tx = parseFloat(vals[4]) || 0;
              setOffsetPx(((-tx) % totalWidth + totalWidth) % totalWidth);
            }
          }
        }
        setPaused(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => { setPaused(false); setIsHovered(false); }}
    >
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${totalWidth}px); }
        }
      `}</style>

      {showCloseBtn && (
        <button
          onClick={() => setShowAd(false)}
          className="absolute z-[100003] top-1 right-2 text-gray-500 hover:text-black font-bold cursor-pointer bg-white/80 rounded-full w-5 h-5 flex items-center justify-center border border-gray-300 shadow-sm"
        >
          ✕
        </button>
      )}

      {isHovered && (
        <button
          onClick={() => setOffsetPx((prev) => ((prev - (ITEM_WIDTH + GAP)) % totalWidth + totalWidth) % totalWidth)}
          className="absolute left-0 z-[100002] w-8 h-full rounded-none bg-blue-700/90 text-white flex items-center justify-center shadow hover:bg-blue-800"
          style={{ top: 0 }}
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div className="w-full overflow-hidden px-10">
        {items ? (
          <div
            ref={marqueeRef}
            style={{
              display: "flex",
              width: "max-content",
              animation: `marquee ${duration}s linear infinite`,
              animationDelay: `-${(offsetPx / totalWidth) * duration}s`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {items.map((product, idx) => renderCard(product, idx))}
          </div>
        ) : (
          <div className="flex gap-4 px-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex-shrink-0 w-48 h-20 bg-gray-200 flex items-center justify-center rounded border-2 border-gray-800">
                <p>Ad Card {n}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isHovered && (
        <button
          onClick={() => setOffsetPx((prev) => (prev + (ITEM_WIDTH + GAP)) % totalWidth)}
          className="absolute right-0 z-[100002] w-8 h-full rounded-none bg-blue-700/90 text-white flex items-center justify-center shadow hover:bg-blue-800"
          style={{ top: 0 }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </footer>
  );
}
