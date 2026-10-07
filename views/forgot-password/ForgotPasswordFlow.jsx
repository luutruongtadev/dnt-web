"use client";
import { useState, useEffect } from "react";
import "../../styles/Login.css";
import { useNavigate, useLocation, Outlet } from '@/lib/router-compat';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from "lucide-react";
import { verifyRecoveryString, resetPasswordWithToken, verifyRecoveryOtp, login } from "../../services/authService";
import { loginAction } from "../../context/action/authActions";
import { useTranslation } from 'react-i18next';
import PageHeaderWithOutColorPicker from '../../components/PageHeaderWithOutColorPicker';
import useRecaptcha from '../../hooks/useRecaptcha';
import { FORGOT_PASSWORD_STEPS } from './flow';

/**
 * Layout for the multi-screen forgot-password flow. Holds all shared state +
 * handlers and the common shell (header, colour, container), exposing everything
 * to the step screens through the router <Outlet /> context. It stays mounted
 * across step navigation, so the resetToken and form values survive step changes.
 */
export default function ForgotPasswordFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [color, setColor] = useState(localStorage.getItem("selectedColor"));

  // Form states
  const [bankAccountId, setBankAccountId] = useState(location.state?.bankAccountId || "");
  const [recoveryString, setRecoveryString] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRecoveryString, setShowRecoveryString] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [tempBlockedUntil, setTempBlockedUntil] = useState(null); // Date or null — 10-minute lock after 5 wrong recovery attempts
  const [tempBlockRemainingSeconds, setTempBlockRemainingSeconds] = useState(0);
  const [otpRequired, setOtpRequired] = useState(false); // true when the OTP step is part of this flow (final-chance mode)
  const [newPasswordCrossError, setNewPasswordCrossError] = useState("");

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isValid: false
  });

  // Entry-context flags come from Login via navigation state. Capture them once at
  // mount (lazy initializer) so they survive the index → /verify redirect, which
  // drops location.state from useLocation().
  const [triggeredByLoginFailure] = useState(() => location.state?.triggeredByLoginFailure || false);
  const [triggeredByFinalChance] = useState(() => location.state?.triggeredByFinalChance || false);

  // reCAPTCHA v2 Checkbox — the hooks poll the DOM for their container id, so the
  // widget divs can live inside the individual step screens rendered via <Outlet />.
  const { getToken: getRecoveryToken, reset: resetRecoveryCaptcha } = useRecaptcha('recaptcha-forgot');
  const { getToken: getResetLoginToken, reset: resetResetLoginCaptcha } = useRecaptcha('recaptcha-forgot-reset');

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
  }, [color]);

  // Tick the temp-block countdown every second; clear it once the 10 minutes are up
  // so the user gets their last chance to enter the recovery character again.
  useEffect(() => {
    if (!tempBlockedUntil) {
      setTempBlockRemainingSeconds(0);
      return;
    }
    const tick = () => {
      const seconds = Math.max(0, Math.round((tempBlockedUntil.getTime() - Date.now()) / 1000));
      setTempBlockRemainingSeconds(seconds);
      if (seconds <= 0) {
        setTempBlockedUntil(null);
        setErrorMessage("");
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tempBlockedUntil]);

  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Password validation function
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[~!@#$%^&*()_]/.test(password);
    const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isValid
    };
  };

  // New password must differ from the recovery character and the OTP entered earlier in this flow
  const getNewPasswordCrossError = (password) => {
    if (!password) return "";
    if (recoveryString && password === recoveryString) {
      return t('forgotPassword.errors.passwordSameAsRecovery', 'Mật khẩu mới không được trùng với ký tự khôi phục tài khoản');
    }
    if (otp && password === otp) {
      return t('forgotPassword.errors.passwordSameAsOtp', 'Mật khẩu mới không được trùng với mã OTP');
    }
    return "";
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordValidation(validatePassword(value));
    setNewPasswordCrossError(getNewPasswordCrossError(value));
  };

  const handlePasswordBlur = () => {
    setNewPasswordCrossError(getNewPasswordCrossError(newPassword));
  };

  // Handle verify recovery string
  const handleVerifyRecoveryString = async () => {
    if (tempBlockedUntil && tempBlockRemainingSeconds > 0) return;

    setErrorMessage("");

    if (isBlocked) {
      setErrorMessage(t('forgotPassword.errors.accountBlocked', 'Tài khoản đã bị khóa do nhập sai quá nhiều lần. Vui lòng liên hệ hỗ trợ.'));
      return;
    }

    if (!bankAccountId.trim()) {
      setErrorMessage(t('forgotPassword.errors.bankAccountRequired', 'Vui lòng nhập số tài khoản ngân hàng'));
      return;
    }

    if (!recoveryString.trim()) {
      setErrorMessage(t('forgotPassword.errors.recoveryStringRequired', 'Vui lòng nhập ký tự khôi phục tài khoản'));
      return;
    }

    setIsLoading(true);

    try {
      const recaptchaToken = getRecoveryToken();
      if (!recaptchaToken) {
        setIsLoading(false);
        setErrorMessage(t('auth.captchaRequired', 'Vui lòng hoàn thành xác thực reCAPTCHA'));
        return;
      }

      const response = await verifyRecoveryString(bankAccountId, recoveryString, recaptchaToken);
      if (response.data?.verificationResult === 'PASS' && response.data?.resetToken) {
        setResetToken(response.data.resetToken);

        // Check if OTP is required (is_in_final_chance = true means user was previously TEMP_BLOCKED)
        if (response.data?.requiresOtp) {
          // User is in final chance mode - requires OTP verification
          setOtpRequired(true);
          setErrorMessage("");
          navigate(FORGOT_PASSWORD_STEPS.OTP);
        } else {
          // User is NOT in final chance mode - skip OTP, go directly to reset password
          setOtpRequired(false);
          setErrorMessage("");
          navigate(FORGOT_PASSWORD_STEPS.RESET);
        }
      } else {
        setErrorMessage(t('forgotPassword.errors.verifyFailed', 'Xác thực thất bại. Vui lòng thử lại.'));
      }
    } catch (error) {
      resetRecoveryCaptcha();
      console.error('Verify recovery string error:', error);
      const errorData = error.response?.data;
      // Backend puts the code in `error` as a plain string (e.g. 'TEMP_BLOCKED');
      // keep the object/`code` fallbacks for any other response shapes.
      const errorCode = errorData?.error?.code || errorData?.code || errorData?.error;

      // Handle TEMP_BLOCKED (5 wrong recovery-character attempts) — 10-minute lock,
      // last chance after. Backend sends this in two shapes: with an explicit
      // `tempBlockedUntil` timestamp (account already blocked) or with just
      // `remainingMinutes` (attempt that just tripped the limit) — support both.
      if (errorCode === 'TEMP_BLOCKED' || errorData?.tempBlockedUntil) {
        const blockedUntil = errorData?.tempBlockedUntil
          ? new Date(errorData.tempBlockedUntil)
          : new Date(Date.now() + (errorData?.remainingMinutes || 10) * 60 * 1000);
        setTempBlockedUntil(blockedUntil);
        setErrorMessage(t(
          'forgotPassword.blockedWarning',
          'Bạn đã đăng nhập sai quá 5 lần. Vui lòng xác thực để khôi phục tài khoản.'
        ));
        return;
      }

      // Handle permanent BLOCKED — only when the backend explicitly marks the
      // account blocked. (Do NOT treat every verificationResult === 'FAIL' as a
      // permanent block; most FAIL responses are ordinary validation errors
      // handled by the switch below.)
      if (errorData?.blocked || errorData?.isBlocked || errorCode === 'PERMANENTLY_BLOCKED') {
        if (errorData?.isBlocked || errorCode === 'PERMANENTLY_BLOCKED') {
          navigate('/account-blocked');
          return;
        }
        setIsBlocked(true);
        setErrorMessage(errorData.message || t('forgotPassword.errors.accountBlocked', 'Tài khoản đã bị khóa vĩnh viễn. Vui lòng liên hệ hỗ trợ.'));
        return;
      }

      switch (errorCode) {
        case 'INVALID_RECOVERY_STRING':
          setErrorMessage(t('forgotPassword.errors.invalidRecoveryString', 'Số tài khoản hoặc ký tự khôi phục tài khoản không chính xác'));
          break;
        case 'RECOVERY_NOT_CONFIGURED':
          setErrorMessage(t('forgotPassword.errors.recoveryNotConfigured', 'Tài khoản chưa thiết lập ký tự khôi phục tài khoản'));
          break;
        case 'ACCOUNT_TEMPORARILY_LOCKED':
        case 'TEMP_BLOCKED':
          setErrorMessage(t('forgotPassword.errors.accountLocked', 'Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.'));
          break;
        case 'BLOCKED':
          setIsBlocked(true);
          setErrorMessage(t('forgotPassword.errors.accountBlocked', 'Tài khoản đã bị khóa vĩnh viễn. Vui lòng liên hệ hỗ trợ.'));
          break;
        case 'PERMANENTLY_BLOCKED':
          navigate('/account-blocked');
          break;
        default:
          setErrorMessage(t('forgotPassword.errors.verifyFailed', 'Xác thực thất bại. Vui lòng thử lại.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    setErrorMessage("");

    if (!otp.trim()) {
      setErrorMessage(t('forgotPassword.errors.otpRequired', 'Vui lòng nhập mã OTP'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyRecoveryOtp(resetToken, otp);

      if (response.data?.verificationResult === 'PASS' && response.data?.resetToken) {
        // Update reset token with new one from OTP verification
        setResetToken(response.data.resetToken);
        setErrorMessage("");
        navigate(FORGOT_PASSWORD_STEPS.RESET);
      } else {
        setErrorMessage(t('forgotPassword.errors.otpVerifyFailed', 'Xác thực OTP thất bại. Vui lòng thử lại.'));
      }
    } catch (error) {
      console.error('Verify OTP error:', error);

      const errorCode = error.response?.data?.error?.code || error.response?.data?.code;

      switch (errorCode) {
        case 'INVALID_OTP':
          setErrorMessage(t('forgotPassword.errors.invalidOtp', 'Mật mã OTP không chính xác. Vui lòng kiểm tra lại mật mã bạn đã đặt khi đăng ký.'));
          break;
        case 'OTP_NOT_SET':
          setErrorMessage(t('forgotPassword.errors.otpNotSet', 'Tài khoản chưa thiết lập mật mã OTP. Vui lòng liên hệ hỗ trợ.'));
          break;
        case 'INVALID_RESET_TOKEN':
          setErrorMessage(t('forgotPassword.errors.invalidToken', 'Token không hợp lệ. Vui lòng thử lại từ đầu.'));
          // Go back to verify step
          setResetToken("");
          setOtp("");
          navigate(FORGOT_PASSWORD_STEPS.VERIFY);
          break;
        case 'RESET_TOKEN_EXPIRED':
          setErrorMessage(t('forgotPassword.errors.tokenExpired', 'Token đã hết hạn. Vui lòng xác thực lại.'));
          // Go back to verify step
          setResetToken("");
          setOtp("");
          navigate(FORGOT_PASSWORD_STEPS.VERIFY);
          break;
        case 'BLOCKED':
        case 'PERMANENTLY_BLOCKED':
          navigate('/account-blocked');
          break;
        default:
          setErrorMessage(t('forgotPassword.errors.otpVerifyFailed', 'Xác thực OTP thất bại. Vui lòng thử lại.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    setErrorMessage("");

    if (!passwordValidation.isValid) {
      setErrorMessage(t('forgotPassword.errors.passwordPolicyFailed', 'Mật khẩu không đáp ứng yêu cầu bảo mật'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('forgotPassword.errors.passwordMismatch', 'Mật khẩu xác nhận không khớp'));
      return;
    }

    const crossError = getNewPasswordCrossError(newPassword);
    if (crossError) {
      setNewPasswordCrossError(crossError);
      setErrorMessage(crossError);
      return;
    }

    // Captcha for the auto-login call below — checked up front so we don't change
    // the password and then strand the user on a captcha error.
    const loginRecaptchaToken = getResetLoginToken();
    if (!loginRecaptchaToken) {
      setErrorMessage(t('auth.captchaRequired', 'Vui lòng hoàn thành xác thực reCAPTCHA'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPasswordWithToken(resetToken, newPassword);

      if (response.data?.success) {
        // Auto-login with the new password instead of bouncing back to /login
        try {
          const loginResponse = await login(bankAccountId, newPassword, loginRecaptchaToken);
          const authToken = loginResponse.data?.token || loginResponse.data?.jwt;
          localStorage.setItem("authToken", authToken);
          localStorage.setItem("user", JSON.stringify(loginResponse.data?.user));
          dispatch(loginAction(loginResponse.data?.user));
          navigate('/');
        } catch (autoLoginError) {
          console.error('Auto-login after password reset failed:', autoLoginError);
          resetResetLoginCaptcha();
          // Password change itself succeeded — fall back to manual login instead of stranding the user
          navigate('/', {
            state: {
              message: t('forgotPassword.redirectMessage', 'Mật khẩu đã được đổi thành công. Vui lòng đăng nhập.')
            }
          });
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);

      const httpStatus = error.response?.status;
      // Handle different error response formats from backend
      const errorCode = error.response?.data?.error?.code || error.response?.data?.code || error.response?.data?.error;

      // Handle HTTP 409 - Password same as previous
      if (httpStatus === 409 || errorCode === 'PASSWORD_SAME_AS_PREVIOUS') {
        setErrorMessage(t('forgotPassword.errors.passwordSameAsPrevious', 'Mật khẩu mới phải khác mật khẩu cũ'));
        return;
      }

      switch (errorCode) {
        case 'INVALID_RESET_TOKEN':
          setErrorMessage(t('forgotPassword.errors.invalidToken', 'Token không hợp lệ hoặc đã được sử dụng'));
          // Go back to verify step
          setResetToken("");
          navigate(FORGOT_PASSWORD_STEPS.VERIFY);
          break;
        case 'RESET_TOKEN_EXPIRED':
          setErrorMessage(t('forgotPassword.errors.tokenExpired', 'Token đã hết hạn. Vui lòng xác thực lại.'));
          // Go back to verify step
          setResetToken("");
          navigate(FORGOT_PASSWORD_STEPS.VERIFY);
          break;
        case 'PASSWORD_POLICY_FAILED':
          setErrorMessage(t('forgotPassword.errors.passwordPolicyFailed', 'Mật khẩu không đáp ứng yêu cầu bảo mật'));
          break;
        default:
          setErrorMessage(error.response?.data?.error?.message || error.response?.data?.message || t('forgotPassword.errors.resetFailed', 'Đổi mật khẩu thất bại. Vui lòng thử lại.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isTempBlocked = !!tempBlockedUntil && tempBlockRemainingSeconds > 0;

  // Derive the header title from the current step route.
  const title = location.pathname.startsWith(FORGOT_PASSWORD_STEPS.OTP)
    ? t('forgotPassword.otpTitle', 'XÁC THỰC MẬT MÃ')
    : location.pathname.startsWith(FORGOT_PASSWORD_STEPS.RESET)
      ? t('forgotPassword.resetTitle', 'ĐẶT MẬT KHẨU MỚI')
      : t('forgotPassword.title', 'KHÔI PHỤC MẬT KHẨU');

  // Everything the step screens need, shared via <Outlet />.
  const context = {
    t,
    navigate,
    // form state
    bankAccountId, setBankAccountId,
    recoveryString, setRecoveryString,
    resetToken,
    otp, setOtp,
    newPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    showRecoveryString, setShowRecoveryString,
    passwordValidation,
    newPasswordCrossError,
    // ui state
    isLoading,
    errorMessage,
    isBlocked,
    isTempBlocked,
    tempBlockRemainingSeconds,
    otpRequired,
    triggeredByLoginFailure,
    triggeredByFinalChance,
    // helpers + handlers
    formatCountdown,
    handlePasswordChange,
    handlePasswordBlur,
    handleVerifyRecoveryString,
    handleVerifyOtp,
    handleResetPassword,
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-transparent backdrop-blur-md px-3 py-4 rounded-lg w-full max-w-4xl mx-auto">
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix=""
          title={title}
          leftButton={
            <button
              className="text-gray-600 hover:text-gray-800"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={28} />
            </button>
          }
        />

        <div className="mt-4">
          <div className="space-y-3">
            <Outlet context={context} />
          </div>
        </div>
      </div>
    </div>
  );
}
