"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next"
import VideoCard from "./molecules/VideoCard"
import { useNavigate } from '@/lib/router-compat'

export default function AiLiveVideoList({ videos = [] }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate()

  const rawData = videos.length
    ? videos
    : Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `${t("aiLiveVideo.video", "VIDEO")} ${i + 1}`,
      productId: `PRD-${String(i + 1).padStart(3, "0")}`,
      viewers: 2112,
      saves: 35143,
      shares: 424652,
      hasPlatformLogo: i % 5 === 0,
    }))

  // Video có Logo nền tảng đứng đầu danh sách của ID hàng hóa đó
  const data = [...rawData].sort((a, b) => (b.hasPlatformLogo ? 1 : 0) - (a.hasPlatformLogo ? 1 : 0))

  const pageSize = 12;
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handlePrevPage}
        className="disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center text-center"
      >
        <ChevronRight size={24} />
      </button>

      <div className="grid sm:grid-cols-6 grid-cols-3 gap-4 border-black py-4 px-2 flex-grow ">
        {paginatedData.map((v, idx) => {
          const originalIndex = currentPage * pageSize + idx;
          return (
            <div key={v.id} className="min-h-48">
              <VideoCard
                index={originalIndex + 1}
                name={v.name}
                productId={v.productId}
                viewers={v.viewers}
                saves={v.saves}
                shares={v.shares}
                hasPlatformLogo={v.hasPlatformLogo}
                selected={selectedIndex === originalIndex}
                onClick={() => { setSelectedIndex(originalIndex); navigate(`/ai-live/${v.isGoods ? 'video-goods' : 'video'}/${v.id}`) }}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={handleNextPage}
        className="disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center text-center p-2"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  )
}