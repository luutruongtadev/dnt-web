"use client";
import React from 'react';
import { Link } from '@/lib/router-compat';
import { useTranslation } from 'react-i18next';

const CountrySpecificComponent = ({ userCountry = 'vi' }) => {
  const { t, i18n } = useTranslation();
  
  // Mock data for country information - will be replaced with JSON later
  const countryData = {
    vi: {
      flag: '/VIỆT NAM.jpg',
      companyName: 'CÔNG TY TNHH ĐẠI NGHĨA TÍN',
      companyNameEn: 'DAI NGHIA TIN COMPANY LIMITED',
      mst: '3702678200',
      address: 'AN PHƯỚC - ĐỒNG NAI - VIỆT NAM',
      representative: 'VŨ VĂN NGHĨA',
      position: 'CHỨC DANH',
      role: 'CHỦ TỊCH CÔNG TY KIÊM GIÁM ĐỐC'
    },
    en: {
      flag: '/United States.jpg',
      companyName: 'DAI NGHIA TIN COMPANY LIMITED',
      companyNameEn: 'DAI NGHIA TIN COMPANY LIMITED',
      mst: 'US-123456789',
      address: 'NEW YORK - UNITED STATES',
      representative: 'VU VAN NGHIA',
      position: 'POSITION',
      role: 'CHAIRMAN & CEO'
    }
  };

  const currentCountry = countryData[userCountry] || countryData.vi;
  const currentLang = i18n.language || 'vi';

  const isLoggedIn = localStorage.getItem('authToken') !== null && localStorage.getItem('authToken') !== '';

  return (
    <div className="flex flex-col items-center">
      {/* Global Logo - Planet Earth */}
      <img
        src={isLoggedIn ? currentCountry.flag : './planet.jpg'}
        alt="Country"
        style={{height: '94%'}}
        className="w-full h-full max-w-[100px] max-h-[100px] sm:max-w-[130px] sm:max-h-[130px] md:max-w-[130px] md:max-h-[200px] object-contain mx-auto"
      />
      <Link
        to="/terms-and-conditions"
        className="text-center font-bold text-red-600 underline mt-1"
        style={{ fontSize: "clamp(6px, 0.7vw, 10px)", lineHeight: 1.3 }}
      >
        HỢP ĐỒNG VÀ<br />CÁC ĐIỀU KHOẢN
      </Link>
    </div>
  );
};

export default CountrySpecificComponent;