"use client";
import { Navigate } from '@/lib/router-compat';
import { Eye, EyeOff } from "lucide-react";
import { useForgotPasswordFlow, FORGOT_PASSWORD_STEPS } from "./flow";

// STEP 3 — set the new password.
export default function ResetPasswordStep() {
  const {
    t,
    resetToken,
    newPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    passwordValidation,
    newPasswordCrossError,
    isLoading, errorMessage,
    handlePasswordChange, handlePasswordBlur,
    handleResetPassword,
  } = useForgotPasswordFlow();

  // Guard: a valid reset token is required to set a new password.
  if (!resetToken) {
    return <Navigate to={FORGOT_PASSWORD_STEPS.VERIFY} replace />;
  }

  return (
    <>
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          {t('forgotPassword.resetDescription', 'Nhập mật khẩu mới cho tài khoản của bạn.')}
        </p>
      </div>

      {/* New Password */}
      <div className="grid grid-cols-1 items-center gap-4 relative">
        <input
          type={showPassword ? "text" : "password"}
          className={`border p-3 rounded w-full pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${newPassword && !passwordValidation.isValid ? 'border-red-500' :
            newPassword && passwordValidation.isValid ? 'border-green-500' : 'border-gray-300'
            }`}
          placeholder={t('forgotPassword.newPasswordPlaceholder', 'Mật khẩu mới (New Password)')}
          value={newPassword}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {newPasswordCrossError && (
        <p className="text-red-500 text-sm">{newPasswordCrossError}</p>
      )}

      {/* Password requirements */}
      {newPassword && !passwordValidation.isValid && (
        <div className="text-xs space-y-0.5 bg-gray-50 px-3 py-2 rounded">
          <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordValidation.minLength ? '✓' : '✗'}</span>
            {t('forgotPassword.passwordRequirements.minLength', 'Ít nhất 8 ký tự')}
          </div>
          <div className={`flex items-center ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordValidation.hasUppercase ? '✓' : '✗'}</span>
            {t('forgotPassword.passwordRequirements.hasUppercase', 'Ít nhất 1 chữ in hoa (A-Z)')}
          </div>
          <div className={`flex items-center ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordValidation.hasLowercase ? '✓' : '✗'}</span>
            {t('forgotPassword.passwordRequirements.hasLowercase', 'Ít nhất 1 chữ thường (a-z)')}
          </div>
          <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '✗'}</span>
            {t('forgotPassword.passwordRequirements.hasNumber', 'Ít nhất 1 số (0-9)')}
          </div>
          <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '✗'}</span>
            {t('forgotPassword.passwordRequirements.hasSpecialChar', 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)')}
          </div>
        </div>
      )}

      {/* Confirm Password */}
      <div className="grid grid-cols-1 items-center gap-4 relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          className={`border p-3 rounded w-full pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500' :
            confirmPassword && newPassword === confirmPassword && passwordValidation.isValid ? 'border-green-500' : 'border-gray-300'
            }`}
          placeholder={t('forgotPassword.confirmPasswordPlaceholder', 'Xác nhận mật khẩu (Confirm Password)')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Confirm password status */}
      {confirmPassword && (
        <div className={`text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
          }`}>
          <span className="mr-2">{newPassword === confirmPassword ? '✓' : '✗'}</span>
          {newPassword === confirmPassword
            ? t('forgotPassword.passwordMatch', 'Mật khẩu khớp')
            : t('forgotPassword.passwordMismatch', 'Mật khẩu không khớp')
          }
        </div>
      )}

      <div className="text-center">
        {/* reCAPTCHA for the auto-login call right after a successful reset — above the button */}
        <div className="flex justify-center my-2">
          <div id="recaptcha-forgot-reset"></div>
        </div>
        <button
          className={`border-2 border-black font-bold px-6 py-3 rounded w-1/4 transition-all ${isLoading || !passwordValidation.isValid || newPassword !== confirmPassword || newPasswordCrossError
            ? 'opacity-50 cursor-not-allowed bg-gray-100'
            : 'hover:bg-gray-100'
            }`}
          onClick={handleResetPassword}
          disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword || !!newPasswordCrossError}
        >
          {isLoading
            ? t('common.loading', 'Đang xử lý...')
            : t('forgotPassword.resetButton', 'ĐỔI MẬT KHẨU')}
        </button>
        {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      </div>
    </>
  );
}
