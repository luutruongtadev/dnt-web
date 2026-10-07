"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/Login.css";
import axios from "axios";
import { useNavigate } from '@/lib/router-compat';
import NewFreelancerPostDirectComponent from "../components/NewFreelancerPostDirectComponent";
import NewFreelancerPostOnlineComponent from "../components/NewFreelancerPostOnlineComponent";
import NewFreelancerShippingComponent from "../components/NewFreelancerShippingComponent";
import { Home as HomeIcon, KeyboardIcon as KeyboardIcon } from "lucide-react";
import PostTypeMenu from "../components/PostTypeMenu";
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx";
import GoodsAccount from "../components/GoodsAccount.jsx";



export default function NewFreelancerPostPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState(localStorage.getItem("authToken"));
  const [color, setColor] = useState(localStorage.getItem("selectedColor"));
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "online"
  const navigate = useNavigate();

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
    // Clear any saved background image so solid color takes over
    localStorage.removeItem("selectedBgImage");
    document.getElementById("root").style.backgroundImage = "";
  };

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
  }, [color]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-transparent backdrop-blur-md p-1 rounded-lg w-full mx-auto">
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix="4"
          leftButton={
            <button
              className="text-red-600 hover:text-red-800 relative"
              onClick={() => navigate("/")}
            >
              <HomeIcon size={28} />
            </button>
          }
          rightButton={
            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => navigate("/admin-control")}
            >
              <KeyboardIcon size={28} />
            </button>
          }
          title={t("freelancer.newPost")}
        />

        {/* Table layout matching the image */}
        <div className="mt-1">
          <div className=" border-gray-300">
            {/* Top Categories Section */}
            <PostTypeMenu activeType="freelancer" />
            {/* TÀI KHOẢN HÀNG HÓA Section */}
            <GoodsAccount title={t("freelancer.accountOfFreelancer")} onTransfer={{}} />
            {/* Two columns layout */}
            <div className="flex justify-center">
              {/* Column 1 - THỰC TẾ */}
              <div
                className={`border flex-1 border-gray-300 p-2 text-center cursor-pointer w-[2vw] ${
                  activeTab === "direct" ? "bg-blue-600" : ""
                }`}
                style={{ maxWidth: "15vw" }}
                onClick={() => setActiveTab("direct")}
              >
                <h3 className="font-bold ">
                  {t("freelancer.actual")}
                </h3>
              </div>
              {/* Column 2 - TRỰC TUYẾN */}
              <div
                className={`p-2 flex-1 border text-center cursor-pointer  ${
                  activeTab === "online" ? "bg-blue-600" : ""
                }`}
                style={{ maxWidth: "15vw" }}
                onClick={() => setActiveTab("online")}
              >
                <h3 className="font-bold ">
                  {t("freelancer.online")}
                </h3>
              </div>

               <div
                className={`p-2 flex-1 border text-center cursor-pointer ${
                  activeTab === "shipping" ? "bg-blue-600" : ""
                }`}
                style={{ maxWidth: "15vw" }}
                onClick={() => setActiveTab("shipping")}
              >
                <h3 className="font-bold ">
                  {t("freelancer.shipping")}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Render the appropriate component based on the active tab */}
        {activeTab === "direct" ? (
          <NewFreelancerPostDirectComponent />
        ) : activeTab === "online" ? (
          <NewFreelancerPostOnlineComponent />
        ) : (
          <NewFreelancerShippingComponent />
        )}
      </div>
    </div>
  );
}
