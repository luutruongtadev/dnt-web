"use client";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
    Home as HomeIcon,
    KeyboardIcon as KeyboardIcon,
    Eye as EyeIcon,
    EyeOff as EyeOffIcon,
} from "lucide-react";
import { getUserCountry } from "../utils/user";

export default function GoodsAccount({ title, onTransfer, country: countryProp }) {
    const { t } = useTranslation();
    const [isVisible1, setIsVisible1] = useState(false);
    const [isVisible2, setIsVisible2] = useState(false);
    const resolveCountryFromUser = () => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            if (!raw) return null;
            const user = JSON.parse(raw);
            // Common possibilities
            const { nation, country, nationCode, countryCode } = user || {};
            // If nested object with i18n fields
            if (nation && typeof nation === 'object') {
                const lang = (typeof window !== 'undefined' && (window.i18n?.language || document.documentElement.lang)) || 'vi';
                return nation[lang] || nation.en || nation.vi || null;
            }
            if (country && typeof country === 'object') {
                const lang = (typeof window !== 'undefined' && (window.i18n?.language || document.documentElement.lang)) || 'vi';
                return country[lang] || country.en || country.vi || null;
            }
            // If simple string fields
            if (typeof nation === 'string' && nation.trim()) return nation;
            if (typeof country === 'string' && country.trim()) return country;
            if (typeof nationCode === 'string' && nationCode.trim()) return nationCode;
            if (typeof countryCode === 'string' && countryCode.trim()) return countryCode;
            return null;
        } catch {
            return null;
        }
    };

    const [country, setCountry] = useState(() => {
        const fromUser = getUserCountry();
        if (fromUser) return fromUser;
        return 'VN';
    });
    const handleKeyDown = (e) => {
        if (e.key === "-" || e.key === "." || e.key === "e" || e.key === "E" || e.key === "+") {
            e.preventDefault();
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        if (value && (parseFloat(value) <= 0 || !Number.isInteger(parseFloat(value)))) {
            e.target.value = "1";
        } else {
            const calculatedValue = parseFloat(e.target.value) || 1;
            const el = document.getElementById("calculatedValue");
            if (el) el.value = calculatedValue;
        }
    };

    useEffect(() => {
        // Prefer country from user profile stored in localStorage
        const fromUser = getUserCountry();
        if (fromUser && fromUser !== country) {
            setCountry(fromUser);
        } else if (!fromUser && countryProp && countryProp !== country) {
            // Fallback to prop only when user doesn't have a nation
            setCountry(countryProp);
        }
        const onStorage = (e) => {
            if (e.key === 'user') {
                const next = getUserCountry();
                setCountry(next || 'VN');
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [countryProp]);

    return (
        <div className="grid grid-cols-8 border border-gray-300">
            <div className="border-r border-gray-300 p-2 text-center flex items-center justify-center">
                <div dangerouslySetInnerHTML={{ __html: title }} className="font-bold text-center">

                </div>
            </div>
            <div className="border-r h-20 border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="number"
                    name="exchangeRate"
                    className="w-full border-b border-gray-300 flex-1"
                    defaultValue="0"
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const calculatedValue = value * 1; // Tỉ giá mặc định là 1
                        document.getElementById("calculatedValue").value =
                            calculatedValue;
                    }}
                    style={{ textAlign: "right" }}
                />
                <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                    <div className="flex-1"><button
                        type="button"
                        onClick={() => setIsVisible1(!isVisible1)}
                        className="text-gray-600 hover:text-gray-900 flex-1"
                    >
                        {isVisible1 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button></div>
                    <div className="flex-4 text-right pr-4">{isVisible1 ? "0" : "•••"}</div>


                </div>
            </div>

            <div className="border-r border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="text"
                    name="country"
                    className="w-full border-b border-gray-300 flex-1"
                    value={country || 'VN'}
                    readOnly
                    style={{ textAlign: "center" }}
                />
                <div className="font-bold flex-1 border-gray-300 flex items-center justify-center">
                    <span className="mr-2">D</span>
                </div>
            </div>


            <div className="border-r border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="number"
                    name="exchangeRate"
                    className="w-full border-b border-gray-300 flex-1"
                    defaultValue="0"
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const calculatedValue = value * 1; // Tỉ giá mặc định là 1
                        document.getElementById("calculatedValue").value =
                            calculatedValue;
                    }}
                    style={{ textAlign: "right" }}
                />
                <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                    <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                        <div className="flex-1"><button
                            type="button"
                            onClick={() => setIsVisible2(!isVisible2)}
                            className="text-gray-600 hover:text-gray-900 flex-1"
                        >
                            {isVisible2 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button></div>
                        <div className="flex-4 text-right pr-4">{isVisible2 ? "0" : "•••"}</div>

                    </div>
                </div>
            </div>

            <div className="border-r border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="number"
                    name="exchangeRate"
                    className="w-full border-b border-gray-300 flex-1"
                    defaultValue="0"
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const calculatedValue = value * 1; // Tỉ giá mặc định là 1
                        document.getElementById("calculatedValue").value =
                            calculatedValue;
                    }}
                    style={{ textAlign: "right" }}
                />
                <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                    <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                        <div className="flex-1"><button
                            type="button"
                            onClick={() => setIsVisible2(!isVisible2)}
                            className="text-gray-600 hover:text-gray-900 flex-1"
                        >
                            {isVisible2 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button></div>
                        <div className="flex-4 text-right pr-4">{isVisible2 ? "0" : "•••"}</div>

                    </div>
                </div>
            </div>

            <div className="border-r border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="number"
                    name="exchangeRate"
                    className="w-full border-b border-gray-300 flex-1"
                    defaultValue="0"
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const calculatedValue = value * 1; // Tỉ giá mặc định là 1
                        document.getElementById("calculatedValue").value =
                            calculatedValue;
                    }}
                    style={{ textAlign: "right" }}
                />
                <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                    <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                        <div className="flex-1"><button
                            type="button"
                            onClick={() => setIsVisible2(!isVisible2)}
                            className="text-gray-600 hover:text-gray-900 flex-1"
                        >
                            {isVisible2 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button></div>
                        <div className="flex-4 text-right pr-4">{isVisible2 ? "0" : "•••"}</div>

                    </div>
                </div>
            </div>

            <div className="border-r border-gray-300 text-center flex flex-col items-center justify-center">
                <input
                    type="number"
                    name="exchangeRate"
                    className="w-full border-b border-gray-300 flex-1"
                    placeholder={t("goods.enter_number", "Nhập số")}
                    // onChange={(e) => {
                    //     const value = parseFloat(e.target.value) || 0;
                    //     const calculatedValue = value * 1; // Tỉ giá mặc định là 1
                    //     document.getElementById("calculatedValue").value =
                    //         calculatedValue;
                    // }}
                    style={{ textAlign: "right" }}
                />
                <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                    <div className="font-bold flex-1 border-gray-300 w-full flex items-center justify-center">
                        <div className="flex-1"><button
                            type="button"
                            onClick={() => setIsVisible2(!isVisible2)}
                            className="text-gray-600 hover:text-gray-900 flex-1"
                        >
                            {isVisible2 ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button></div>
                        <div className="flex-4 text-right pr-4">{isVisible2 ? "0" : "•••"}</div>

                    </div>
                </div>
            </div>

            <div className="p-2 text-center flex items-center justify-center">
                <button
                    type="button"
                    className="mt-1 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                >
                    {t("aiLive.transferToWallet")}
                </button>
            </div>

        </div>
    );
}
