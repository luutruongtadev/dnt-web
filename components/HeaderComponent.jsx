"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import useSupabaseRealtimeAuth from "../custom-hooks/useSupabaseRealtimeAuth";
import useInboxChannel from "../custom-hooks/useInboxChannel";
import { QrCode } from "lucide-react";

const getCurrentUserId = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}')?.id || null;
    } catch {
        return null;
    }
};

const HeaderComponent = ({
    color,
    onColorChange,
    onQrClick,
    selectedLang,
    onLanguageChange,
    isUserLoggedIn,
    className = ""
}) => {
    const { t, i18n } = useTranslation();
    const currentUserId = getCurrentUserId();
    const { isAuthReady } = useSupabaseRealtimeAuth(isUserLoggedIn && !!currentUserId);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [showBgMenu, setShowBgMenu] = useState(false);
    const dropdownRef = useRef();
    const bellRef = useRef();
    const bgMenuRef = useRef();

    useInboxChannel({
        userId: currentUserId,
        enabled: isUserLoggedIn && isAuthReady,
        onNotification: (payload) => {
            setNotifications(prev => [
                { id: `${payload.pushDate}_${payload.transactionId || prev.length}`, ...payload },
                ...prev,
            ].slice(0, 20));
        },
    });

    const markNotificationRead = (id) => {
        setNotifications(prev => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const colors = [
        { name: "VN", value: "vi" },
        { name: "EN", value: "en" },
    ];

    // Apply saved background image on mount
    useEffect(() => {
        const savedBgImage = localStorage.getItem("selectedBgImage");
        if (savedBgImage) {
            const root = document.getElementById("root");
            if (root) {
                root.style.backgroundImage = `url(${savedBgImage})`;
                root.style.backgroundSize = "cover";
                root.style.backgroundRepeat = "no-repeat";
                root.style.backgroundAttachment = "fixed";
            }
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            const clickedBell = bellRef.current && bellRef.current.contains(event.target);
            const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
            if (!clickedBell && !clickedDropdown) {
                setIsNotificationOpen(false);
            }
            if (bgMenuRef.current && !bgMenuRef.current.contains(event.target)) {
                setShowBgMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        onLanguageChange(newLang);
        i18n.changeLanguage(newLang);
        localStorage.setItem("selectedLang", newLang);
    };

    // Wrap onColorChange: clear background image before switching to solid color
    const handleColorChange = (e) => {
        const root = document.getElementById("root");
        if (root) {
            root.style.backgroundImage = "";
        }
        localStorage.removeItem("selectedBgImage");
        onColorChange(e);
    };

    // Read selected image file, store as base64 in localStorage, apply to root
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            localStorage.setItem("selectedBgImage", dataUrl);
            localStorage.removeItem("selectedColor");

            const root = document.getElementById("root");
            if (root) {
                root.style.backgroundImage = `url(${dataUrl})`;
                root.style.backgroundSize = "cover";
                root.style.backgroundRepeat = "no-repeat";
                root.style.backgroundAttachment = "fixed";
                root.style.backgroundColor = "";
            }
        };
        reader.readAsDataURL(file);
        // Reset so the same file can be picked again later
        e.target.value = "";
    };

    return (
        <>
            <div
                className={`flex flex-col text-sm text-center menu-left-top ${className}`}
                style={{ fontSize: "clamp(6px, 0.75vw, 14px)", paddingTop: !isUserLoggedIn ? 0 : '27px' }}
            >
                <div
                    onClick={onQrClick}
                    style={{ minHeight: !isUserLoggedIn ? 0 : '28px' }}
                    className="cursor-pointer flex border-b border-r border-t border-black justify-center items-center min-h-7"
                >
                    <div className="table-cell flex items-center font-bold py-1 px-1">
                        <QrCode size={20} />
                    </div>
                </div>

                <div
                    style={{ minHeight: !isUserLoggedIn ? 0 : '28px' }}
                    className="cursor-pointer flex border-b border-black border-r justify-center items-center min-h-7"
                >
                    <div className="table-cell items-center font-bold py-1 px-1 md:block text-center appicon">
                        APP
                    </div>
                    <div className="table-cell items-center font-bold py-1 px-1 md:hidden">
                        <i className="fa-solid fa-computer"></i>
                    </div>
                </div>

                {/* Background picker — click opens a 2-option menu */}
                <div
                    ref={bgMenuRef}
                    style={{ width: "100%", minHeight: "3.3vh", position: "relative" }}
                    className="cursor-pointer flex border-b border-black border-r justify-center items-center min-h-6"
                    onClick={() => setShowBgMenu(prev => !prev)}
                >
                    <div className="table-cell flex items-center font-bold py-1 px-1 w-full">
                        {/* Small swatch showing the current solid color */}
                        <div
                            style={{
                                minHeight: "2vh",
                                width: "100%",
                                height: "100%",
                                backgroundColor: color,
                                border: "1px solid rgba(0,0,0,0.25)",
                                borderRadius: "2px",
                            }}
                            className="cursor-pointer"
                        />

                        {/* Hidden color input */}
                        <input
                            id="colorPicker"
                            hidden
                            type="color"
                            value={color}
                            onChange={handleColorChange}
                            className="cursor-pointer"
                        />

                        {/* Hidden image file input */}
                        <input
                            id="imagePicker"
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                        />
                    </div>

                    {/* 2-option dropdown menu */}
                    {showBgMenu && (
                        <div
                            style={{
                                position: "absolute",
                                left: "100%",
                                top: 0,
                                zIndex: 1000,
                                backgroundColor: "white",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                                minWidth: "158px",
                                overflow: "hidden",
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm font-medium"
                                style={{ color: "#111827" }}
                                onClick={() => {
                                    setShowBgMenu(false);
                                    document.getElementById("colorPicker").click();
                                }}
                            >
                                <span>🎨</span>
                                <span>Màu nền</span>
                            </div>
                            <div
                                style={{ borderTop: "1px solid #e5e7eb", color: "#111827" }}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm font-medium"
                                onClick={() => {
                                    setShowBgMenu(false);
                                    document.getElementById("imagePicker").click();
                                }}
                            >
                                <span>🖼️</span>
                                <span>Ảnh nền</span>
                            </div>
                        </div>
                    )}
                </div>


                <div
                    style={{ minHeight: !isUserLoggedIn ? 0 : '28px' }}
                    className="cursor-pointer flex border-b border-black border-r justify-center items-center min-h-6"
                >
                    <select
                        className="table-cell flex items-center font-bold py-1 text-center"
                        value={selectedLang}
                        onChange={handleLanguageChange}
                    >
                        {colors.map((colorOption) => (
                            <option key={colorOption.value} value={colorOption.value}>
                                {colorOption.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    ref={bellRef}
                    onClick={() => setIsNotificationOpen(prev => !prev)}
                    className="cursor-pointer flex border-b border-black border-r justify-center items-center min-h-6"
                >
                    <div style={{ position: "relative" }} className="table-cell flex items-center font-bold py-1 px-1 text-center">
                        <i
                            style={{ fontSize: "clamp(10px, 1vw, 20px)" }}
                            className="fa-solid fa-bell"
                        ></i>
                        {unreadCount > 0 && (
                            <span
                                style={{ fontSize: "9px", lineHeight: 1 }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 py-0.5"
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>

            </div>




            {isNotificationOpen && (
                <div ref={dropdownRef} className="absolute left w-50 bg-white rounded-md z-50 border border-gray-200">
                    <h6 className="text-sm px-1 font-bold">{t('common.notifications')}</h6>
                    <div className="px-1">
                        <ul className="max-h-50 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 5).map((note) => (
                                    <li
                                        onMouseEnter={() => !note.read && markNotificationRead(note.id)}
                                        key={note.id}
                                        className="text-sm px-1 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {!note.read ? (
                                            <b className="font-bold">{note.message} (new)</b>
                                        ) : (
                                            <>{note.message}</>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm px-1 text-gray-500">
                                    {t('common.no_notifications')}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

        </>
    );
};

export default HeaderComponent;
