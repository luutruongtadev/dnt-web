"use client";
import React from "react"
import { useNavigate } from '@/lib/router-compat'
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"

export default function CookiePolicyPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Chính Sách Cookie</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg p-8 space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Giới Thiệu</h2>
            <p className="text-gray-700 leading-relaxed">
              Chính sách Cookie này giải thích cách chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự trên website và ứng dụng của chúng tôi. Cookie là những tệp nhỏ được lưu trữ trên thiết bị của bạn để cải thiện trải nghiệm người dùng.
            </p>
          </section>

          {/* What are Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Cookie Là Gì?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookie là những tệp văn bản nhỏ được lưu trữ trên trình duyệt của bạn khi bạn truy cập website. Chúng chứa thông tin về hoạt động duyệt web của bạn và giúp website nhớ các tùy chọn của bạn.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-gray-700">
                <strong>Loại Cookie:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li><strong>Cookie Phiên:</strong> Được xóa khi bạn đóng trình duyệt</li>
                <li><strong>Cookie Lâu Dài:</strong> Được lưu trữ trên thiết bị của bạn trong một khoảng thời gian xác định</li>
                <li><strong>Cookie Của Bên Thứ Ba:</strong> Được đặt bởi các trang web khác</li>
              </ul>
            </div>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Chúng Tôi Sử Dụng Cookie Như Thế Nào?</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">3.1 Cookie Cần Thiết</h3>
                <p className="text-gray-700">
                  Những cookie này là cần thiết để website hoạt động bình thường. Chúng bao gồm:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Xác thực người dùng</li>
                  <li>Bảo mật phiên làm việc</li>
                  <li>Tuân thủ các yêu cầu pháp lý</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3.2 Cookie Phân Tích</h3>
                <p className="text-gray-700">
                  Chúng tôi sử dụng cookie phân tích để hiểu cách bạn sử dụng website, bao gồm:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Số lượng lượt truy cập</li>
                  <li>Các trang được truy cập nhiều nhất</li>
                  <li>Thời gian bạn dành trên website</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3.3 Cookie Chức Năng</h3>
                <p className="text-gray-700">
                  Những cookie này giúp cải thiện chức năng website:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Nhớ tùy chọn ngôn ngữ của bạn</li>
                  <li>Lưu trữ các tùy chọn cá nhân hóa</li>
                  <li>Cải thiện hiệu suất website</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">3.4 Cookie Quảng Cáo</h3>
                <p className="text-gray-700">
                  Chúng tôi có thể sử dụng cookie để cung cấp quảng cáo phù hợp với sở thích của bạn.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Quyền Của Bạn</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bạn có quyền kiểm soát cookie được lưu trữ trên thiết bị của mình:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Xóa cookie bất kỳ lúc nào thông qua cài đặt trình duyệt</li>
              <li>Từ chối cookie mới được đặt</li>
              <li>Yêu cầu thông tin về cookie được sử dụng</li>
              <li>Rút lại sự đồng ý của bạn bất kỳ lúc nào</li>
            </ul>
          </section>

          {/* How to Manage Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cách Quản Lý Cookie</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Hầu hết các trình duyệt web cho phép bạn kiểm soát cookie thông qua cài đặt của chúng. Để tìm hiểu thêm, vui lòng truy cập:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Chrome: chrome://settings/cookies</li>
              <li>Firefox: Preferences → Privacy & Security</li>
              <li>Safari: Preferences → Privacy</li>
              <li>Edge: Settings → Privacy, search, and services</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Liên Hệ Với Chúng Tôi</h2>
            <p className="text-gray-700 leading-relaxed">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách cookie này, vui lòng liên hệ với chúng tôi qua email hoặc biểu mẫu liên hệ trên website.
            </p>
          </section>

          {/* Last Updated */}
          <section className="border-t pt-6">
            <p className="text-gray-500 text-sm">
              Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 border-2 border-black text-black font-bold rounded hover:bg-gray-200 transition"
          >
            Quay Lại
          </button>
        </div>
      </div>
    </div>
  )
}
