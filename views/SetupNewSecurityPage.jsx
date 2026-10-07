"use client";
import React, { useState, useEffect } from "react";
import "../styles/Register.css";
import { useNavigate, useLocation } from '@/lib/router-compat';
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { setRecoveryString, changeOtp } from "../services/authService";
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';

// Reached only after a permanently-blocked account logs back in with the
// platform-issued password (see GuideRulesPage step 3 -> Login.jsx completeLogin).
// Lets the user set a brand new recovery character + OTP for the account.
export default function SetupNewSecurityPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [color, setColor] = useState(localStorage.getItem("selectedColor"));

    const [currentPassword, setCurrentPassword] = useState("");
    const [recoveryCharacter, setRecoveryCharacter] = useState("");
    const [confirmRecoveryCharacter, setConfirmRecoveryCharacter] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmOtp, setConfirmOtp] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showRecoveryCharacter, setShowRecoveryCharacter] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Route guard: only reachable via the post-unblock recovery login, not directly.
    useEffect(() => {
        if (!location.state?.fromRecovery) {
            navigate('/', { replace: true });
        }
    }, [location.state, navigate]);

    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    useEffect(() => {
        const root = document.getElementById("root");
        if (root) root.style.backgroundColor = color;
    }, [color]);

    const getValidationError = () => {
        if (!currentPassword) return t('setupNewSecurity.errors.currentPasswordRequired', 'Vui lòng nhập mật khẩu hiện tại');
        if (!recoveryCharacter) return t('setupNewSecurity.errors.recoveryRequired', 'Vui lòng nhập ký tự khôi phục tài khoản mới');
        if (!confirmRecoveryCharacter) return t('setupNewSecurity.errors.confirmRecoveryRequired', 'Vui lòng nhập lại ký tự khôi phục tài khoản mới');
        if (recoveryCharacter !== confirmRecoveryCharacter) return t('setupNewSecurity.errors.recoveryMismatch', 'Ký tự khôi phục tài khoản không khớp');
        if (!otp) return t('setupNewSecurity.errors.otpRequired', 'Vui lòng nhập mã OTP mới');
        if (!confirmOtp) return t('setupNewSecurity.errors.confirmOtpRequired', 'Vui lòng nhập lại mã OTP mới');
        if (otp !== confirmOtp) return t('setupNewSecurity.errors.otpMismatch', 'Mã OTP không khớp');
        if (recoveryCharacter === otp) return t('setupNewSecurity.errors.recoverySameAsOtp', 'Ký tự khôi phục không được trùng với mã OTP');
        if (recoveryCharacter === currentPassword) return t('setupNewSecurity.errors.recoverySameAsPassword', 'Ký tự khôi phục không được trùng với mật khẩu hiện tại');
        if (otp === currentPassword) return t('setupNewSecurity.errors.otpSameAsPassword', 'Mã OTP không được trùng với mật khẩu hiện tại');
        return "";
    };

    const handleBlur = () => setError(getValidationError());

    const handleSubmit = async () => {
        const validationError = getValidationError();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            await setRecoveryString(currentPassword, recoveryCharacter);
            await changeOtp(otp);
            navigate("/");
        } catch (err) {
            console.error("Lỗi khi thiết lập bảo mật mới:", err.response?.data || err.message);
            setError(err.response?.data?.message || t('setupNewSecurity.errors.failed', 'Thiết lập bảo mật mới thất bại. Vui lòng thử lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-transparent backdrop-blur-md p-6 rounded-lg w-full max-w-4xl mx-auto">
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix=""
                    title={t('setupNewSecurity.title', 'THIẾT LẬP BẢO MẬT MỚI')}
                />

                <div className="mt-6">
                    <p className="text-gray-600 text-sm text-center mb-4">
                        {t('setupNewSecurity.description', 'Tài khoản của bạn đã được khôi phục. Vui lòng thiết lập ký tự khôi phục và mã OTP mới để tiếp tục sử dụng.')}
                    </p>

                    <div className="grid gap-4">
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                className="border p-3 rounded w-full pr-10 text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder={t('setupNewSecurity.currentPasswordPlaceholder', 'Mật khẩu hiện tại')}
                                value={currentPassword}
                                onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                                onBlur={handleBlur}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type={showRecoveryCharacter ? "text" : "password"}
                                className="border p-3 rounded w-full pr-10 text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder={t('setupNewSecurity.recoveryPlaceholder', 'Ký tự khôi phục tài khoản mới')}
                                value={recoveryCharacter}
                                onChange={(e) => { setRecoveryCharacter(e.target.value); setError(""); }}
                                onBlur={handleBlur}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowRecoveryCharacter(!showRecoveryCharacter)}
                                tabIndex={-1}
                            >
                                {showRecoveryCharacter ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <input
                            type={showRecoveryCharacter ? "text" : "password"}
                            className="border p-3 rounded w-full text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder={t('setupNewSecurity.confirmRecoveryPlaceholder', 'Nhập lại ký tự khôi phục tài khoản mới')}
                            value={confirmRecoveryCharacter}
                            onChange={(e) => { setConfirmRecoveryCharacter(e.target.value); setError(""); }}
                            onBlur={handleBlur}
                        />

                        <div className="relative">
                            <input
                                type={showOtp ? "text" : "password"}
                                className="border p-3 rounded w-full pr-10 text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder={t('setupNewSecurity.otpPlaceholder', 'Mã OTP mới')}
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value); setError(""); }}
                                onBlur={handleBlur}
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

                        <input
                            type={showOtp ? "text" : "password"}
                            className="border p-3 rounded w-full text-sm min-h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder={t('setupNewSecurity.confirmOtpPlaceholder', 'Nhập lại mã OTP mới')}
                            value={confirmOtp}
                            onChange={(e) => { setConfirmOtp(e.target.value); setError(""); }}
                            onBlur={handleBlur}
                        />

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className={`border-2 border-black text-black font-bold px-6 py-2 rounded w-full transition-all ${isLoading ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-200'
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
