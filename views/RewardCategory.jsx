"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import {
  Home as HomeIcon,
  KeyboardIcon as KeyboardIcon,
} from "lucide-react";
import "../styles/Login.css";
import { useTranslation } from 'react-i18next';


export default function RewardCategoryPage() {
  const { t } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor") || "#ffffff");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
    const token = localStorage.getItem("authToken");
    setUser(token);
  }, [color]);

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="bg-transparent backdrop-blur-md p-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between relative">
          <button 
            className="text-red-600 hover:text-red-800 relative"
            onClick={() => navigate("/")}
          >
            <HomeIcon size={28} />
          </button>
          {/* Tiêu đề ở giữa */}
          <div className="text-center mb-4 relative flex-1">
            <h1 className="text-3xl font-bold text-black relative inline-block">
              <span className="relative">
                10
                <input
                  type="color"
                  value={color}
                  onChange={handleChangeColor}
                  className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-10 h-8 cursor-pointer"
                />
              </span>{" "}
              - {t('rewardCategory.title', 'DANH MỤC PHẦN THƯỞNG')}
            </h1>
          </div>
          <button 
            className="text-red-600 hover:text-red-800"
            onClick={() => navigate("/admin-control")}
          >
            <KeyboardIcon size={28} />
          </button>
        </div>

        {/* Grid Content */}
        <div className="mt-6">
            <div className="overflow-x-auto border border-black text-sm mt-6">
                <table className="table-auto w-full border-collapse text-center">
                    <thead>
                    <tr className="bg-white border-b border-black">
                        <th colSpan={6} className="text-xl font-bold py-3 border-b border-black">
                        {t('rewardCategory.title', 'DANH MỤC PHẦN THƯỞNG')}
                        </th>
                    </tr>
                    <tr className="bg-gray-100 border-b border-black">
                        <th className="border border-black px-2 py-1">{t('rewardCategory.stt', 'Stt')}</th>
                        <th className="border border-black px-2 py-1">{t('rewardCategory.content', 'Nội dung')}</th>
                        <th className="border border-black px-2 py-1">
                        {t('rewardCategory.estimatedRate', 'Ước lượng tỉ lệ trả thưởng trên')} <br /> {t('rewardCategory.totalProfit', 'tổng lợi nhuận sau thuế của sàn')}
                        </th>
                        <th className="border border-black px-2 py-1">{t('rewardCategory.rewardDeadline', 'Thời gian chốt thưởng')}</th>
                        <th className="border border-black px-2 py-1">{t('rewardCategory.payoutTime', 'Thời gian trả thưởng')}</th>
                        <th className="border border-black px-2 py-1">{t('rewardCategory.rewardTarget', 'Đối tượng nhận thưởng')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {[
                        {
                        stt: 1,
                        title: t('rewardCategory.referrer', 'NGƯỜI GIỚI THIỆU'),
                        rate: "10%",
                        deadline: t('rewardCategory.endOfMonth', 'Cuối tháng'),
                        payout: t('rewardCategory.fifthOfMonth', 'Ngày 05 hàng tháng'),
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 2,
                        title: t('rewardCategory.sharing', 'CHIA SẺ'),
                        rate: "20%",
                        deadline: t('rewardCategory.jobCompleted', 'Hoàn thành công việc'),
                        payout: t('rewardCategory.fifthOfMonth', 'Ngày 05 hàng tháng'),
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 3,
                        title: t('rewardCategory.advertising', 'QUẢNG CÁO'),
                        rate: "30%",
                        deadline: t('rewardCategory.endOfMonth', 'Cuối tháng'),
                        payout: t('rewardCategory.fifthOfMonth', 'Ngày 05 hàng tháng'),
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 4,
                        title: t('rewardCategory.violationReport', 'BÁO CÁO VI PHẠM'),
                        rate: "40%",
                        deadline: t('rewardCategory.violatorPays', 'Người vi phạm nộp phạt'),
                        payout: t('rewardCategory.fifthOfMonth', 'Ngày 05 hàng tháng'),
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 5,
                        title: t('rewardCategory.foundingDay', 'NGÀY THÀNH LẬP'),
                        rate: "10%",
                        deadline: "15/06",
                        payout: "02/07",
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 6,
                        title: t('rewardCategory.endOfYear', 'CUỐI NĂM'),
                        rate: "10%",
                        deadline: "31/12",
                        payout: "30/01",
                        target: t('rewardCategory.all', 'Tất cả'),
                        },
                        {
                        stt: 7,
                        title: t('rewardCategory.beginningOfYear', 'ĐẦU NĂM'),
                        rate: t('rewardCategory.countVndNotes', 'Đếm chính xác số lượng tờ tiền VNĐ mệnh giá cao nhất'),
                        deadline: t('rewardCategory.tenthOfSpecialMonth', 'Mùng 10 tháng Riêng'),
                        payout: t('rewardCategory.sameDay', 'Cùng ngày'),
                        target: t('rewardCategory.companyEmployees', 'Nhân viên công ty'),
                        },
                        {
                        stt: 8,
                        title: t('rewardCategory.sudden', 'ĐỘT XUẤT'),
                        rate: "50%",
                        deadline: t('rewardCategory.receivePayment', 'Nhận thanh toán'),
                        payout: t('rewardCategory.sameDay', 'Cùng ngày'),
                        target: t('rewardCategory.companyEmployees', 'Nhân viên công ty'),
                        },
                    ].map((row, i) => (
                        <tr key={i} className="border-b border-black">
                        <td className="border border-black px-2 py-1">{row.stt}</td>
                        <td className="border border-black px-2 py-1 text-left">{row.title}</td>
                        <td className="border border-black px-2 py-1">{row.rate}</td>
                        <td className="border border-black px-2 py-1">{row.deadline}</td>
                        <td className="border border-black px-2 py-1">{row.payout}</td>
                        <td className="border border-black px-2 py-1">{row.target}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

        </div>
      </div>
    </div>
  );
}
