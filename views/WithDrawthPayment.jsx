"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from '@/lib/router-compat';
import { useTranslation } from 'react-i18next';
import { Home as HomeIcon, KeyboardIcon as KeyboardIcon } from 'lucide-react';
import { createWithdrawal, getWalletFromToken } from "../services/walletService";

const WithDrawthPaymentPage = () => {
  const { t } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor"));
  const [user, setUser] = useState(localStorage.getItem("authToken"));
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate()
  
  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
    if (user) {
      getWalletFromToken(user)
        .then((res) => setWallet(res.data))
        .catch(() => setMessage("Không lấy được ví. Vui lòng đăng nhập lại."));
    }
  }, [color]);

  const availableBalance = Number(wallet?.total || 0) - Number(wallet?.pending_amount || 0);

  const handleSubmit = async () => {
    if (!user) {
      setMessage("Vui lòng đăng nhập lại.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setMessage("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (Number(amount) > availableBalance) {
      setMessage("Số tiền rút vượt quá số dư khả dụng.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      await createWithdrawal({ authToken: user, wallet, amount: Number(amount), note });
      const res = await getWalletFromToken(user);
      setWallet(res.data);
      setAmount("");
      setNote("");
      setMessage("Đã gửi yêu cầu rút tiền.");
    } catch (error) {
      setMessage(error.response?.data?.error?.message || error.message || "Không tạo được yêu cầu rút tiền.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="shadow-lg rounded max-w-2xl mx-auto p-4   ">
      <div className="flex items-center justify-between relative">
        <button 
          className="text-red-600 hover:text-red-800 relative"
          onClick={() => navigate("/")}
        >
          <HomeIcon size={28} />
        </button>
        {/* Tiêu đề ở giữa */}
        <div className="text-center border-blue-800 py-2 relative flex-1">
          <h1 className="text-3xl font-bold inline-block relative">
            <span className="relative inline-block">
              4
              <input
                type="color"
                value={color}
                onChange={handleChangeColor}
                className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-10 h-8 cursor-pointer"
              />
            </span>
            &nbsp;- {t('payment.withdraw')}
          </h1>
        </div>
        <button 
          className="text-red-600 hover:text-red-800"
          onClick={() => navigate("/admin-control")}
        >
          <KeyboardIcon size={28} />
        </button>
        </div>

      {/* Mã QR */}
      {/* <div className=" p-2 mt-2 flex items-center">
        <span className="ml-2 font-bold">MÃ QR:</span>
      </div> */}

      {/* Bảng thông tin */}
      <div className="mt-2">
        <div className="grid grid-cols-2  p-2">
          <span className="font-bold">{t('withdrawPayment.withdraw')}</span>
          <span className="text-center font-bold">
            Khả dụng: {availableBalance.toLocaleString("vi-VN")} VNĐ
          </span>
        </div>

        <div className="grid grid-cols-2 p-2">
          <span className="font-bold">
            {t('withdrawPayment.amountToWithdraw')}:
          </span>
          <span className="text-center">
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border"
              placeholder={t('withdrawPayment.enterPlaceholder')}
            />
          </span>
        </div>
        <div className="grid grid-cols-2 p-2">
          <span className="font-bold">Ghi chú:</span>
          <span className="text-center">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border"
            />
          </span>
        </div>
      </div>

      {/* Chấp nhận */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="w-full border border-black p-3 mt-2 text-center font-bold rounded disabled:opacity-50"
      >
        {t('withdrawPayment.accept')}
      </button>
      {/* Tải biên lai */}
      <div className="border border-black p-3 mt-2 text-center font-bold rounded ">
        {t('withdrawPayment.reviewReceipt')}
      </div>
      {message && <div className="border border-black p-2 mt-2 text-center font-bold">{message}</div>}
    </div>
  );
};

export default WithDrawthPaymentPage;
