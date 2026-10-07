"use client";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useForgotPasswordFlow } from "./flow";

// STEP 1 — verify bank account + recovery character.
export default function VerifyRecoveryStep() {
  const {
    t,
    bankAccountId, setBankAccountId,
    recoveryString, setRecoveryString,
    showRecoveryString, setShowRecoveryString,
    isLoading, errorMessage, isBlocked, isTempBlocked,
    tempBlockRemainingSeconds, formatCountdown,
    triggeredByLoginFailure, triggeredByFinalChance,
    handleVerifyRecoveryString,
  } = useForgotPasswordFlow();

  return (
    <>
      {/* Warning message for login failure trigger - hide when blocked */}
      {triggeredByLoginFailure && !isBlocked && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <ShieldCheck size={20} />
          <span>{t('forgotPassword.loginFailureWarning', 'Bạn đã đăng nhập sai quá 5 lần. Vui lòng xác thực để khôi phục tài khoản.')}</span>
        </div>
      )}

      {/* Message for final chance security check */}
      {triggeredByFinalChance && !isBlocked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <ShieldCheck size={20} />
          <span>{t('forgotPassword.recoveryRequiredMessage', 'Tài khoản của bạn đã được mở khóa. Vui lòng xác thực chuỗi khôi phục để tiếp tục.')}</span>
        </div>
      )}

      {/* Blocked account warning */}
      {isBlocked && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span>{t('forgotPassword.errors.accountBlocked', 'Tài khoản đã bị khóa vĩnh viễn. Vui lòng liên hệ hỗ trợ.')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-center gap-4">
        <input
          type="text"
          className="border p-3 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder={t('forgotPassword.bankAccountPlaceholder', 'Số tài khoản ngân hàng (Bank Account ID)')}
          value={bankAccountId}
          onChange={(e) => setBankAccountId(e.target.value)}
          disabled={isLoading || isBlocked || isTempBlocked}
        />
      </div>

      <div className="relative">
        <input
          type={showRecoveryString ? "text" : "password"}
          className="border p-3 rounded w-full pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder={t('forgotPassword.recoveryStringPlaceholder', 'ký tự khôi phục tài khoản')}
          value={recoveryString}
          onChange={(e) => setRecoveryString(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          disabled={isLoading || isBlocked || isTempBlocked}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowRecoveryString(!showRecoveryString)}
          disabled={isLoading || isBlocked || isTempBlocked}
        >
          {showRecoveryString ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

     

      <div className="text-center mt-6">
        {/* reCAPTCHA v2 Checkbox — placed above the action button */}
        <div className="flex justify-center my-2">
          <div id="recaptcha-forgot"></div>
        </div>
        <button
          className={`border-2 border-black font-bold px-6 py-3 rounded w-1/4 transition-all ${isLoading || isBlocked || isTempBlocked
            ? 'opacity-50 cursor-not-allowed bg-gray-100'
            : 'hover:bg-gray-100'
            }`}
          onClick={handleVerifyRecoveryString}
          disabled={isLoading || isBlocked || isTempBlocked}
        >
          {isTempBlocked
            ? `${t('forgotPassword.tempBlockedCountdown', 'Còn lại')} ${formatCountdown(tempBlockRemainingSeconds)}`
            : isLoading
              ? t('common.loading', 'Đang xử lý...')
              : t('forgotPassword.verifyButton', 'XÁC THỰC')}
        </button>
         {errorMessage && !isBlocked && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      </div>
    </>
  );
}
