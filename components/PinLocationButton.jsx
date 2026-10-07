"use client";
import React from "react";
import { useTranslation } from "react-i18next";

const PinLocationButton = ({ onClick, className = "", children }) => {
  const { t } = useTranslation();
  const label = children ?? t("common.pinLocation", "GHIM VỊ TRÍ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ml-2 border px-3 py-1 rounded whitespace-nowrap hover:bg-gray-100 ${className}`.trim()}
    >
      {label}
    </button>
  );
};

export default PinLocationButton;

