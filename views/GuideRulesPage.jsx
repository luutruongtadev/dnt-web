"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import {
    ArrowLeft,
    LogIn,
    MessageCircle,
    CheckCircle2,
    ArrowRight,
    HelpCircle
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';
import "../styles/Login.css";

export default function GuideRulesPage() {
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

    const steps = [
        {
            number: 1,
            icon: <LogIn size={28} className="text-blue-600" />,
            iconBg: "bg-blue-100",
            badge: "bg-blue-600",
            title: t('guideRules.step1.title', 'Đăng nhập vào nền tảng bằng một tài khoản khác'),
            description: t('guideRules.step1.description', 'Sử dụng một tài khoản khác (của người thân, bạn bè) có chức năng liên lạc, đã được xác thực và có số dư Ví > 0, để đăng nhập vào nền tảng.'),
            action: t('guideRules.step1.action', 'Đến trang Đăng nhập'),
            onAction: () => navigate('/login'),
        },
        {
            number: 2,
            icon: <MessageCircle size={28} className="text-purple-600" />,
            iconBg: "bg-purple-100",
            badge: "bg-purple-600",
            title: t('guideRules.step2.title', 'Cung cấp các thông tin đúng về tài khoản bị khóa vĩnh viễn'),
            description: t('guideRules.step2.description', 'Cung cấp các thông tin đúng về tài khoản bị khóa vĩnh viễn muốn khôi phục lại theo yêu cầu của nền tảng.'),
            action: t('guideRules.step2.action', 'Mở trang Liên hệ'),
            onAction: () => navigate('/contact'),
        },
        {
            number: 3,
            icon: <LogIn size={28} className="text-green-600" />,
            iconBg: "bg-green-100",
            badge: "bg-green-600",
            title: t('guideRules.step3.title', 'Đăng nhập lại bằng mật khẩu mới'),
            description: t('guideRules.step3.description', 'Sử dụng Mật khẩu nền tảng cung cấp và đăng nhập lại để hoàn thành khôi phục tài khoản bị khóa vĩnh viễn, thực hiện các cài đặt cần thiết và sử dụng bình thường.'),
            action: t('guideRules.step3.action', 'Đến trang Đăng nhập'),
            // Flag this login as the post-unblock recovery login so Login.jsx routes
            // to the new security setup page instead of straight home.
            onAction: () => navigate('/login', { state: { recoveryFlow: true } }),
        },
    ];

    return (
        <div className="flex justify-center items-center min-h-screen py-8">
            <div className="bg-transparent backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
                <PageHeaderWithOutColorPicker
                    color={color}
                    onColorChange={handleChangeColor}
                    titlePrefix=""
                    title={t('guideRules.title', 'HƯỚNG DẪN KHÔI PHỤC TÀI KHOẢN BỊ KHÓA VĨNH VIỄN')}
                    titleClassName="text-lg md:text-xl whitespace-nowrap"
                    leftButton={
                        <button
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={28} />
                        </button>
                    }
                />

                <div className="mt-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-yellow-100 p-5 rounded-full">
                            <HelpCircle size={56} className="text-yellow-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                        {t('guideRules.heading', 'Lấy lại tài khoản qua 3 bước')}
                    </h2>

                    <p className="text-gray-600 mx-auto mb-8">
                        {t('guideRules.intro', 'Nếu bạn không thể truy cập tài khoản, hãy làm theo các bước hướng dẫn dưới đây để được hỗ trợ khôi phục.')}
                    </p>
                </div>

                <div className="space-y-6">
                    {steps.map((step, idx) => (
                        <div
                            key={step.number}
                            className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className={`${step.badge} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow`}>
                                        {step.number}
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="w-0.5 h-12 bg-gray-300" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`${step.iconBg} p-3 rounded-lg`}>
                                            {step.icon}
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-800">
                                            {step.title}
                                        </h3>
                                    </div>

                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        {step.description}
                                    </p>

                                    <button
                                        className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-all"
                                        onClick={step.onAction}
                                    >
                                        {step.action}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-5 rounded-lg max-w-3xl mx-auto">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-green-800 leading-relaxed">
                            {t('guideRules.note', 'Lưu ý: Khi liên hệ với quản trị viên, vui lòng cung cấp đầy đủ, đúng các thông tin tài khoản đang bị khóa vĩnh viễn theo đúng yêu cầu của nền tảng để có thể được hỗ trợ.')}
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        className="bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={20} />
                        {t('guideRules.backHome', 'Quay lại Trang chủ')}
                    </button>
                </div>
            </div>
        </div>
    );
}
