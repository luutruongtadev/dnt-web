"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import planetImage from '../assets/planet.jpg';

const GlobalInfoComponent = () => {
  const { t } = useTranslation();

  return (
    <div className="">
      {/* Global Logo - Planet Earth */}
      <div className="">
        <div className="">
          <img
            src={planetImage?.src || planetImage}
            alt="Global Planet"
            style={{height: '95%',paddingTop: '27px'}}
            className="w-full h-full max-w-[100px] max-h-[100px] sm:max-w-[130px] sm:max-h-[130px] md:max-w-[130px] md:max-h-[200px] object-contain mx-auto"
          />
        </div>
      </div>
      
    </div>
  );
};

export default GlobalInfoComponent;