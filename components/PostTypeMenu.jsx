"use client";
import React from "react";
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from "react-i18next";

export default function PostTypeMenu({ activeType }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleTypeChange = (type) => {
    switch (type) {
      case "goods":
        navigate("/new-good-post");
        break;
      case "freelancer":
        navigate("/new-freelancer-post");
        break;
      case "ailive":
        navigate("/new-ai-live-post");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex justify-center items-center border-b-2 border-gray-400">
      <div
        className={` tab border border-gray-300 p-2 cursor-pointer flex-1  ${
          activeType === "goods" ? "bg-blue-600 text-white " : ""
        }`}
        onClick={() => handleTypeChange("goods")}
      >
        <div className="font-bold text-center">{t("posts.goods")}</div>
      </div>
      <div
        className={` tab border border-gray-300 p-2 cursor-pointer flex-1 ${
          activeType === "freelancer" ? "bg-blue-600 text-white" : ""
        }`}
        onClick={() => handleTypeChange("freelancer")}
      >
        <div className="font-bold text-center text-nowrap">{t("posts.freelancer")}</div>
      </div>
      <div
          className={`tab  border border-gray-300 p-2 cursor-pointer flex-1 ${
          activeType === "ailive" ? "bg-blue-600 text-white" : ""
        }`}
        onClick={() => handleTypeChange("ailive")}
      >
        <div className="font-bold text-center">{t("posts.aiLive")}</div>
      </div>
    </div>
  );
}
