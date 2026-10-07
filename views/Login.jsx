"use client";

import { useDispatch, useSelector } from 'react-redux';
import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import { useNavigate, useLocation } from '@/lib/router-compat';
import { Eye, EyeOff, KeyRound, CheckCircle, QrCode } from "lucide-react";
import { login, recoverLogin } from "../services/authService";
import { loginAction, changePasswordAction } from '../context/action/authActions';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import useRecaptcha from '../hooks/useRecaptcha';
import { generateQrSession, checkQrStatus, verifyQrSession } from "../services/authService";
import QRModalComponent from '../components/QRModalComponent';
import PageHeaderWithOutColorPicker from '../components/PageHeaderWithOutColorPicker';
import { browserName, osName, deviceType, osVersion } from 'react-device-detect';


export default function LoginPage() {
  const { t } = useTranslation();
  const [color, setColor] = useState(localStorage.getItem("selectedColor"));
  const [cccd, setCccd] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPermanentlyBlocked, setIsPermanentlyBlocked] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrSessionId, setQrSessionId] = useState(null);
  const [isShowRecover, setIsShowRecover] = useState(false);
  const [step, setStep] = useState('LOGIN'); // LOGIN, RECOVERY, OTP
  const [context, setContext] = useState(null); // wrong_password, post_login
  const [otp, setOtp] = useState("");
  const [otpFlow, setOtpFlow] = useState(null); // 'RECOVERY' | 'UNFAMILIAR_DEVICE'
  const [savedRecaptcha, setSavedRecaptcha] = useState("");
  const [locationData, setLocationData] = useState(null);

  // reCAPTCHA v2 Invisible — one widget per form action
  const { getToken: getLoginToken, reset: resetLoginCaptcha } = useRecaptcha('recaptcha-login');
  const { getToken: getOtpToken, reset: resetOtpCaptcha } = useRecaptcha('recaptcha-otp');

  const [recoveryCharacter, setRecoveryCharacter] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  // Get location data on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const TOKEN = process.env.NEXT_PUBLIC_IPINFO_API_TOKEN;
        if (!TOKEN) {
          console.warn("VITE_IPINFO_API_TOKEN not configured");
          setLocationData(null);
          return;
        }

        const response = await fetch(`https://ipinfo.io/json?token=${TOKEN}`);
        const data = await response.json();
        
        console.log("Location data received:", data);
        setLocationData({
          city: data.city,
          region: data.region
        });
      } catch (err) {
        console.error("Lỗi lấy vị trí:", err);
        setLocationData(null);
      }
    };
    
    getLocation();
  }, []);

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
  }, [color]);

  // Check for success message from forgot password flow
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent showing message again on refresh
      navigate(location.pathname, { replace: true, state: {} });
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  // reCAPTCHA widgets are managed by the useRecaptcha hooks above.

  // Check for sessionId in query params and verify QR login
  useEffect(() => {
    const checkSessionAndVerify = async () => {
      const searchParams = new URLSearchParams(location.search);
      const sessionId = searchParams.get('sessionId');

      if (sessionId) {
        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            await verifyQrSession(sessionId);
            // After successful verification, we can optionally clear the query param
            // or show a success message. For now, we'll just log it.
            console.log("QR Session verified successfully");
            // Navigate to home or remove query param to prevent re-verification
            navigate('/', { replace: true });
          } catch (error) {
            console.error("QR Verification failed:", error);
            // Optionally show error to user
          }
        } else {
          // If no token, just show normal login screen (which is this page)
          // We might want to remove the sessionId from URL to avoid confusion?
          // For now, leaving it as per requirement "if authtoken not available, show screen login nomal"
        }
      }
    };

    checkSessionAndVerify();
  }, [location.search, navigate]);

  // Stores the session and routes home — or, if this login was reached via the
  // /guide-rules permanent-block recovery flow (step 3, logging in with the
  // platform-issued password), routes to the new security setup page instead.
  const completeLogin = (token, userData) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    dispatch(loginAction(userData));
    if (location.state?.recoveryFlow) {
      navigate('/setup-new-security', { state: { fromRecovery: true } });
    } else {
      navigate("/");
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");
    setIsPermanentlyBlocked(false);
    try {
      // Read the token the user obtained by checking the reCAPTCHA checkbox
      const recaptchaToken = getLoginToken();
      if (!recaptchaToken) {
        alert(t('auth.captchaRequired', 'Vui lòng hoàn thành xác thực reCAPTCHA'));
        return;
      }

      setSavedRecaptcha(recaptchaToken);

      // Prepare additional login data
      const device_name = `${browserName} ${osName} ${osVersion} ${deviceType}`;
      const login_type = "password";
      const location = (locationData?.city && locationData?.region) 
        ? `${locationData.city}, ${locationData.region}` 
        : null;

      const response = await login(cccd, password, recaptchaToken, device_name, login_type, location);
      console.log(response);

      // Reset reCAPTCHA sau khi gửi request
      resetLoginCaptcha();

      // Handle TEMP_BLOCKED
      if (response.data?.tempBlockedUntil) {
        const blockedUntil = new Date(response.data.tempBlockedUntil);
        const formattedTime = blockedUntil.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        setErrorMessage(t('auth.tempBlockedUntil', `Tài khoản đang bị khóa tạm thời. Vui lòng quay lại lúc ${formattedTime}`, { time: formattedTime }));
        return;
      }

      // Handle permanent BLOCKED
      if (response.data?.blocked || response.data?.isBlocked) {
        setIsPermanentlyBlocked(true);
        return;
      }

      // Handle RECOVERY_REQUIRED
      if (response.data?.requiresRecovery) {
        const reason = response.data?.reason;

        if (reason === 'FINAL_CHANCE_SECURITY_CHECK') {
          navigate('/forgot-password', {
            state: {
              bankAccountId: cccd,
              triggeredByFinalChance: true
            }
          });
          return;
        }

        // Default to login failure behavior for TOO_MANY_LOGIN_FAILURES or other reasons
        navigate('/forgot-password', {
          state: {
            bankAccountId: cccd,
            triggeredByLoginFailure: true
          }
        });
        return;
      }

      if (response.data?.require_recovery_character) {
        alert(t('auth.tempBlocked', 'Tài khoản đang bị tạm khóa. Vui lòng nhập ký tự khôi phục để xác thực.'));
        setStep('RECOVERY');
        setContext(response.data.context);
        return;
      }

      if (response.status == 200) {
        if (response.data?.error?.status === 401) {
          // Legacy error handling or unexpected 200 with error
          setErrorMessage(t('auth.loginError', 'THÔNG TIN NHẬP CHƯA CHÍNH XÁC, VUI LÒNG NHẬP LẠI'));
          return;
        }

        if (response.data?.token) {
          // Standard login success (if applicable)
          completeLogin(response.data.token, response.data.user);
        } else if (response.data?.require_recovery_character) {
          // Redundant check but safe
          alert(t('auth.tempBlocked', 'Tài khoản đang bị tạm khóa. Vui lòng nhập ký tự khôi phục để xác thực.'));
          setStep('RECOVERY');
          setContext(response.data.context);
        } else {
          // Unexpected success without token or flow instructions
          setErrorMessage(t('auth.loginError', 'THÔNG TIN NHẬP CHƯA CHÍNH XÁC, VUI LÒNG NHẬP LẠI'));
        }
      }
    } catch (error) {
      // Reset reCAPTCHA khi có lỗi
      resetLoginCaptcha();

      // Handle TEMP_BLOCKED from error response
      if (error.response?.data?.tempBlockedUntil) {
        const blockedUntil = new Date(error.response.data.tempBlockedUntil);
        const formattedTime = blockedUntil.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        setErrorMessage(t('auth.tempBlockedUntil', `Tài khoản đang bị khóa tạm thời. Vui lòng quay lại lúc ${formattedTime}`, { time: formattedTime }));
        return;
      }

      // Handle permanent BLOCKED from error response
      if (error.response?.data?.blocked || error.response?.data?.isBlocked) {
        setIsPermanentlyBlocked(true);
        return;
      }

      // Handle OTP required for unfamiliar device
      if (error.response?.data?.error === 'OTP_REQUIRED' || error.response?.data?.requiresOTP) {
        setStep('OTP');
        setOtpFlow('UNFAMILIAR_DEVICE');
        setErrorMessage(error.response.data.message || t('auth.requireOtp', 'Thiết bị lạ. Vui lòng xác thực OTP.'));
        return;
      }

      // Handle RECOVERY_REQUIRED from error response
      if (error.response?.data?.requiresRecovery) {
        const reason = error.response.data?.reason;

        if (reason === 'FINAL_CHANCE_SECURITY_CHECK') {
          navigate('/forgot-password', {
            state: {
              bankAccountId: cccd,
              triggeredByFinalChance: true
            }
          });
          return;
        }

        navigate('/forgot-password', {
          state: {
            bankAccountId: cccd,
            triggeredByLoginFailure: true
          }
        });
        return;
      }

      if (error.response?.data?.require_recovery_character) {
        setStep('RECOVERY');
        setContext(error.response.data.context);
        return;
      }

      setErrorMessage(t('auth.invalidCredentials', 'Thông tin đăng nhập không chính xác!'));
    }
  };

  const handleOpenQrModal = async () => {
    setIsQrModalOpen(true);
    setIsQrLoading(true);
    setQrError("");
    setQrDataUrl(null);
    setQrSessionId(null);
    try {
      const deviceInfo = navigator.userAgent || 'Unknown Device';
      let ipAddress = null;
      try {
        const ipRes = await axios.get('https://api.ipify.org?format=json');
        ipAddress = ipRes.data?.ip || null;
      } catch (e) {
        ipAddress = null;
      }
      const response = await generateQrSession(deviceInfo, ipAddress);
      const qrCode = response.data?.qrCode;
      const sessionId = response.data?.sessionId;

      if (qrCode) {
        setQrDataUrl(qrCode);
        if (sessionId) {
          setQrSessionId(sessionId);
        }
      } else {
        setQrError(t('auth.qrError', 'Không lấy được mã QR, vui lòng thử lại'));
      }
    } catch (error) {
      setQrError(error.message || t('auth.qrError', 'Không lấy được mã QR, vui lòng thử lại'));
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false);
    setQrDataUrl(null);
    setQrError("");
    setIsQrLoading(false);
    setQrSessionId(null);
  };

  // Poll for QR login status
  useEffect(() => {
    let pollInterval;
    let startTime = Date.now();

    if (isQrModalOpen && qrSessionId && !isQrLoading) {
      pollInterval = setInterval(async () => {
        // Check timeout (60 seconds)
        if (Date.now() - startTime > 60000) {
          clearInterval(pollInterval);
          setQrError(t('auth.qrTimeout', 'Mã QR đã hết hạn. Vui lòng thử lại.'));
          return;
        }

        try {
          const response = await checkQrStatus(qrSessionId);
          if (response?.status === 200 && response.data?.token) {
            // Login success
            clearInterval(pollInterval);
            handleCloseQrModal();

            completeLogin(response.data.token, response.data.user);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isQrModalOpen, qrSessionId, isQrLoading, dispatch, navigate, t]);

  const handleRecoverLogin = async () => {
    if (!recoveryCharacter) {
      alert(t('auth.enterRecoveryChar', 'Vui lòng nhập ký tự khôi phục'));
      return;
    }

    try {
      const response = await recoverLogin(cccd, recoveryCharacter);
      const { data } = response || {};

      if (data?.blocked) {
        alert(data.message || t('auth.userBlocked', 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'));
        return;
      }

      if (data?.require_change_password) {
        dispatch(changePasswordAction({ cccd }));
        navigate('/change-password', { state: { cccd, context: 'recovery_flow' } });
        return;
      }

      if (data?.require_otp) {
        setStep('OTP');
        setOtpFlow('RECOVERY');
        return;
      }

      if (data?.success === false) {
        alert(data.message || t('auth.recoverError', 'Ký tự khôi phục không chính xác'));
      }

    } catch (error) {
      console.error('Recover login error:', error);
      const serverMessage = error?.response?.data?.message || t('auth.recoverError', 'Ký tự khôi phục không chính xác');
      alert(serverMessage);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Vui lòng nhập mã OTP");
      return;
    }

    if (otpFlow === 'UNFAMILIAR_DEVICE') {
      try {
        const device_name = `${browserName} ${osName} ${osVersion} ${deviceType}`;
        const login_type = "password";
        const loc = (locationData?.city && locationData?.region)
          ? `${locationData.city}, ${locationData.region}`
          : null;

        const recaptchaToken = getOtpToken();
        if (!recaptchaToken) {
          alert(t('auth.captchaRequired', 'Vui lòng hoàn thành xác thực reCAPTCHA'));
          return;
        }

        const response = await login(cccd, password, recaptchaToken, device_name, login_type, loc, otp);

        if (response.status === 200 && response.data?.token) {
          completeLogin(response.data.token, response.data.user);
        } else {
          setErrorMessage(t('auth.loginError', 'THÔNG TIN NHẬP CHƯA CHÍNH XÁC, VUI LÒNG NHẬP LẠI'));
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || t('auth.invalidOtp', 'Mã OTP không chính xác'));
        resetOtpCaptcha();
      }
      return;
    }

    try {
      // Import verifyOtp from services if not already imported, or use axios directly here if needed quickly
      // Assuming I added verifyOtp to authService in the previous step
      const { verifyOtp } = await import("../services/authService");
      const response = await verifyOtp(cccd, otp);
      const { data } = response || {};

      if (data?.blocked) {
        alert(data.message || t('auth.userBlocked', 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'));
        return;
      }

      if (data?.require_change_password) {
        dispatch(changePasswordAction({ cccd }));
        navigate('/change-password', { state: { cccd, context: 'otp_flow' } });
        return;
      }

      if (data?.success === false) {
        alert(data.message || "OTP không chính xác");
      }

    } catch (error) {
      console.error("OTP verification error:", error);
      const serverMessage = error?.response?.data?.message || "OTP verification failed";
      alert(serverMessage);
    }
  }



  const handleScanResult = (result) => {
    console.log('QR Scan Result:', result);
    alert(`QR Code scanned: ${result}`);
    handleCloseQrModal();
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-transparent backdrop-blur-md p-6 rounded-lg w-full max-w-4xl mx-auto">
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix="2"
          title={t('auth.loginTitle', 'ĐĂNG NHẬP')}
        />

        {/* LOGIN */}
        <div className="mt-6">
          {/* MÃ QR Row */}
          <div className="grid grid-cols-8">
            <div className="col-span-7"></div>
            <div className="col-span-1 p-2 font-bold text-sm border flex justify-center items-center rounded-sm cursor-pointer hover:bg-gray-100" onClick={handleOpenQrModal}>
              <QrCode size={20} />
            </div>
          </div>

          {/* Success Message from Password Recovery */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mt-4 flex items-center gap-2 animate-fade-in">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <input
                type="text"
                className="border p-2 rounded w-full"
                placeholder={t('auth.idPlaceholder', 'TK BANK (ID)')}
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 items-center gap-4 relative">
              <input
                type={showPassword ? "text" : "password"}
                className="border p-2 rounded w-full pr-10"
                placeholder={t('auth.password', 'MẬT KHẨU (Password)')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* reCAPTCHA v2 Checkbox — hidden when success message is shown (post password-change redirect) */}
            {!successMessage && (
              <div className="flex justify-center my-4">
                <div id="recaptcha-login"></div>
              </div>
            )}

            {step === 'LOGIN' && !isShowRecover && (
              <>
                <div className="text-center mt-4">
                  <button
                    className={`border-2 border-black font-bold px-1 py-2 rounded flex-1`}
                    onClick={handleLogin}
                  >
                    {t('auth.login', 'ĐĂNG NHẬP')} <br />
                  </button>
                </div>

                {/* Forgot Password Link (AC-1) */}
                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center justify-center gap-1 mx-auto"
                    onClick={() => navigate('/forgot-password', { state: { bankAccountId: cccd } })}
                  >
                    <KeyRound size={14} />
                    {t('auth.forgotPassword', 'Quên mật khẩu?')}
                  </button>
                </div>
              </>
            )}

            {/* Show Recovery Input if explicitly shown OR if step is RECOVERY */}
            {(isShowRecover || step === 'RECOVERY') && (
              <div className="text-center mt-4 flex justify-center items-center gap-4">
                <div className="flex-1/2">
                  <input
                    type="text"
                    className='border p-2 rounded w-full'
                    placeholder={t('auth.enter', 'NHẬP KÝ TỰ KHÔI PHỤC TÀI KHOẢN ĐỂ MỞ KHOÁ')}
                    value={recoveryCharacter}
                    onChange={(e) => setRecoveryCharacter(e.target.value)}
                  />
                </div>
                <button
                  className={`border-2 border-black font-bold px-1 py-2 rounded flex-1`}
                  onClick={handleRecoverLogin}

                >
                  {t('common.confirm', 'MỞ KHOÁ TÀI KHOẢN')} <br />
                </button>
              </div>
            )}



            {isPermanentlyBlocked && (
              <h2 className="text-xl text-center text-red-500">
                {t('auth.permanentlyBlockedPrefix', 'Tài khoản này đang bị khóa vĩnh viễn. Vui lòng')}{' '}
                <button
                  type="button"
                  className="underline text-blue-600 hover:text-blue-800"
                  onClick={() => navigate('/guide-rules')}
                >
                  {t('auth.contactLink', 'Liên hệ')}
                </button>{' '}
                {t('auth.permanentlyBlockedSuffix', 'và làm theo hướng dẫn.')}
              </h2>
            )}

            {!isPermanentlyBlocked && errorMessage && (
              <h2 className="text-base text-center text-red-500">
                {errorMessage} <br />

              </h2>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModalComponent
        isOpen={isQrModalOpen}
        onClose={handleCloseQrModal}
        isLoading={isQrLoading}
        error={qrError}
        qrDataUrl={qrDataUrl}
        onScanResult={handleScanResult}
        isAuthenticated={true}
      />

      {/* OTP Popup Modal */}
      {step === 'OTP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm mx-4">
            <h3 className="text-xl font-bold mb-4 text-center">
              {t('forgotPassword.otpTitle', 'XÁC THỰC MẬT MÃ OTP')}
            </h3>
            <p className="text-gray-600 mb-4 text-center text-sm">
              {t('forgotPassword.otpDescription', 'Vui lòng nhập mật mã OTP đã được gửi đến kênh đăng ký của bạn.')}
            </p>
            {errorMessage && (
              <div className="text-red-500 text-sm text-center mb-4">
                {errorMessage}
              </div>
            )}
            <input
              type="text"
              className="border p-2 rounded w-full mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('forgotPassword.errors.otpRequired', 'Nhập mã OTP')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyOtp();
                }
              }}
            />
            {otpFlow === 'UNFAMILIAR_DEVICE' && (
              <div className="flex justify-center mb-4">
                <div id="recaptcha-otp"></div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 border p-2 rounded hover:bg-gray-100 transition"
                onClick={() => {
                  setStep('LOGIN');
                  setOtp("");
                  setErrorMessage("");
                }}
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                className="flex-1 bg-black text-white p-2 rounded hover:bg-gray-800 transition font-bold"
                onClick={handleVerifyOtp}
              >
                {t('common.confirm', 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}