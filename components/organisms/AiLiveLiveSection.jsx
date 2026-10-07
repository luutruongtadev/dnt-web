"use client";
import React, { useState } from "react"
import PropTypes from "prop-types"
import TwoLineUnitInput from "../atoms/TwoLineUnitInput"

export default function AiLiveLiveSection({ t, allowAdLive, onAllowAdLiveChange, liveName, onLiveNameChange, liveTimeStartHour, onLiveTimeStartHourChange, liveTimeEndHour, onLiveTimeEndHourChange, onLiveAdFileChange }) {
  const [allowAdLiveHome, setAllowAdLiveHome] = useState(false)
  return (
    <div className="text-black text-sm mt-1 new-ailive-post-page">
      <div className="bg-green-100 p-4">
        <span className="sr-only">* {t("aiLive.expectedAiringTime")}</span>
        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-1/2 px-2">
            <span className="sr-only">{t("aiLive.from")}</span>
            <div className="flex space-x-2 mb-2">
              <div className="relative w-full">
                {!liveTimeStartHour && <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-400">{t("aiLive.from")}</span>}
                <input type="datetime-local" value={liveTimeStartHour || ""} onChange={onLiveTimeStartHourChange} className="w-full border rounded px-2 py-1 pl-24" />
              </div>
            </div>
          </div>
          <div className="w-1/2 px-2">
            <span className="sr-only">{t("aiLive.to")}</span>
            <div className="flex space-x-2 mb-2">
              <div className="relative w-full">
                {!liveTimeEndHour && <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-400">{t("aiLive.to")}</span>}
                <input type="datetime-local" value={liveTimeEndHour || ""} onChange={onLiveTimeEndHourChange} className="w-full border rounded px-2 py-1 pl-24" />
              </div>
            </div>
          </div>
        </div>
        <input type="text" value={liveName} onChange={onLiveNameChange} className="w-full border rounded px-2 py-1 mt-1" placeholder={t("aiLive.name")} />
      </div>
      <div className="bg-green-100 p-4 pt-0">
        <span className="sr-only">* {t("aiLive.productOwnership")}</span>
        <div className="relative w-full border p-1 rounded">
          <label htmlFor="liveLicense" className="inset-y-0 left-2 flex items-center text-gray-400 cursor-pointer ">{t("aiLiveMovie.license")}</label>
          <input type="file" id="liveLicense" className="hidden" />
        </div>
      </div>

      <div className="bg-green-100 p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="items-center col-span-1 grid grid-cols-4 ">
            <div className="p-1 col-span-1 border">{t("aiLive.pricewatchlive")}</div>
            <div className="col-span-3 border-t border-b border-r flex items-center">
              <input type="number" min="0" className="p-1 text-right w-full focus:outline-none" />
              <span className="px-2 text-gray-500">
                {(() => {
                  const unitStr = t("aiLive.unit");
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
        </div>
      </div>
      <div className="bg-green-100 p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid grid-cols-4 items-center">
            <div className="p-1 col-span-1 border text-gray-600">{t("aiLive.pricemess")}</div>
            <div className="col-span-3 border-t border-b border-r flex items-center">
              <input
                type="number"
                min="0"
                className="p-1 text-right w-[70%] focus:outline-none"
              />
              <span className="px-2 text-gray-500">
                {(() => {
                  const unitStr = t("aiLive.unitMess");
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
          <div className="grid grid-cols-4 items-center">
            <div
            dangerouslySetInnerHTML={{ __html: t("aiLive.pricemessVip") }} className="p-1 col-span-1 border text-gray-600"></div>
            <div className="col-span-3 border-t border-b border-r  flex items-center">
              <input
                type="number"
                min="0"
                className="p-1 text-right w-[70%] focus:outline-none"
              />
              <span className="px-2 text-gray-500">
                {(() => {
                  const unitStr = t("aiLive.unitMess");
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
        </div>
      </div>

      <div className="bg-green-100 p-4 space-y-4">
        <label className="inline-flex items-center">
          <input type="checkbox" className="mr-2" checked={allowAdLive} onChange={(e) => onAllowAdLiveChange(e.target.checked)} />
          {t("ailivelive.allowAdvertisingOnLive")}
        </label>
        {allowAdLive && (
          <>
            <div className="flex items-center border rounded">
              <input type="number" className="flex-1 px-2 py-1 border-none outline-none bg-transparent" placeholder={t("aiLive.showAd")} />
              <div className="border-l border-gray-300">
                {(() => {
                    const unitStr = t("ailivelive.priceforadUnit");
                    const m = unitStr.match(/^\s*(VND|VNĐ)\s*(.*)$/i);
                    return m ? (
                      <div className="flex items-center px-1">
                        <div className="w-12">
                          <TwoLineUnitInput isInput={false} />
                        </div>
                        <span className="ml-1 text-gray-500 whitespace-nowrap">{m[2]}</span>
                      </div>
                    ) : (
                      <span className="px-2 text-gray-500">{unitStr}</span>
                    );
                  })()}
              </div>
            </div>
          </>
        )}
        
      </div>
      
      <div className="bg-green-100 p-4 pt-0">
        <div className="flex flex-wrap -mx-2">
          <div className="w-1/3 px-2 flex items-center">
            <input type="checkbox" value={allowAdLiveHome} onChange={(e) => setAllowAdLiveHome(!allowAdLiveHome)} className="mr-2" />
            <span className="">{t("ailivelive.advertisingOnMainpage")}</span>
          </div>
          <div className="w-2/3 px-2">
            {allowAdLiveHome && (<>
              <div className="mb-4 flex items-center border rounded">
                <input type="number" className="flex-1 px-2 py-1 border-none outline-none bg-transparent" placeholder={t("ailivelive.priceforad")} />
                <div className="border-l border-gray-300">
                  <TwoLineUnitInput isInput={false} />
                </div>
              </div>
              <div className="mb-4 flex items-center border rounded">
                <input type="number" className="flex-1 px-2 py-1 border-none outline-none bg-transparent" />
                <div className="flex items-center border-l border-gray-300">
                  {(() => {
                    const unitStr = t("ailivelive.priceforadUnit");
                    const m = unitStr.match(/^\s*(VND|VNĐ)\s*(.*)$/i);
                    return m ? (
                      <div className="flex items-center px-1">
                        <div className="w-12">
                          <TwoLineUnitInput isInput={false} />
                        </div>
                        <span className="ml-1 text-gray-500 whitespace-nowrap">{m[2]}</span>
                      </div>
                    ) : (
                      <span className="px-2 text-gray-500">{unitStr}</span>
                    );
                  })()}
                </div>
              </div>
            <div>
              <span className="sr-only">{t("aiLive.adContent")}</span>
              <div className="relative w-full border p-1">
                <label htmlFor="liveAdFile" className="text-gray-400 cursor-pointer p-1 w-full">{t("ailivelive.adContent")}</label>
                <input type="file" id="liveAdFile" hidden className="w-full border rounded px-2 py-1 bg-transparent pl-16" onChange={onLiveAdFileChange} />
              </div>
            </div>
            </>)}
          </div>
        </div>
      </div>

      <div className="bg-green-100 p-4 pt-0">
          <input type="checkbox" className="" />
          <span className="ml-2">{t("aiLive.confirmCopyright")}</span>
        </div>
    </div>
  )
}

AiLiveLiveSection.propTypes = {
  t: PropTypes.func.isRequired,
  allowAdLive: PropTypes.bool.isRequired,
  onAllowAdLiveChange: PropTypes.func.isRequired,
  liveName: PropTypes.string,
  onLiveNameChange: PropTypes.func.isRequired,
  liveTimeStartHour: PropTypes.string,
  onLiveTimeStartHourChange: PropTypes.func.isRequired,
  liveTimeEndHour: PropTypes.string,
  onLiveTimeEndHourChange: PropTypes.func.isRequired,
  onLiveAdFileChange: PropTypes.func.isRequired,
}