"use client";
import React from "react"
import PropTypes from "prop-types"

export default function AiLiveTabs({ t, activeTab, onChange }) {
  return (
    <div className="grid grid-cols-3 text-center mt-4">
      <div className={`p-3 font-bold cursor-pointer ${activeTab === "video" ? "bg-blue-600 text-white" : "bg-blue-100 text-black"}`} onClick={() => onChange("video")}>{t("aiLive.video")}</div>
      <div className={`p-3 font-bold cursor-pointer ${activeTab === "movie" ? "bg-blue-600 text-white" : "bg-blue-100 text-black"}`} onClick={() => onChange("movie")}>{t("aiLive.movie")}</div>
      <div className={`p-3 font-bold cursor-pointer ${activeTab === "live" ? "bg-blue-600 text-white" : "bg-blue-100 text-black"}`} onClick={() => onChange("live")}>{t("aiLive.live")}</div>
    </div>
  )
}

AiLiveTabs.propTypes = {
  t: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}