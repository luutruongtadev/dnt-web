"use client";
import React from "react"
import { useNavigate } from '@/lib/router-compat'
import { useTranslation } from "react-i18next"
import { Home as HomeIcon, KeyboardIcon as KeyboardIcon } from "lucide-react"
import PostTypeMenu from "../components/PostTypeMenu"
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker.jsx"
import GoodsAccount from "../components/GoodsAccount.jsx"
import usePersistentColor from "../hooks/usePersistentColor"
import useAiLivePost from "../hooks/useAiLivePost"
import AiLiveTabs from "../components/molecules/AiLiveTabs"
import AiLiveVideoSection from "../components/organisms/AiLiveVideoSection"
import AiLiveMovieSection from "../components/organisms/AiLiveMovieSection"
import AiLiveLiveSection from "../components/organisms/AiLiveLiveSection"

export default function NewAiLivePostAtomic() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { color, onColorChange } = usePersistentColor()
  const {
    activeTab,
    setActiveTab,
    setVideoFile,
    setMovieFile,
    setLiveAdFile,
    liveTimeStartHour,
    setLiveTimeStartHour,
    liveTimeEndHour,
    setLiveTimeEndHour,
    videoName,
    setVideoName,
    movieName,
    setMovieName,
    liveName,
    setLiveName,
    allowAdVideo,
    setAllowAdVideo,
    allowAdMovie,
    setAllowAdMovie,
    allowAdLive,
    setAllowAdLive,
  } = useAiLivePost()

  return (
    <div className="flex justify-center items-center new-ailive-post-page">
      <div className="bg-transparent backdrop-blur-md p-1 rounded-lg w-full mx-auto">
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={onColorChange}
          titlePrefix="4"
          leftButton={<button className="text-red-600 hover:text-red-800 relative" onClick={() => navigate("/")}><HomeIcon size={28} /></button>}
          rightButton={<button className="text-red-600 hover:text-red-800" onClick={() => navigate("/admin-control")}><KeyboardIcon size={28} /></button>}
          title={t("aiLive.newPost")}
        />
        <div className="">
          <PostTypeMenu activeType="ailive" />
        </div>
        <GoodsAccount title={t("aiLive.accountOfAiLive")} onTransfer={{}} />
        <AiLiveTabs t={t} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "video" && (
          <AiLiveVideoSection t={t} allowAdVideo={allowAdVideo} onAllowAdVideoChange={setAllowAdVideo} videoName={videoName} onVideoNameChange={(e) => setVideoName(e.target.value)} onVideoFileChange={(e) => setVideoFile(e.target.files[0])} />
        )}
        {activeTab === "movie" && (
          <AiLiveMovieSection t={t} allowAdMovie={allowAdMovie} onAllowAdMovieChange={setAllowAdMovie} movieName={movieName} onMovieNameChange={(e) => setMovieName(e.target.value)} onMovieFileChange={(e) => setMovieFile(e.target.files?.[0] || null)} />
        )}
        {activeTab === "live" && (
          <AiLiveLiveSection t={t} allowAdLive={allowAdLive} onAllowAdLiveChange={setAllowAdLive} liveName={liveName} onLiveNameChange={(e) => setLiveName(e.target.value)} liveTimeStartHour={liveTimeStartHour} onLiveTimeStartHourChange={(e) => setLiveTimeStartHour(e.target.value)} liveTimeEndHour={liveTimeEndHour} onLiveTimeEndHourChange={(e) => setLiveTimeEndHour(e.target.value)} onLiveAdFileChange={(e) => setLiveAdFile(e.target.files?.[0] || null)} />
        )}
        <div className="border border-black p-2 bg-white flex justify-center">
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" className="text-red-500" />
            <span>{t("aiLive.termsAgreement")}</span>
          </label>
        </div>
        <div className="flex justify-center mt-3">
          <button type="submit" className="px-8 border py-3 font-bold rounded hover:bg-gray-100 transition-all cursor-pointer">{t("aiLive.post")}</button>
        </div>
      </div>
    </div>
  )
}