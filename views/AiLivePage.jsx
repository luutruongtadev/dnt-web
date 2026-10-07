"use client";
import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import AiLiveLiveStreamComponent from "../components/AiLiveLiveStreamComponent";
import AiLiveVideoComponent from "../components/AiLiveVideoComponent";
import AiLiveMovieComponent from "../components/AiLiveMovieComponent";
import AiLiveLiveComponent from "../components/AiLiveLiveComponent";
import { useTranslation } from 'react-i18next';
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx";
import NumericInput from "../components/NumericInput.jsx";
import AiLiveStreamGoods from "../components/organisms/AiLiveStreamGoods.jsx";
import AiLiveVideoList from "../components/AiLiveVideoList.jsx";


export default function AiLivePage() {
  const { t } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor") || "#ffffff");
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState("VIDEO");

  // Using the shared NumericInput component for numeric-only input


  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
    const token = localStorage.getItem("authToken");
    setUser(token);
  }, [color]);

      

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
    // Clear any saved background image so solid color takes over
    localStorage.removeItem("selectedBgImage");
    document.getElementById("root").style.backgroundImage = "";
  };

  return (
    <div className="flex justify-center items-start min-h-screen pt-2">
      <div className="bg-transparent backdrop-blur-md p-0 rounded-lg w-full  mx-auto">
        {/* Header */}
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix="8"
          title={t('aiLive.pageTitle')}
        />

        {/* 6 Buttons - compact row (kéo lên, kích thước nhỏ thôi) */}
        <div className="grid grid-cols-3 sm:grid-cols-6  gap-2 mt-0">
          {[
                { label: t('aiLive.livestream'), sub: t('aiLive.livestreamSub'), value: "LIVESTREAM" },
                { label: t('aiLive.video'), sub: "", value: "VIDEO" },
                { label: t('aiLive.movie'), sub: t('aiLive.movieSub'), value: "MOVIE" },
                { label: t('aiLive.live'), sub: t('aiLive.liveSub'), value: "LIVE" },
                { label: t('aiLive.equipment'), sub: t('aiLive.equipmentSub'), value: "EQUIPMENT" },
                { label: t('aiLive.vutrucanhan'), sub: t('aiLive.vutrucanhanSub'), value: "VUTRUCANHAN" },
              ].map((item, idx) => (
                <button dangerouslySetInnerHTML={{ __html: item.label }}
                  key={idx}
                  className={
                    selectedComponent === item.value
                      ? "bg-blue-600 text-white font-bold py-1.5 px-2 text-sm rounded-lg text-center transition-all"
                      : "border border-gray-200 hover:bg-blue-50 hover:text-blue-700 text-black font-bold py-1.5 px-2 text-sm rounded-lg text-center transition-all"
                  }
                  onClick={() => {setSelectedComponent(item.value);}}
                >

                </button>
              ))}
        </div>
        {
          selectedComponent === null && (
            <AiLiveVideoList />
          )
        }
        {/* Hiển thị component tùy theo lựa chọn */}
        {selectedComponent === "LIVESTREAM" && (
        <AiLiveStreamGoods />
        )}
        {selectedComponent === "VIDEO" && (
        <AiLiveVideoComponent />
        )}
        {selectedComponent === "MOVIE" && (
        <AiLiveMovieComponent />
        )}
        {selectedComponent === "LIVE" && (
        <AiLiveLiveComponent />
        )}
      </div>
    </div>
  );
}
