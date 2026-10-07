"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, X } from 'lucide-react';

const ScanResultModal = ({ isOpen, onClose, result }) => {
    const { t } = useTranslation();

    if (!isOpen || !result) return null;

    const { avatar, stk, userId, type } = result;

    const handleConfirm = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50 bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl2xl p-6 w-full max-w-sm transform transition-all scale-100">
                {/* Close Button */}
                <button 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" 
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        {t('qr.scanResultTitle', 'Kết quả quét QR')}
                    </h3>
                </div>  

                {/* Content */}
                <div className="flex flex-col items-center space-y-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {avatar ? (
                                <img 
                                    src={avatar} 
                                    alt="User Avatar" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.style.display = 'none';
                                        e.target.parentElement.classList.add('fallback-avatar');
                                    }}
                                />
                            ) : (
                                <User size={48} className="text-gray-400" />
                            )}
                            {/* Fallback for broken image or empty avatar */}
                            <div className="absolute inset-0 flex items-center justify-center hidden fallback-avatar">
                                <User size={48} className="text-gray-400" />
                            </div>
                        </div>
                        {/* Status Indicator (Optional) */}
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* User Info */}
                    <div className="w-full space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                STK (Số tài khoản)
                            </label>
                            <div className="text-lg font-bold text-gray-800 font-mono tracking-wide">
                                {stk || '---'}
                            </div>
                        </div>
                        
                    </div>

                    {/* Actions */}
                    <div className="w-full pt-2">
                        <button
                            onClick={handleConfirm}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors-200"
                        >
                            {t('common.confirm', 'Xác nhận')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanResultModal;
