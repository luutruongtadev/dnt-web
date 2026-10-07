"use client";
import { useNavigate } from '@/lib/router-compat';
import { Home as HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RestrictedTransactionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center pt-4 px-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="text-red-600 hover:text-red-800">
            <HomeIcon size={28} />
          </button>
          <h1 className="text-2xl font-bold text-center flex-1">DANH SÁCH HẠN CHẾ GIAO DỊCH</h1>
          <div className="w-7" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-black text-xs text-center table-fixed">
            <thead>
              <tr>
                <th className="border border-black p-2 w-10">STT</th>
                <th className="border border-black p-2 w-24">HÌNH NỀN<br />(Avatar)</th>
                <th className="border border-black p-2">ID TÀI KHOẢN</th>
                <th className="border border-black p-2">LÝ DO HẠN CHẾ</th>
                <th className="border border-black p-2">THỜI GIAN BẮT ĐẦU</th>
                <th className="border border-black p-2">THỜI GIAN KẾT THÚC</th>
                <th className="border border-black p-2">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1">{idx + 1}</td>
                  <td className="border border-black p-1 font-bold">AVT</td>
                  <td className="border border-black p-1">---</td>
                  <td className="border border-black p-1">---</td>
                  <td className="border border-black p-1">---</td>
                  <td className="border border-black p-1">---</td>
                  <td className="border border-black p-1">---</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
