"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from "react-i18next";
import {
  Home as HomeIcon,
  KeyboardIcon as KeyboardIcon,
} from "lucide-react";
import "../styles/Login.css";
import TwoLineUnitInput from "../components/atoms/TwoLineUnitInput";
import AdBanner from "../components/AdBaner";


export default function RewardListPage() {
  const { t } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor") || "#ffffff");
  const [user, setUser] = useState(null);
  const [activeAvatarRow, setActiveAvatarRow] = useState(null);
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
    <div className="flex justify-center items-center w-full">
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
              - {t('rewardList.title', 'DANH SÁCH NHẬN THƯỞNG')}
            </h1>
            <div className="mt-10 font-normal text-sm md:text-base text-gray-700">
              {t('rewardList.onlyForWalletWithBalance', '(Chỉ áp dụng cho tài khoản có số dư VÍ > 0)')}
            </div>
          </div>
          <button 
            className="text-red-600 hover:text-red-800"
            onClick={() => navigate("/admin-control")}
          >
            <KeyboardIcon size={28} />
          </button>
        </div>

        {/* Grid Content */}
        {activeAvatarRow !== null && (
          <div className="mt-5 mb-4 flex flex-col items-start w-full lg:w-auto">
            <table className="border border-black text-center text-xs bg-white w-full max-w-3xl table-fixed">
              <thead>
                <tr>
                  <th className="border border-black p-2">{t('rewardList.transfer', 'CHUYỂN')}<br/>Vietnam D</th>
                  <th className="border border-black p-2">{t('rewardList.to', 'ĐẾN')}<br/>{t('rewardList.friends', 'bạn bè')}</th>
                  <th className="border border-black p-2">{t('rewardList.withdraw', 'RÚT')}<br/>Vietnam D</th>
                  <th className="border border-black p-2">{t('rewardList.vatInvoice', 'HÓA ĐƠN VAT')}</th>
                  <th className="border border-black p-2">{t('rewardList.confirm', 'XÁC NHẬN')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1">
                    <input type="number" className="w-full text-center outline-none bg-transparent" placeholder={t('rewardList.enterNumber', '(nhập số)')} />
                  </td>
                  <td className="border border-black p-1">
                    <select className="w-full text-center outline-none bg-transparent cursor-pointer">
                      <option value="">{t('rewardList.choose', '(chọn)')}</option>
                      <option value="1">{t('rewardList.friendAvatar1', 'AVT bạn bè 1')}</option>
                      <option value="2">{t('rewardList.friendAvatar2', 'AVT bạn bè 2')}</option>
                    </select>
                  </td>
                  <td className="border border-black p-1">
                    <input type="number" className="w-full text-center outline-none bg-transparent" placeholder={t('rewardList.enterNumber', '(nhập số)')} />
                  </td>
                  <td className="border border-black p-1">
                    <input type="text" className="w-full text-center outline-none bg-transparent" placeholder={t('rewardList.enterLink', '(nhập link)')} />
                  </td>
                  <td className="border border-black p-1 cursor-pointer font-bold hover:bg-gray-200">
                    {t('rewardList.confirm', 'XÁC NHẬN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6">
            <table className="w-full table-fixed border border-black text-xs text-center">
            <thead>
                <tr>
                <th className="border border-black w-10">{t('rewardList.stt', 'STT')}</th>
                <th className="border border-black w-24">{t('rewardList.avatar', 'HÌNH NỀN')}<br />({t('rewardList.avatarEn', 'Avatar')})</th>
                <th className="border border-black w-40">{t('rewardList.referrer', 'NGƯỜI GIỚI THIỆU')}<br />
                    <span className="text-[10px] text-black font-normal">
                    ({t('rewardList.referrerNote', '* 7% app thu được từ quá trình mua bán tại hệ thống do bạn giới thiệu sẽ hiện trong NGƯỜI GIỚI THIỆU của họ (APP CHỦ TẤT CẢ CÁC LOẠI)')})
                    </span>
                </th>
                <th className="border border-black w-40">{t('rewardList.watchAd', 'XEM QUẢNG CÁO')}<br />
                    <span className="text-[10px] text-black font-normal inline-flex items-center justify-center">
                    (0.01 <TwoLineUnitInput centerOnly className="!w-auto !h-auto mx-1 mt-1 scale-90" /> /{t('rewardList.perSecond', 'S')})
                    </span>
                </th>
                <th className="border border-black w-40">{t('rewardList.aiLiveRevenue', 'DOANH THU TỪ Ai LIVE')}<br />
                    <span className="text-[10px] text-black font-normal">
                    {t('rewardList.accountOwnerReceive', '(Chủ tài khoản nhận 50%)')}
                    </span>
                </th>
                <th className="border border-black w-40">{t('rewardList.reportCorrect', 'BÁO CÁO ĐÚNG')}<br />
                    <span className="text-[10px] text-black font-normal inline-flex items-center justify-center">
                    (50.000 <TwoLineUnitInput centerOnly className="!w-auto !h-auto mx-1 mt-1 scale-90" /> /{t('rewardList.perSession', 'Lượt')})
                    </span>
                </th>
                <th className="border border-black w-32">{t('rewardList.reportWrong', 'BÁO CÁO SAI')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center">(-50.000 <TwoLineUnitInput centerOnly className="!w-auto !h-auto mx-1 mt-1 scale-90" /> /{t('rewardList.perSession', 'Lượt')})</span>
                </th>
                <th className="border border-black w-24">{t('rewardList.sudden', 'ĐỘT XUẤT')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.holiday', 'LỄ TẾT')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.beginningOfYear', 'ĐẦU NĂM')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.transferred', 'ĐÃ CHUYỂN')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.received', 'ĐÃ NHẬN')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.withdrawn', 'ĐÃ RÚT')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.used', 'ĐÃ SỬ DỤNG')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                <th className="border border-black w-20">{t('rewardList.remainingBalance7Days', 'SỐ TIỀN CÒN LẠI ĐƯỢC SỬ DỤNG TRONG 7 NGÀY')}<br />
                    <span className="text-[10px] inline-flex items-center justify-center w-full mt-1"><TwoLineUnitInput centerOnly className="!w-auto !h-auto mt-1 scale-90" /></span>
                </th>
                </tr>
            </thead>
            <tbody>
                {[...Array(10)].map((_, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                      <td className="border border-black">{idx + 1}</td>
                      <td 
                        className="border border-black cursor-pointer hover:bg-gray-100 font-bold"
                        onClick={() => setActiveAvatarRow(activeAvatarRow === idx ? null : idx)}
                      >
                        AVT
                      </td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">-1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                      <td className="border border-black">1.000.000.00</td>
                  </tr>
                </React.Fragment>
                ))}
            </tbody>
            </table>
        </div>
      </div>
      <AdBanner/>
    </div>
  );
}
