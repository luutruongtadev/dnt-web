"use client";
import React from "react"
import PropTypes from "prop-types"
import TwoLineUnitInput from "../atoms/TwoLineUnitInput"

export default function AiLiveMovieSection({ t, allowAdMovie, onAllowAdMovieChange, movieName, onMovieNameChange, onMovieFileChange }) {
  return (
    <div className="text-black text-sm mt-1 new-ailive-post-page">
      <div className="bg-cyan-100 p-4 pt-0">
        <span className="sr-only">* {t("aiLive.uploadMovie")}</span>
        <div className="w-full border p-1 rounded">
          <label htmlFor="movieFile" className="cursor-pointer inset-y-0 left-2 flex items-center text-gray-400 ">{t("aiLiveMovie.uploadMovie")}</label>
          <input type="file" id="movieFile" className="hidden" onChange={onMovieFileChange} />
        </div>
        <input type="text" value={movieName} onChange={onMovieNameChange} className="w-full border rounded p-1 mt-4" placeholder={t("aiLiveMovie.movieName")} />
      </div>
      <div className="bg-cyan-100 p-4 pt-0">
        <span className="sr-only">* {t("aiLive.productOwnership")}</span>
        <div className="relative w-full border p-1 rounded">
          <label htmlFor="movieFile2" className="inset-y-0 left-2 flex items-center text-gray-400 cursor-pointer "><span className="text-red-500">*</span>{t("aiLiveMovie.license")}</label>
          <input type="file" id="movieFile2" className="hidden" onChange={onMovieFileChange} />
        </div>
      </div>
      <div className="bg-cyan-100 p-4 pt-0 border-gray-300 grid grid-cols-9">
        <div className=" col-span-1 text-gray-500 border p-1 flex items-center justify-start">{t("aiLiveMovie.watchPrice")}</div>
        <input type="number" className="col-span-3 w-full border-t border-b text-right" placeholder="" />
        <span className="col-span-5 text-gray-500 border pl-1 flex items-center justify-start">
          {(() => {
            const unitStr = t("aiLiveMovie.unitwatch");
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
      <div className="bg-cyan-100 p-4 pt-0 pb-0">
        <label className="inline-flex items-center mb-2">
          <input type="checkbox" className="mr-2" checked={allowAdMovie} onChange={(e) => onAllowAdMovieChange(e.target.checked)} />
          {t("aiLiveMovie.adOnHomePage")}
        </label>
      </div>
      {allowAdMovie && (
        <>
          <div className="bg-cyan-100 p-4 pt-0">
            <span className="sr-only">{t("aiLive.advertisingOnMainpage")}</span>
            <input type="number" className="w-full border px-2 py-1" placeholder={t("aiLiveMovie.amount")} />
          </div>
          <div className="bg-cyan-100 p-4 pt-0 grid grid-cols-10">
            <div className="bg-cyan-100 pt-0 col-span-5 border-gray-300 grid grid-cols-10">
              <div className="col-span-2 border pl-1 flex items-center justify-start">{t("aiLiveMovie.unitad")}</div>
              <input type="number" className="col-span-4 p-1 w-full border-t border-b text-right flex items-center justify-end" placeholder="" />
              <span className="col-span-3 text-gray-500 border pl-1 flex items-center justify-start">
                {(() => {
                  const unitStr = t("aiLiveMovie.watchPricead");
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
            <div className="bg-cyan-100 pt-0 col-span-5 border-gray-300 grid grid-cols-10">
              <label htmlFor="contentad" className="col-span-10 border pl-1 flex items-center justify-center cursor-pointer">{t("aiLiveMovie.contentad")}</label>
              <input type="file" name="contentad" id="contentad" hidden />
            </div>
          </div>
        </>
      )}
      <div className="bg-cyan-100 p-4" />
    </div>
  )
}

AiLiveMovieSection.propTypes = {
  t: PropTypes.func.isRequired,
  allowAdMovie: PropTypes.bool.isRequired,
  onAllowAdMovieChange: PropTypes.func.isRequired,
  movieName: PropTypes.string,
  onMovieNameChange: PropTypes.func.isRequired,
  onMovieFileChange: PropTypes.func.isRequired,
}