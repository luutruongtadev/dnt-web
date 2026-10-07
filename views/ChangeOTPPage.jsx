"use client";
import React, { useState, useEffect } from "react";
import "../styles/Register.css";
import { useNavigate } from '@/lib/router-compat';
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { changeOtp } from "../services/authService";
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';


export default function ChangeOTPPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [color, setColor] = useState(localStorage.getItem("selectedColor"));

    const [otp, setOtp] = useState("");
    const [confirmOtp, setConfirmOtp] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [showConfirmOtp, setShowConfirmOtp] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    useEffect(() => {
        const root = document.getElementById("root");
        if (root) root.style.backgroundColor = color;
    }, [color]);

    const isMatch = otp === confirmOtp && confirmOtp.length > 0;
    const canSubmit = otp.length > 0 && isMatch && !isLoading;

    const handleSubmit = async () => {
        setError("");

        if (!isMatch) {
            setError(t('changeOtp.errors.mismatch', 'Mã OTP xác nhận không khớp'));
            return;
        }

        setIsLoading(true);
        try {
            const response = await changeOtp(otp);

            if (response.data?.blocked) {
                alert(response.data.message || t('auth.userBlocked', 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'));
                return;
            }

            alert(t('changeOtp.success', 'Đổi mã OTP thành công!'));
            navigate("/");
        } catch (err) {
            console.error("Lỗi khi đổi OTP:", err.response?.data || err.message);
            setError(err.response?.data?.message || t('changeOtp.errors.failed', 'Đổi mã OTP thất bại. Vui lòng thử lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && canSubmit) {
            handleSubmit();
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-transparent backdrop-blur-md p-6 rounded-lg w-full max-w-4xl mx-auto">
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix=""
                    title={t('register.changeOTPTitle', 'ĐỔI MẬT MÃ OTP')}
                />

                <div className="mt-6">
                    <div className="grid gap-4 mt-5">

                        {/* OTP field */}
                        <div className="relative">
                            <input
                                type={showOtp ? "text" : "password"}
                                className={`border p-3 rounded w-full pr-10 text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                    otp.length > 0 ? 'border-green-500' : 'border-gray-300'
                                }`}
                                placeholder={t('changeOtp.otpPlaceholder', 'Mã OTP mới')}
                                value={otp}
                                onChange={(e) => {
                                    setOtp(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={handleKeyDown}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowOtp(!showOtp)}
                                tabIndex={-1}
                            >
                                {showOtp ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>



                        {/* Confirm OTP field */}
                        <div className="relative">
                            <input
                                type={showConfirmOtp ? "text" : "password"}
                                className={`border p-3 rounded w-full pr-10 text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                    confirmOtp && !isMatch ? 'border-red-500' :
                                    confirmOtp && isMatch ? 'border-green-500' : 'border-gray-300'
                                }`}
                                placeholder={t('changeOtp.confirmOtpPlaceholder', 'Xác nhận mã OTP mới')}
                                value={confirmOtp}
                                onChange={(e) => {
                                    setConfirmOtp(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={handleKeyDown}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowConfirmOtp(!showConfirmOtp)}
                                tabIndex={-1}
                            >
                                {showConfirmOtp ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Match status */}
                        {confirmOtp && (
                            <div className={`text-xs -mt-2 ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
                                <span className="mr-1">{isMatch ? '✓' : '✗'}</span>
                                {isMatch
                                    ? t('changeOtp.otpMatch', 'Mã OTP khớp')
                                    : t('changeOtp.otpMismatch', 'Mã OTP không khớp')
                                }
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`border-2 border-black text-black font-bold px-6 py-2 rounded w-full transition-all ${
                                !canSubmit
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                    : 'hover:bg-gray-200'
                            }`}
                        >
                            {isLoading
                                ? t('common.loading', 'Đang xử lý...')
                                : t('common.confirm', 'XÁC NHẬN')
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}