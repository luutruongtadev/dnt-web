"use client";
import { Navigate } from '@/lib/router-compat';
import { useForgotPasswordFlow, FORGOT_PASSWORD_STEPS } from "./flow";

// STEP 2 — OTP verification (only reachable in final-chance mode).
export default function VerifyOtpStep() {
  const {
    t,
    resetToken, otpRequired,
    otp, setOtp,
    isLoading, errorMessage,
    handleVerifyOtp,
  } = useForgotPasswordFlow();

  // Guard: cannot land here without having verified the recovery character first
  // (e.g. deep link / refresh drops the in-memory flow state).
  if (!resetToken || !otpRequired) {
    return <Navigate to={FORGOT_PASSWORD_STEPS.VERIFY} replace />;
  }

  return (
    <>
      <div className="text-center mb-4">
        <p className="text-gray-600 text-sm">
          {t('forgotPassword.otpDescription', 'Vui lòng nhập mật mã của bạn.')}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          {t('forgotPassword.otpDescriptionHint', '(đây là mật mã OTP bạn tự đặt trong phần cài đặt tài khoản, không phải mã hệ thống gửi)')}
        </p>
      </div>

      <div className="grid grid-cols-1 items-center gap-4">
        <input
          type="text"
          className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-2xl tracking-widest"
          value={otp}
          placeholder={t('forgotPassword.otpPlaceholder', 'Nhập mật mã OTP')}
          onChange={(e) => setOtp(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="one-time-code"
          spellCheck={false}
          disabled={isLoading}
        />
      </div>

     
      <div className="text-center mt-6">
        <button
          className={`border-2 border-black font-bold px-6 py-3 rounded w-1/4 transition-all ${isLoading || !otp.trim()
            ? 'opacity-50 cursor-not-allowed bg-gray-100'
            : 'hover:bg-gray-100'
            }`}
          onClick={handleVerifyOtp}
          disabled={isLoading || !otp.trim()}
        >
          {isLoading ? t('common.loading', 'Đang xử lý...') : t('forgotPassword.verifyOtpButton', 'XÁC THỰC')}
        </button>
         {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}

      </div>
    </>
  );
}
