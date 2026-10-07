"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from '@/lib/router-compat'
import {
    Users,
    X,
    ChevronRight,
    Bookmark,
    Flag,
    Trash2,
    SearchIcon,
    Mic,
    FlagOff,
    Save,
    Package,
    Share2
} from "lucide-react"
import VideoCard from "../molecules/VideoCard.jsx";
import CategorySelect from "../CategorySelect.jsx";
import { getCountries, getCountryByCode } from "../../services/countries";
import { getGoodsVideoFolders } from "../../services/videoService";




export default function AiLiveStreamGoods() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Bộ lọc quốc gia / tỉnh thành để người dùng tìm theo yêu cầu
    const [nation, setNation] = useState({ vi: "Viet Nam", en: "Vietnam" })
    const [province, setProvince] = useState({ vi: "Tất cả", en: "all" })
    const [searchText, setSearchText] = useState("")

    const handleFilterChange = useCallback((title, item) => {
        if (title === "Nation") {
            setNation(item)
            setProvince({ vi: "Tất cả", en: "all" })
        } else if (title === "Province") {
            setProvince(item)
        }
    }, [])

    const [followedUsers, setFollowedUsers] = useState([])
    const [activeUserId, setActiveUserId] = useState(null)
    const [activeStreamIndex, setActiveStreamIndex] = useState(0)
    const swipeStartY = useRef(null)

    const [productFolders, setProductFolders] = useState([])
    const [openFolderId, setOpenFolderId] = useState(null)
    const [completedFolders, setCompletedFolders] = useState([])
    const [sharedFolders, setSharedFolders] = useState([])
    const [violations, setViolations] = useState([])
    const [reports, setReports] = useState([])
    const [activeTab, setActiveTab] = useState(null)
    const [goodsGroups, setGoodsGroups] = useState([])
    const [goodsLoading, setGoodsLoading] = useState(false)
    const [goodsError, setGoodsError] = useState("")
    const [isExpend, setIsExpend] = useState(true)
    const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    // AVT cố định: luôn là tài khoản đang đăng nhập, không đổi theo người mình theo dõi
    const myAvatar = useMemo(() => {
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}")
            return u?.avatar?.url || u?.avatar || ""
        } catch {
            return ""
        }
    }, [])
    // Hiển thị 2-3 hàng ngang (5 video/hàng); bấm "Xem thêm" mới hiện thêm
    const [visibleRows, setVisibleRows] = useState(3)
    const CARDS_PER_ROW = 5
    // Số video livestream đăng mới mà mình chưa xem
    const [unseenCount] = useState(98765)
    useEffect(() => {
        const now = Date.now()
        const makeStreams = (u) => (
            Array.from({ length: u }, (_, i) => ({
                id: Number(`${u}${i}${i + 1}`),
                isGoods: true,
                viewers: 743646,
                saves: 35143,
                shares: 424652,
                hasPlatformLogo: i % 5 === 0,
                title: `${t("aiLiveVideo.video", "VIDEO")} ${i + 1}`,
                productId: `PRD-${String(i + 1).padStart(3, "0")}`,
                startedAt: new Date(now - i * 3600_000).toISOString(),
            }))
        )

        // goodsGroups & productFolders lấy từ dữ liệu thật (xem effect fetchLiveGoods bên dưới)

        setFollowedUsers([
            { id: 1, name: "A", avatar: "https://i.pravatar.cc/100?u=1", streams: makeStreams(3) },
            { id: 2, name: "B", avatar: "https://i.pravatar.cc/100?u=2", streams: makeStreams(1) },
            { id: 3, name: "C", avatar: "https://i.pravatar.cc/100?u=3", streams: makeStreams(2) },
            { id: 4, name: "D", avatar: "https://i.pravatar.cc/100?u=4", streams: makeStreams(5) },
            { id: 5, name: "E", avatar: "https://i.pravatar.cc/100?u=5", streams: makeStreams(0) },
        ])

        const makeFolderVideos = (prefix, n) => Array.from({ length: n }, (_, i) => ({
            id: Number(`${prefix}${i + 1}`),
            title: `VIDEO LIVESTREAM ${i + 1}`,
            name: "Tên hàng hóa",
            productId: "ID",
            viewers: [743646, 632833, 443235, 34567, 1678][i % 5],
            saves: [35143, 28632, 12457, 8765, 543][i % 5],
            shares: [424652, 23223, 12455, 7654, 345][i % 5],
            hasPlatformLogo: i === 0,
            avatar: `https://i.pravatar.cc/60?u=${prefix}${i}`,
        }))

        setCompletedFolders([
            {
                id: "PRD-090",
                name: "Đã hoàn thành – ID 90",
                movedAt: now - 86_400_000 * 4,
                videos: [{ id: 9001, title: "VIDEO LIVESTREAM 1" }],
            },
        ])

        // Thư mục được người khác chia sẻ cho mình
        setSharedFolders([
            {
                id: "PRD-201",
                name: "Được chia sẻ – ID hàng hóa 201",
                sharedBy: "A",
                videos: makeFolderVideos(2010, 2),
            },
        ])

        setViolations([
            { id: "PRD-777", note: "Nội dung vi phạm mục 3", videos: [{ id: 77701, title: "Video" }] },
        ])
        setReports([
            { id: "PRD-888", note: "Báo cáo spam tại phút 1:23", videos: [{ id: 88801, title: "Video" }] },
        ])
    }, [t])

    // Thư mục ID hàng hóa (productFolders) + nhóm video (goodsGroups) lấy từ dữ liệu thật:
    // các sản phẩm có video livestream đã tải lên (hiện luôn, không phụ thuộc phiên live).
    useEffect(() => {
        let cancelled = false
        const handle = setTimeout(async () => {
            setGoodsLoading(true)
            setGoodsError("")
            try {
                const { folders } = await getGoodsVideoFolders(
                    { page: 1, pageSize: 20, search: searchText.trim() },
                    authToken
                )
                const mapped = folders.map((f, idx) => ({
                    id: f.id,
                    name: f.name,
                    registeredAt: idx, // giữ thứ tự trả về từ server sau khi sortedFolders sắp xếp tăng dần
                    videos: f.videos,
                }))
                if (cancelled) return
                setProductFolders(mapped)
                // goodsGroups: chỉ hiển thị các thư mục có video livestream
                setGoodsGroups(mapped.filter((g) => g.videos.length > 0))
            } catch (err) {
                if (!cancelled) {
                    setProductFolders([])
                    setGoodsGroups([])
                    setGoodsError(err.message || "Không tải được danh sách hàng hóa livestream")
                }
            } finally {
                if (!cancelled) setGoodsLoading(false)
            }
        }, searchText ? 350 : 0)

        return () => { cancelled = true; clearTimeout(handle) }
    }, [searchText, authToken])

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

    // Đã xác thực OTP ở VideoCard nên phát thẳng, không hỏi confirm nữa
    const confirmAndOpen = (videoId) => {
        navigate(`/ai-live/video/${videoId}`)
    }

    // Mở video livestream của hàng hóa: điều hướng theo ID sản phẩm (trang detail load product)
    const openGoodsVideo = useCallback((v) => {
        navigate(`/ai-live/video-goods/${v.productId || v.id}`)
    }, [navigate])

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
        <div className="space-y-1 ">
            <div className="mt-1 border-1 border-gray-300">
                <div className="flex items-center gap-2">
                    <SearchIcon size={24} className="text-gray-400" />
                    <Mic size={24} className="text-gray-400 hover:text-gray-600" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setVisibleRows(3) }}
                        // placeholder={t('goods.searchPlaceholder')}
                        className="flex-1 p-2 rounded"
                    />
                    {/* 2 ô lọc để người dùng tìm theo yêu cầu */}
                    <div className="flex items-center gap-2 w-64 shrink-0">
                        <CategorySelect
                            title="Nation"
                            items={[]}
                            onChange={handleFilterChange}
                            value={nation}
                            fetchItems={getCountries}
                            placeholder={{ vi: "Chọn quốc gia", en: "Select country" }}
                            initIndex={1}
                        />
                        <CategorySelect
                            title="Province"
                            items={[]}
                            onChange={handleFilterChange}
                            value={province}
                            fetchItems={getCountryByCode}
                            dependsOn={nation?.en}
                            placeholder={{ vi: "Tất cả", en: "all" }}
                            initIndex={0}
                        />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-12 items-end gap-1">
                {/* Ẩn vào AVT của mình là cuốn hết (thu gọn thanh công cụ) */}
                <div
                    onClick={() => setIsExpend(!isExpend)}
                    className="col-span-2 flex items-center gap-1 cursor-pointer rounded p-1 hover:bg-gray-50"
                >
                    <img
                        src={typeof myAvatar === "string" && myAvatar ? myAvatar : undefined}
                        alt=""
                        className="w-12 h-12 rounded-full ring-1 ring-gray-300 bg-gray-100"
                    />
                    <span className="text-sm">2342958</span>
                </div>
                <div className={`col-span-10 grid grid-cols-7 gap-1 ${isExpend ? 'grid' : 'hidden'}`}>
                    {[
                        { key: 'follow', Icon: Users, top: '2 ID', bottom: `${unseenCount} chưa xem`, danger: true },
                        { key: 'package', Icon: Package, top: '1234 ID', bottom: '12457 video' },
                        { key: 'products', Icon: Bookmark, top: '123 ID', bottom: '8765 video' },
                        { key: 'completed', Icon: Save, top: '234 ID', bottom: '543 video' },
                        { key: 'shared', Icon: Share2, top: '1122 ID', bottom: '345 video' },
                        { key: 'violations', Icon: FlagOff, top: '22 ID', bottom: '5 báo cáo' },
                        { key: 'reports', Icon: Flag, top: '11 ID', bottom: '6 báo cáo' },
                    ].map(({ key, Icon, top, bottom, danger }) => (
                        <div key={key} className="flex flex-col items-center min-w-0">
                            {/* SL ở trên */}
                            <span className="text-[10px] text-gray-600 leading-tight mb-0.5 whitespace-nowrap">{top}</span>
                            <button
                                className={`border p-2 rounded ${activeTab === key ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}`}
                                onClick={() => setActiveTab(prev => prev === key ? null : key)}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                            {/* SL ở dưới */}
                            <span className={`text-[10px] leading-tight mt-0.5 whitespace-nowrap ${danger ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>{bottom}</span>
                        </div>
                    ))}
                </div>
            </div>

            {activeTab === 'follow' && (
                <div className="mt-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {sortedFollowed.map(u => (
                            <div key={u.id} className="relative flex-shrink-0">
                                <img
                                    src={u.avatar}
                                    alt="avatar"
                                    className={`w-12 h-12 rounded-full ring-2 ${activeUserId === u.id ? "ring-blue-500" : "ring-gray-300"}`}
                                    onClick={() => {
                                        // Chọn 1 người thì đến thư mục của họ
                                        setActiveUserId(u.id); setActiveStreamIndex(0); setActiveTab('package')
                                    }}
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
            {(activeTab === 'package' || activeTab === 'products') && (
                <div className="mt-3">
                    {activeTab === 'package' && activeUser && (
                        <div className="mb-2 flex items-center gap-2 text-sm">
                            <img src={activeUser.avatar} alt="" className="w-6 h-6 rounded-full" />
                            <span className="font-bold">{activeUser.name}</span>
                            <button type="button" className="text-xs text-blue-600 underline" onClick={() => setActiveUserId(null)}>Bỏ chọn</button>
                        </div>
                    )}
                    <div className="space-y-2">
                        {sortedFolders.map(f => (
                            <div key={f.id}>
                                <div className="flex items-center justify-between">
                                    <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenFolderId(prev => prev === f.id ? null : f.id)}>
                                        <span>• {f.name}</span>
                                        <ChevronRight className={`w-4 h-4 ${openFolderId === f.id ? "rotate-90" : ""}`} />
                                    </button>
                                    <button className="text-xs text-blue-600 whitespace-nowrap" onClick={() => moveFolderToCompleted(f.id)}>Chuyển sang Hoàn thành</button>
                                </div>
                                {openFolderId === f.id && (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                                        {f.videos.map((v, idx) => (
                                            <VideoCard
                                                key={v.id}
                                                index={idx + 1}
                                                name={v.name}
                                                productId={v.productId}
                                                viewers={v.viewers}
                                                saves={v.saves}
                                                shares={v.shares}
                                                hasPlatformLogo={v.hasPlatformLogo}
                                                avatar={v.avatar}
                                                onClick={() => openGoodsVideo(v)}
                                                onPlay={() => openGoodsVideo(v)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'completed' && (
                <div className="mt-3">
                    <div className="space-y-2">
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
                </div>
            )}
            {activeTab === 'shared' && (
                <div className="mt-3">
                    <div className="space-y-2">
                        {sharedFolders.map(f => (
                            <div key={f.id}>
                                <div className="flex items-center justify-between">
                                    <button className="text-left w-full flex items-center gap-2" onClick={() => setOpenFolderId(prev => prev === f.id ? null : f.id)}>
                                        <span>• {f.name}</span>
                                        <span className="text-xs text-gray-500">({f.sharedBy} chia sẻ)</span>
                                        <ChevronRight className={`w-4 h-4 ${openFolderId === f.id ? "rotate-90" : ""}`} />
                                    </button>
                                </div>
                                {openFolderId === f.id && (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                                        {f.videos.map((v, idx) => (
                                            <VideoCard
                                                key={v.id}
                                                index={idx + 1}
                                                name={v.name}
                                                productId={v.productId}
                                                viewers={v.viewers}
                                                saves={v.saves}
                                                shares={v.shares}
                                                hasPlatformLogo={v.hasPlatformLogo}
                                                avatar={v.avatar}
                                                onClick={() => navigate(`/ai-live/video-goods/${v.id}`)}
                                                onPlay={() => confirmAndOpen(v.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {sharedFolders.length === 0 && (
                            <div className="text-sm text-gray-500">Rỗng</div>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'violations' && (
                <div className="mt-3">
                    <div className="space-y-2">
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
                </div>
            )}
            {activeTab === 'reports' && (
                <div className="mt-3">
                    <div className="space-y-2">
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
                </div>
            )}
            {/* Danh sách livestream của các ID hàng hóa, gộp thành 1 lưới ngang (5 card/hàng) */}
            <div className="mt-2">
                {goodsLoading && (
                    <div className="py-6 text-center text-sm text-gray-500">Đang tải video livestream...</div>
                )}
                {!goodsLoading && goodsError && (
                    <div className="py-6 text-center text-sm text-red-500">{goodsError}</div>
                )}
                {!goodsLoading && !goodsError && goodsGroups.length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-500">Chưa có video livestream hàng hóa</div>
                )}
                {!goodsLoading && !goodsError && goodsGroups.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {goodsGroups.flatMap(g => g.videos).slice(0, visibleRows * CARDS_PER_ROW).map((v, idx) => (
                            <VideoCard
                                key={v.id}
                                index={idx + 1}
                                name={v.name}
                                productId={v.productId}
                                viewers={v.viewers}
                                saves={v.saves}
                                shares={v.shares}
                                hasPlatformLogo={v.hasPlatformLogo}
                                avatar={v.avatar}
                                onClick={() => openGoodsVideo(v)}
                                onPlay={() => openGoodsVideo(v)}
                            />
                        ))}
                    </div>
                )}
                {!goodsLoading && !goodsError && goodsGroups.flatMap(g => g.videos).length > visibleRows * CARDS_PER_ROW && (
                    <div className="mt-2 text-center">
                        <button
                            type="button"
                            className="border border-gray-300 px-4 py-1 text-sm font-bold hover:bg-gray-50"
                            onClick={() => setVisibleRows(r => r + 3)}
                        >
                            Xem thêm
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
