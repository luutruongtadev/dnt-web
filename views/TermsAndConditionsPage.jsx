"use client";
import { useNavigate } from '@/lib/router-compat';
import { Home as HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center pt-4 px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="text-red-600 hover:text-red-800">
            <HomeIcon size={28} />
          </button>
          <h1 className="text-2xl font-bold text-center flex-1">HỢP ĐỒNG VÀ CÁC ĐIỀU KHOẢN</h1>
          <div className="w-7" />
        </div>

        {/* Content */}
        <div className="bg-white border border-black rounded p-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-2">1. ĐIỀU KHOẢN SỬ DỤNG</h2>
            <p>
              Khi truy cập và sử dụng nền tảng giao dịch thương mại của CÔNG TY TNHH ĐẠI NGHĨA TÍN
              (Số ĐKKD: 3702678200), bạn đồng ý tuân thủ và chịu sự ràng buộc của các điều khoản và
              điều kiện được quy định dưới đây.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. QUYỀN VÀ NGHĨA VỤ CỦA THÀNH VIÊN</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thành viên có quyền đăng tải sản phẩm, dịch vụ lên sàn theo quy định.</li>
              <li>Thành viên có nghĩa vụ cung cấp thông tin chính xác, trung thực.</li>
              <li>Thành viên không được thực hiện các hành vi gian lận, giả mạo thông tin.</li>
              <li>Thành viên chịu trách nhiệm về các giao dịch phát sinh từ tài khoản của mình.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. CHÍNH SÁCH GIAO DỊCH</h2>
            <p>
              Mọi giao dịch trên nền tảng phải tuân thủ đúng quy trình, sử dụng đúng tài khoản ngân
              hàng đã đăng ký. Sàn không chịu trách nhiệm đối với các giao dịch ngoài hệ thống.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. CHÍNH SÁCH THƯỞNG VÀ GIẢM GIÁ</h2>
            <p>
              Hệ thống áp dụng chính sách thưởng cho thành viên giới thiệu (7% từ giao dịch) và
              chính sách giảm giá cho thành viên được chỉ định. Mọi thay đổi về chính sách sẽ được
              thông báo trước ít nhất 7 ngày.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. BẢO MẬT THÔNG TIN</h2>
            <p>
              Thông tin cá nhân của thành viên được bảo mật theo quy định pháp luật Việt Nam. Sàn
              cam kết không chia sẻ thông tin cá nhân cho bên thứ ba khi chưa có sự đồng ý của
              thành viên, trừ trường hợp theo yêu cầu của cơ quan nhà nước có thẩm quyền.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. GIẢI QUYẾT TRANH CHẤP</h2>
            <p>
              Các tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng. Nếu không đạt
              được thỏa thuận, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền
              theo quy định pháp luật Việt Nam.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. ĐIỀU KHOẢN CHẤM DỨT HỢP ĐỒNG</h2>
            <p>
              Sàn có quyền đình chỉ hoặc chấm dứt tài khoản thành viên vi phạm điều khoản sử dụng
              mà không cần thông báo trước trong các trường hợp vi phạm nghiêm trọng.
            </p>
          </section>

          <div className="border-t pt-4 text-center text-xs text-gray-500">
            © CÔNG TY TNHH ĐẠI NGHĨA TÍN — Số ĐKKD: 3702678200
          </div>
        </div>
      </div>
    </div>
  );
}
