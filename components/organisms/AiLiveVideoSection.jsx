"use client";
import React from "react"
import PropTypes from "prop-types"
import TwoLineUnitInput from "../atoms/TwoLineUnitInput"

export default function AiLiveVideoSection({ t, allowAdVideo, onAllowAdVideoChange, videoName, onVideoNameChange, onVideoFileChange }) {
  return (
    <div className="text-black text-sm mt-1 new-ailive-post-page">
      <div className="bg-blue-100 p-2">
        <span className="sr-only">* {t("aiLive.uploadVideo")}</span>
        <div className="flex items-center">
          <div className="relative w-full border rounded">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-400">{t("aiLive.choose")}</span>
            <input type="file" onChange={onVideoFileChange} className="w-full p-1 border-gray-300 rounded bg-transparent pl-70 text-right" />
          </div>
        </div>
        <input type="text" value={videoName} onChange={onVideoNameChange} className="w-full border rounded px-2 py-1 mt-1" placeholder={t("aiLiveVideo.videoName")} />
        <select className="w-full border rounded p-1 mt-1">
          <option value="">
            -- {t("aiLive.saveLocation")} --
          </option>
          <option>{t("aiLive.introduceYourself")}</option>
          <option>{t("aiLive.economySociety")}</option>
          <option>{t("aiLive.sport")}</option>
          <option>{t("aiLive.entertainment")}</option>
          <option>{t("aiLive.creative")}</option>
          <option>{t("aiLive.campaignsEvents")}</option>
          <option>{t("aiLive.children")}</option>
          <option>{t("aiLive.memory")}</option>
          <option>{t("aiLive.lifeExperience")}</option>
          <option>{t("aiLive.startupIdeas")}</option>
        </select>
        <label className="inline-flex items-center mt-1">
          <input type="checkbox" className="mr-2" checked={allowAdVideo} onChange={(e) => onAllowAdVideoChange(e.target.checked)} />
          <span>{t("aiLive.allowAdvertising")}</span>
        </label>
        {allowAdVideo ? (
          <div className="flex flex-wrap mx-2 justify-between">
            <div className=" flex-1 flex justify-start items-center border border-gray-300 rounded w-1/3 m-2">
              <span className="flex-1 text-gray-500 border-r">{t("aiLiveVideo.showAd")}</span>
              <input type="number" className="flex-1 px-2 py-1 text-right" />
              <span className="flex-1 text-gray-500 border-l pl-1">
                {(() => {
                  const unitStr = t("aiLiveVideo.seconds");
                  const m = unitStr.match(/^\s*(VND|VNĐ)\s*(.*)$/i);
                  return m ? (
                    <div className="flex items-center">
                      <div className="w-10">
                        <TwoLineUnitInput isInput={false} />
                      </div>
                      <span className="ml-1">{m[2]}</span>
                    </div>
                  ) : unitStr;
                })()}
              </span>
            </div>
            <div className="flex-1 flex justify-start items-center border border-gray-300 rounded w-1/3 m-2">
              <span className="flex-1 text-gray-500 border-r">{t("aiLiveVideo.insertAd")}</span>
              <input type="number" className="flex-1 px-2 py-1 text-right" />
              <span className="flex-1 text-gray-500 border-l pl-1">
                {(() => {
                  const unitStr = t("aiLiveVideo.seconds");
                  const m = unitStr.match(/^\s*(VND|VNĐ)\s*(.*)$/i);
                  return m ? (
                    <div className="flex items-center">
                      <div className="w-10">
                        <TwoLineUnitInput isInput={false} />
                      </div>
                      <span className="ml-1">{m[2]}</span>
                    </div>
                  ) : unitStr;
                })()}
              </span>
            </div>
          </div>
        ) : null}
        <div className="">
          <label className="inline-flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>{t("aiLive.confirmCopyright")}</span>
          </label>
        </div>
      </div>
    </div>
  )
}

AiLiveVideoSection.propTypes = {
  t: PropTypes.func.isRequired,
  allowAdVideo: PropTypes.bool.isRequired,
  onAllowAdVideoChange: PropTypes.func.isRequired,
  videoName: PropTypes.string,
  onVideoNameChange: PropTypes.func.isRequired,
  onVideoFileChange: PropTypes.func.isRequired,
}