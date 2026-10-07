"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import { Lock, Mail, Phone, ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslation } from 'react-i18next';
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';
import "../styles/Login.css";

export default function AccountBlockedPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [color, setColor] = useState(localStorage.getItem("selectedColor") || "#ffffff");

    useEffect(() => {
        document.getElementById("root").style.backgroundColor = color;
    }, [color]);

    const handleChangeColor = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        localStorage.setItem("selectedColor", newColor);
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-transparent backdrop-blur-md p-6 rounded-lg w-full max-w-4xl mx-auto">
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix=""
                    title={t('blocked.title', 'TÀI KHOẢN BỊ KHÓA VĨNH VIỄN')}
                    leftButton={
                        <button
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => navigate('/login')}
                        >
                            <ArrowLeft size={28} />
                        </button>
                    }
                />

                <div className="mt-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-100 p-6 rounded-full">
                            <ShieldAlert size={64} className="text-red-600" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-red-700 mb-4">
                        {t('blocked.sorry', 'Rất tiếc!')}
                    </h2>

                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded max-w-2xl mx-auto mb-8">
                        <p className="text-lg text-red-800 leading-relaxed">
                            {t('blocked.message', 'Tài khoản của bạn đã bị khóa vĩnh viễn do nhập sai ký tự khôi phục tài khoản quá nhiều lần trong lần thử cuối cùng.')}
                        Vui lòng <a href="/guide-rules" className="text-blue-600">liên hệ </a> với quản trị viên và làm theo các yêu cầu để được xử lý.</p> 
                    </div>

                    {/* <div className="bg-white/50 backdrop-blur-sm p-8 rounded-xl border border-gray-200 max-w-xl mx-auto text-left">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Mail size={24} className="text-blue-600" />
                            {t('blocked.contactTitle', 'Thông tin liên hệ hỗ trợ:')}
                        </h3>

                        <div className="space-y-4 text-gray-700">
                            <div className="flex items-start gap-3 p-3 hover:bg-white/60 rounded-lg transition-colors">
                                <div className="bg-blue-100 p-2 rounded">
                                    <Mail size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold">{t('blocked.admin', 'Quản trị viên')}</p>
                                    <p className="text-blue-600 select-all">admin@dnt-org.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 hover:bg-white/60 rounded-lg transition-colors">
                                <div className="bg-green-100 p-2 rounded">
                                    <Phone size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold">{t('blocked.support', 'Hỗ trợ khách hàng')}</p>
                                    <p className="text-green-600">+84 123 456 789</p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-sm text-gray-500 italic">
                            {t('blocked.supportDetails', 'Vui lòng cung cấp Số tài khoản ngân hàng (ID) của bạn khi liên hệ để được xử lý nhanh nhất.')}
                        </p>
                    </div> */}

                    <div className="mt-10">
                        <button
                            className="bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto"
                            onClick={() => navigate('/login')}
                        >
                            <ArrowLeft size={20} />
                            {t('blocked.backToLogin', 'Quay lại trang đăng nhập')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
