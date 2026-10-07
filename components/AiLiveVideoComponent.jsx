"use client";
import { useState, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from '@/lib/router-compat'
import {
  Users,
  X,
  ChevronRight,
  Bookmark,
  Flag,
  FileWarning,
  Trash2,
  Play,
  SearchIcon,
  Mic,
  FlagOff,
  Save,
  Package
} from "lucide-react"
import AiLiveVideoList from "./AiLiveVideoList.jsx"




export default function AiLiveVideoComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [followedByCount] = useState(123456)
  const [followedUsers, setFollowedUsers] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)
  const [activeStreamIndex, setActiveStreamIndex] = useState(0)
  const swipeStartY = useRef(null)

  const [productFolders, setProductFolders] = useState([])
  const [openFolderId, setOpenFolderId] = useState(null)
  const [completedFolders, setCompletedFolders] = useState([])
  const [violations, setViolations] = useState([])
  const [reports, setReports] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const [streams, setStreams] = useState([])
  const [isExpend, setIsExpend] = useState(false)
  const categories = [
    ["THƯƠNG HIỆU CÁ NHÂN", "Personal Brand"],
    ["KINH TẾ & XÃ HỘI", "Economy & Society"],
    ["THỂ THAO", "Sport"],
    ["GIẢI TRÍ", "Entertainment"],
    ["SÁNG TẠO", "Creative"],
    ["CHIẾN DỊCH & SỰ KIỆN", "Campaigns & Events"],
    ["THIẾU NHI", "Children"],
    ["LƯU NIỆM", "Memory"],
    ["KINH NGHIỆM SỐNG", "Life experience"],
    ["Ý TƯỞNG KHỞI NGHIỆP", "Start up ideas"],
    ["KHÁC", "Other"]
  ]
  const [openPackageCategory, setOpenPackageCategory] = useState(null)
  const [openProductsCategory, setOpenProductsCategory] = useState(null)
  const [openCompletedCategory, setOpenCompletedCategory] = useState(null)
  const [openViolationsCategory, setOpenViolationsCategory] = useState(null)
  const [openReportsCategory, setOpenReportsCategory] = useState(null)
  useEffect(() => {
    setOpenPackageCategory(null)
    setOpenProductsCategory(null)
    setOpenCompletedCategory(null)
    setOpenViolationsCategory(null)
    setOpenReportsCategory(null)
    setOpenFolderId(null)
  }, [activeSection])
  useEffect(() => {
    const now = Date.now()
    const makeStreams = (u) => (
      Array.from({ length: u }, (_, i) => ({
        id: Number(`${u}${i}${i + 1}`),
        isGoods: false,
        viewers: 123456,
        title: `${t("aiLiveVideo.video", "VIDEO")} ${i + 1}`,
        productId: `PRD-${String(i + 1).padStart(3, "0")}`,
        startedAt: new Date(now - i * 3600_000).toISOString(),
      }))
    )

    setStreams(makeStreams(12))

    setFollowedUsers([
      { id: 1, name: "A", avatar: "https://i.pravatar.cc/100?u=1", streams: makeStreams(3) },
      { id: 2, name: "B", avatar: "https://i.pravatar.cc/100?u=2", streams: makeStreams(1) },
      { id: 3, name: "C", avatar: "https://i.pravatar.cc/100?u=3", streams: makeStreams(2) },
      { id: 4, name: "D", avatar: "https://i.pravatar.cc/100?u=4", streams: makeStreams(5) },
      { id: 5, name: "E", avatar: "https://i.pravatar.cc/100?u=5", streams: makeStreams(0) },
    ])

    setProductFolders([
      {
        id: "PRD-101",
        name: "Tên hàng hóa – ID hàng hóa 1",
        registeredAt: now - 86_400_000 * 2,
        videos: [
          { id: 1001, title: "VIDEO LIVESTREAM 1" },
          { id: 1002, title: "VIDEO LIVESTREAM 2" },
        ],
      },
      {
        id: "PRD-102",
        name: "Tên hàng hóa – ID hàng hóa 2",
        registeredAt: now - 86_400_000,
        videos: [
          { id: 2001, title: "VIDEO LIVESTREAM 1" },
        ],
      },
    ])

    setCompletedFolders([
      {
        id: "PRD-090",
        name: "Đã hoàn thành – ID 90",
        movedAt: now - 86_400_000 * 4,
        videos: [{ id: 9001, title: "VIDEO LIVESTREAM 1" }],
      },
    ])

    setViolations([
      { id: "PRD-777", note: "Nội dung vi phạm mục 3", videos: [{ id: 77701, title: "Video" }] },
    ])
    setReports([
      { id: "PRD-888", note: "Báo cáo spam tại phút 1:23", videos: [{ id: 88801, title: "Video" }] },
    ])
  }, [t])

  const sortedFollowed = useMemo(() => {
    return [...followedUsers].sort((a, b) => {
      const ca = a.streams.length
      const cb = b.streams.length
      if (cb !== ca) return cb - ca
      const la = a.streams[0]?.startedAt ? new Date(a.streams[0].startedAt).getTime() : 0
      const lb = b.streams[0]?.startedAt ? new Date(b.streams[0].startedAt).getTime() : 0
      return lb - la
    })
  }, [followedUsers])

  const activeUser = useMemo(() => sortedFollowed.find(u => u.id === activeUserId) || null, [sortedFollowed, activeUserId])
  const activeStream = useMemo(() => activeUser?.streams?.[activeStreamIndex] || null, [activeUser, activeStreamIndex])

  useEffect(() => {
    const now = Date.now()
    setCompletedFolders(prev => prev.filter(f => now - f.movedAt < 86_400_000 * 3))
  }, [])

  const handleUnfollow = (id) => {
    setFollowedUsers(prev => prev.filter(u => u.id !== id))
    if (activeUserId === id) {
      setActiveUserId(null)
      setActiveStreamIndex(0)
    }
  }

  const openStream = (streamId) => {
    navigate(`/ai-live/video/${streamId}`)
  }

  const confirmAndOpen = (videoId) => {
    navigate(`/ai-live/video/${videoId}`)
  }

  const onTouchStart = (e) => {
    swipeStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e) => {
    if (swipeStartY.current == null) return
    const dy = swipeStartY.current - e.changedTouches[0].clientY
    if (Math.abs(dy) > 30 && activeUser) {
      setActiveStreamIndex(prev => {
        const next = dy > 0 ? prev + 1 : prev - 1
        const total = activeUser.streams.length
        if (next < 0) return 0
        if (next >= total) return total - 1
        return next
      })
    }
    swipeStartY.current = null
  }

  const sortedFolders = useMemo(() => {
    return [...productFolders].sort((a, b) => a.registeredAt - b.registeredAt)
  }, [productFolders])

  const moveFolderToCompleted = (id) => {
    const f = productFolders.find(x => x.id === id)
    if (!f) return
    setProductFolders(prev => prev.filter(x => x.id !== id))
    setCompletedFolders(prev => [{ ...f, movedAt: Date.now() }, ...prev])
    if (openFolderId === id) setOpenFolderId(null)
  }

  const deleteCompleted = (id) => {
    setCompletedFolders(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="">
      <div className="mt-1 border-1 border-gray-300">
        <div className="flex items-center">
          <SearchIcon size={24} className="text-gray-400" />
          <Mic size={24} className="text-gray-400 hover:text-gray-600" />
          <input
            type="text"
            // placeholder={t('goods.searchPlaceholder')} 
            className="flex-1 p-2 rounded"
          />
        </div>
      </div>


      <div className="flex border border-black text-xs text-center overflow-x-auto">
        {categories.map(([vi, en], index) => (
          <div
            key={index}
            className="border min-w-[300px] border-black p-2 hover:bg-yellow-100 cursor-pointer"
          >
            <div className="font-bold">{vi}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-10">
        <div onClick={() => setIsExpend(!isExpend)} className=" col-span-1 flex items-start justify-start gap-2">
          <div className="w-full flex  items-end gap-1">
            <img
              src={activeUser?.avatar}
              className="w-12 h-12 ring-2 ring-blue-500"
            />
            2342958
          </div>
        </div>

        <div className={`col-span-9 flex justify-between ${isExpend ? 'block' : 'hidden'}`} >
          <div className=" rounded-lg p-3">
            <button className={`border p-2 relative ${activeSection === 'follow' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'follow' ? null : 'follow')}>
              <Users className="w-5 h-5" />
              <span style={{ right: '-40px' }} className="absolute text-right top-0 text-xs bg-red-500 text-white px-1 rounded-full">24958</span>
            </button>
          </div>

          <div className=" rounded-lg p-3">
            <button className={`border p-2 ${activeSection === 'package' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'package' ? null : 'package')}>
              <Package className="w-5 h-5" />
            </button>
          </div>

          <div className=" rounded-lg p-3">
            <button className={`border p-2 ${activeSection === 'products' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'products' ? null : 'products')}>
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          <div className=" rounded-lg p-3">
            <button className={`border p-2 ${activeSection === 'completed' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'completed' ? null : 'completed')}>
              <Save className="w-5 h-5" />
            </button>
          </div>

          <div className=" rounded-lg p-3">
            <button className={`border p-2 ${activeSection === 'violations' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'violations' ? null : 'violations')}>
              <FlagOff className="w-5 h-5" />
            </button>
          </div>

          <div className=" rounded-lg p-3">
            <button className={`border p-2 ${activeSection === 'reports' ? 'bg-gray-100 border-gray-400' : ''}`} onClick={() => setActiveSection(prev => prev === 'reports' ? null : 'reports')}>
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {activeSection === 'follow' && (
        <div className="mt-3">
          <div className="flex border items-center gap-3 text-gray-800">
            <span className="font-semibold">{followedByCount} người theo dõi mình</span>
          </div>
          <div className="text-sm text-gray-600 mb-2 mt-2">98765 theo dõi ai</div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {sortedFollowed.map(u => (
              <div key={u.id} className="relative flex-shrink-0">
                <img
                  src={u.avatar}
                  alt="avatar"
                  className={`w-12 h-12 rounded-full ring-2 ${activeUserId === u.id ? "ring-blue-500" : "ring-gray-300"}`}
                  onClick={() => { setActiveUserId(u.id); setActiveStreamIndex(0) }}
                />
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                  onClick={() => handleUnfollow(u.id)}
                  aria-label="Xóa"
                >
                  <X className="w-3 h-3" />
                </button>
                {u.streams.length > 0 && (
                  <div className="absolute -top-2 left-1 text-xs bg-gray-800 text-white px-1 rounded">
                    {u.streams.length}
                  </div>
                )}
              </div>
            ))}
          </div>
          {activeUser && (
            <div
              className="mt-3 border rounded p-3"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{activeUser.name}</div>
                <div className="text-xs text-gray-500">{activeUser.streams.length} livestream</div>
              </div>
              <div className="mt-2">
                {activeStream && (
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 border rounded hover:bg-gray-50"
                    onClick={() => openStream(activeStream.id)}
                  >
                    <span>{activeStream.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span>Gạt lên để đến livestream tiếp theo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'package' && (
        <div className="mt-3">
          <div className="space-y-2">
            {categories.map(([vi, en], idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenPackageCategory(prev => prev === idx ? null : idx)}>
                    <span>• {vi}</span>
                    <ChevronRight className={`w-4 h-4 ${openPackageCategory === idx ? "rotate-90" : ""}`} />
                  </button>
                </div>
                {openPackageCategory === idx && (
                  <div className="pl-6 mt-1 space-y-1">
                    {sortedFolders.map(f => (
                      <div key={f.id}>
                        <div className="flex items-center justify-between">
                          <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenFolderId(prev => prev === f.id ? null : f.id)}>
                            <span>• {f.name}</span>
                            <ChevronRight className={`w-4 h-4 ${openFolderId === f.id ? "rotate-90" : ""}`} />
                          </button>
                          <button className="text-xs text-blue-600" onClick={() => moveFolderToCompleted(f.id)}>Chuyển sang Hoàn thành</button>
                        </div>
                        {openFolderId === f.id && (
                          <div className="pl-6 mt-1 space-y-1">
                            {f.videos.map(v => (
                              <div key={v.id} className="flex items-center justify-between">
                                <span className="text-sm">{v.title}</span>
                                <button className="flex items-center gap-1 text-blue-600 text-sm" onClick={() => confirmAndOpen(v.id)}>
                                  <Play className="w-4 h-4" /> Phát
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'products' && (
        <div className="mt-3">
          <div className="space-y-2">
            {categories.map(([vi, en], idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenProductsCategory(prev => prev === idx ? null : idx)}>
                    <span>• {vi}</span>
                    <ChevronRight className={`w-4 h-4 ${openProductsCategory === idx ? "rotate-90" : ""}`} />
                  </button>
                </div>
                {openProductsCategory === idx && (
                  <div className="pl-6 mt-1 space-y-1">
                    {sortedFolders.map(f => (
                      <div key={f.id}>
                        <div className="flex items-center justify-between">
                          <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenFolderId(prev => prev === f.id ? null : f.id)}>
                            <span>• {f.name}</span>
                            <ChevronRight className={`w-4 h-4 ${openFolderId === f.id ? "rotate-90" : ""}`} />
                          </button>
                          <button className="text-xs text-blue-600" onClick={() => moveFolderToCompleted(f.id)}>Chuyển sang Hoàn thành</button>
                        </div>
                        {openFolderId === f.id && (
                          <div className="pl-6 mt-1 space-y-1">
                            {f.videos.map(v => (
                              <div key={v.id} className="flex items-center justify-between">
                                <span className="text-sm">{v.title}</span>
                                <button className="flex items-center gap-1 text-blue-600 text-sm" onClick={() => confirmAndOpen(v.id)}>
                                  <Play className="w-4 h-4" /> Phát
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'completed' && (
        <div className="mt-3">
          <div className="space-y-2">
            {categories.map(([vi, en], idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenCompletedCategory(prev => prev === idx ? null : idx)}>
                    <span>• {vi}</span>
                    <ChevronRight className={`w-4 h-4 ${openCompletedCategory === idx ? "rotate-90" : ""}`} />
                  </button>
                </div>
                {openCompletedCategory === idx && (
                  <div className="pl-6 mt-1 space-y-1">
                    {completedFolders.map(f => (
                      <div key={f.id} className="flex items-center justify-between">
                        <span>• {f.name}</span>
                        <button className="flex items-center gap-1 text-red-600 text-sm" onClick={() => deleteCompleted(f.id)}>
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </div>
                    ))}
                    {completedFolders.length === 0 && (
                      <div className="text-sm text-gray-500">Rỗng</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'violations' && (
        <div className="mt-3">
          <div className="space-y-2">
            {categories.map(([vi, en], idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenViolationsCategory(prev => prev === idx ? null : idx)}>
                    <span>• {vi}</span>
                    <ChevronRight className={`w-4 h-4 ${openViolationsCategory === idx ? "rotate-90" : ""}`} />
                  </button>
                </div>
                {openViolationsCategory === idx && (
                  <div className="pl-6 mt-1 space-y-1">
                    {violations.map(v => (
                      <div key={v.id}>
                        <div className="flex items-center justify-between">
                          <span>• {v.id}</span>
                          <span className="text-xs text-gray-500">{v.note}</span>
                        </div>
                      </div>
                    ))}
                    {violations.length === 0 && (
                      <div className="text-sm text-gray-500">Rỗng</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'reports' && (
        <div className="mt-3">
          <div className="space-y-2">
            {categories.map(([vi, en], idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenReportsCategory(prev => prev === idx ? null : idx)}>
                    <span>• {vi}</span>
                    <ChevronRight className={`w-4 h-4 ${openReportsCategory === idx ? "rotate-90" : ""}`} />
                  </button>
                </div>
                {openReportsCategory === idx && (
                  <div className="pl-6 mt-1 space-y-1">
                    {reports.map(v => (
                      <div key={v.id}>
                        <div className="flex items-center justify-between">
                          <span>• {v.id}</span>
                          <span className="text-xs text-gray-500">{v.note}</span>
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <div className="text-sm text-gray-500">Rỗng</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AiLiveVideoList videos={streams.filter(v => !v.isGoods)} />

    </div>
  )
}
