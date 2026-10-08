"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from '@/lib/router-compat';
import { useSelector, useDispatch } from "react-redux";
import { loginAction } from "../context/action/authActions";
import { ChevronDown, ChevronUp, MapPin, Minus, Plus, ScanLine } from "lucide-react";
import PageHeaderWithOutColorPicker from "../components/PageHeaderWithOutColorPicker";
import CccdScanner from "../components/CccdScanner";
import { useTranslation } from 'react-i18next';
import { getSessions, toggleSessionStatus, updateCurrentAddress } from "../services/authService";
import { createOrUpdateBusiness, getMyBusiness, uploadDocumentToStrapi, getMyDocuments, verifyMyBusiness } from "../services/businessService";
import useLocationSelection from "../hooks/useLocationSelection";
import MapPickerModal from "../components/contact/MapPickerModal";

const MOCK_VERIFICATION = String(process.env.NEXT_PUBLIC_MOCK_VERIFICATION || "false").toLowerCase() === "true";

// Account types collected on the registration page (see RegisterAccountTypeSelect)
const BUSINESS_ACCOUNT_TYPES = ["ho_kinh_doanh", "doanh_nghiep"];

// The name on the CCCD / business registration must match the bank account holder,
// so compare without diacritics, casing or extra spacing.
const normalizeName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

function DeviceRow({ item, actionLabel, onActionClick }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-[1fr_auto] border-2 border-black border-t-0 first:border-t-2 bg-white">
      <div className="p-1 text-[13px] leading-tight">
        <div>
          {t('adminControl.device')} <span className="font-bold text-red-700">{item.device_name}</span>
          <span className="ml-2">{item.is_familiar ? t('adminControl.familiarDevice') : t('adminControl.unfamiliarDevice')}</span>
        </div>
        <div>{t('adminControl.loginVia')} {item.login_type === 'password' ? t('adminControl.password') : t('adminControl.qr')}</div>
        <div>{item.location || t('adminControl.unknownLocation')}</div>
      </div>
      <button
        type="button"
        onClick={() => onActionClick(item)}
        className="min-w-16 border-l-2 border-black px-2 text-[12px] font-bold uppercase hover:bg-black hover:text-white"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function DevicePanel({ activeTab, onTabChange, loading, loggedInDevices, loggedOutDevices, loggedInLabel, loggedOutLabel, noLoggedInLabel, noLoggedOutLabel, logoutLabel, loginLabel, onActionClick }) {
  const { t } = useTranslation();
  const devices = activeTab === 'in' ? loggedInDevices : loggedOutDevices;
  const emptyLabel = activeTab === 'in' ? noLoggedInLabel : noLoggedOutLabel;
  const actionLabel = activeTab === 'in' ? logoutLabel : loginLabel;
  return (
    <div className="relative">
      <div className="flex border-2 border-black">
        <button
          type="button"
          onClick={() => onTabChange(activeTab === 'in' ? null : 'in')}
          className={`flex items-center gap-1 px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${activeTab === 'in' ? 'bg-black text-white' : 'text-red-600'}`}
        >
          {loggedInLabel}
          {activeTab === 'in' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button
          type="button"
          onClick={() => onTabChange(activeTab === 'out' ? null : 'out')}
          className={`flex items-center gap-1 border-l-2 border-black px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${activeTab === 'out' ? 'bg-black text-white' : 'text-red-600'}`}
        >
          {loggedOutLabel}
          {activeTab === 'out' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      {activeTab && (
        <div className="absolute left-0 right-0 z-20 mt-1">
          {loading ? (
            <div className="border-2 border-black bg-white p-4 text-center">{t('adminControl.loading')}</div>
          ) : devices.length === 0 ? (
            <div className="border-2 border-black bg-white p-4 text-center">{emptyLabel}</div>
          ) : (
            devices.map((item) => (
              <DeviceRow key={item.id} item={item} actionLabel={actionLabel} onActionClick={onActionClick} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InfoInputRow({ label, placeholder, value, onChange, inputs = [] }) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('adminControl.enter');

  if (inputs.length > 0) {
    const inputCols = inputs.map(input => input.width || '1fr').join(' ');
    return (
      <div className={`grid border-2 border-black border-t-0 text-[13px] leading-tight`} style={{ gridTemplateColumns: `180px ${inputCols}` }}>
        <div className="border-r-2 border-black px-2 py-1 uppercase">{label}</div>
        {inputs.map((input, idx) => (
          <div key={idx} className={idx > 0 ? "border-l-2 border-black" : ""}>
            {input.type === 'button' ? (
              <button type="button" onClick={input.onClick} className="w-full h-full px-2 py-1 text-yellow-700 hover:bg-black hover:text-white">
                {input.label}
              </button>
            ) : input.type === 'select' ? (
              <select
                value={input.value || ""}
                onChange={input.onChange}
                className="w-full h-full px-2 py-1 text-center text-yellow-700 bg-transparent focus:outline-none cursor-pointer hover:bg-black hover:text-white"
                style={{ textAlignLast: 'center' }}
              >
                <option value="" disabled hidden>{input.placeholder || defaultPlaceholder}</option>
                {input.options?.map((opt, i) => (
                  <option key={i} value={opt.value} className="text-black bg-white text-left">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={input.value !== undefined ? input.value : undefined}
                onChange={input.onChange}
                placeholder={input.placeholder || defaultPlaceholder}
                className="w-full px-2 py-1 text-right bg-transparent focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[180px_1fr] border-2 border-black border-t-0 text-[13px] leading-tight">
      <div className="border-r-2 border-black px-2 py-1 uppercase">{label}</div>
      <input
        type="text"
        value={value !== undefined ? value : undefined}
        onChange={onChange}
        placeholder={defaultPlaceholder}
        className="px-2 py-1 text-right bg-transparent focus:outline-none"
      />
    </div>
  );
}

export default function AdminControlPage() {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  // account_type is chosen at registration and saved to localStorage["account_type"].
  // Redux resets on page reload so read the persisted key as fallback.
  const accountType = user?.account_type || localStorage.getItem("account_type") || "ca_nhan";
  const requiresBusinessDoc = BUSINESS_ACCOUNT_TYPES.includes(accountType);
  const bankAccountHolder = user?.full_name || "";

  const hqLocation = useLocationSelection();
  const currLocation = useLocationSelection();
  const hqCountryOptions = (hqLocation.countries || []).map((c) => ({ label: c.vi || c.en, value: c.en || c.vi }));
  const hqProvinceOptions = (hqLocation.provinces || []).map((p) => ({ label: p.vi || p.en, value: p.en || p.vi }));
  const currCountryOptions = (currLocation.countries || []).map((c) => ({ label: c.vi || c.en, value: c.en || c.vi }));
  const currProvinceOptions = (currLocation.provinces || []).map((p) => ({ label: p.vi || p.en, value: p.en || p.vi }));

  const [color, setColor] = useState(localStorage.getItem("selectedColor") || "#ffffff");
  const [deviceTab, setDeviceTab] = useState(null); // 'in' | 'out' | null
  const [addressSectionCollapsed, setAddressSectionCollapsed] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState("session"); // 'session' | 'address'
  const [otpInput, setOtpInput] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  const navigate = useNavigate();

  // Camera state
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const [cameraMode, setCameraMode] = useState(null); // 'cccd_front' | 'cccd_back' | 'business_reg'

  // CCCD document state
  const [cccdFrontDataUrl, setCccdFrontDataUrl] = useState(null);
  const [cccdBackDataUrl, setCccdBackDataUrl] = useState(null);
  const [cccdFrontFileId, setCccdFrontFileId] = useState(null);
  const [cccdBackFileId, setCccdBackFileId] = useState(null);
  const [hasIdCaptured, setHasIdCaptured] = useState(false);
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [cccdScanInfo, setCccdScanInfo] = useState(null);
  const [nameMismatchError, setNameMismatchError] = useState("");

  // Business registration document state
  const [businessRegDataUrl, setBusinessRegDataUrl] = useState(null);
  const [businessRegFileId, setBusinessRegFileId] = useState(null);
  const [hasBusinessVideo, setHasBusinessVideo] = useState(false);

  // Document preview zoom ("thu nhỏ / phóng to")
  const [previewZoomed, setPreviewZoomed] = useState(false);

  // Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Current address ("Địa chỉ hiện tại")
  const [currentAddressInput, setCurrentAddressInput] = useState("");
  const [addressOnMap, setAddressOnMap] = useState("");
  const [addressOnMapLabel, setAddressOnMapLabel] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  // 3.2 - which list is expanded ('posts' | 'joined' | null)
  const [goodsTab, setGoodsTab] = useState(null);
  const [freelanceTab, setFreelanceTab] = useState(null);

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    business_fullname: '',
    tax_code: '',
    headquarters_address: '',
    headquarters_address_province_code: '',
    headquarters_address_nation_code: '',
    current_address: '',
    current_address_province_code: '',
    current_address_nation_code: '',
  });
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessSaving, setBusinessSaving] = useState(false);

  // Verification is complete when every document required for this account type is captured
  const verificationComplete = hasIdCaptured && (!requiresBusinessDoc || hasBusinessVideo);

  const closeIdScanner = useCallback(() => {
    setShowIdScanner(false);
    setScannerError("");
  }, []);

  const handleCccdResult = useCallback(async ({ fullName, idNumber, frontDataUrl, backDataUrl }) => {
    if (!frontDataUrl || !backDataUrl) {
      setScannerError("Chưa lấy được đủ ảnh CCCD hai mặt. Vui lòng quét lại.");
      return;
    }

    // The scanned name must match the bank account holder before anything is uploaded
    if (bankAccountHolder && fullName && normalizeName(fullName) !== normalizeName(bankAccountHolder)) {
      setNameMismatchError(t('adminControl.nameMismatch', { expected: bankAccountHolder }));
      setScannerError(t('adminControl.nameMismatch', { expected: bankAccountHolder }));
      return;
    }

    setNameMismatchError("");
    setCccdFrontDataUrl(frontDataUrl);
    setCccdBackDataUrl(backDataUrl);
    setCccdScanInfo({ fullName: fullName || "", idNumber: idNumber || "" });

    const [frontOk, backOk] = await Promise.all([
      uploadCapturedPhoto(frontDataUrl, "cccd_front"),
      uploadCapturedPhoto(backDataUrl, "cccd_back"),
    ]);
    if (frontOk && backOk) setHasIdCaptured(true);
  }, [bankAccountHolder, t]);

  // Set video srcObject after camera modal mounts
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => setPreviewBlocked(true));
    }
  }, [showCamera, cameraStream]);

  const mockIdCapture = () => {
    const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    setCccdFrontDataUrl(mockDataUrl);
    setCccdBackDataUrl(mockDataUrl);
    setCccdFrontFileId(1);
    setCccdBackFileId(2);
    setHasIdCaptured(true);
  };

  const openIdScanner = () => {
    setScannerError("");
    setShowIdScanner(true);
  };

  const mockBusinessRegCapture = () => {
    const mockDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    setBusinessRegDataUrl(mockDataUrl);
    setBusinessRegFileId(3);
    setHasBusinessVideo(true);
  };

  const openCamera = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setCameraMode(mode);
      setPreviewBlocked(false);
      setShowCamera(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(t("camera.error", "Lỗi truy cập máy ảnh"));
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
    setCameraMode(null);
  };

  const tryStartPreview = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setPreviewBlocked(false);
    } catch {
      setPreviewBlocked(true);
    }
  };

  const uploadCapturedPhoto = async (dataUrl, type) => {
    if (MOCK_VERIFICATION) return true;
    try {
      const uploaded = await uploadDocumentToStrapi(dataUrl, type);
      if (type === 'cccd_front') setCccdFrontFileId(uploaded.id);
      else if (type === 'cccd_back') setCccdBackFileId(uploaded.id);
      else if (type === 'business_reg') setBusinessRegFileId(uploaded.id);
      return true;
    } catch (error) {
      console.error(`Upload ${type} error:`, error);
      alert(t('adminControl.uploadError', 'Tải ảnh lên thất bại. Vui lòng thử lại.'));
      return false;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    if (cameraMode === 'cccd_front') {
      setCccdFrontDataUrl(dataUrl);
      await uploadCapturedPhoto(dataUrl, 'cccd_front');
      closeCamera();
    } else if (cameraMode === 'cccd_back') {
      setCccdBackDataUrl(dataUrl);
      const ok = await uploadCapturedPhoto(dataUrl, 'cccd_back');
      if (ok) setHasIdCaptured(true);
      closeCamera();
    } else if (cameraMode === 'business_reg') {
      setBusinessRegDataUrl(dataUrl);
      const ok = await uploadCapturedPhoto(dataUrl, 'business_reg');
      if (ok) setHasBusinessVideo(true);
      closeCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    document.getElementById("root").style.backgroundColor = color;
  }, [color]);

  const fetchBusiness = useCallback(async () => {
    try {
      setBusinessLoading(true);
      const response = await getMyBusiness();
      const biz = response.data?.data;
      if (biz) {
        setBusinessForm(prev => ({
          ...prev,
          business_fullname: biz.business_fullname || '',
          tax_code: biz.tax_code || '',
          headquarters_address: biz.headquarters_address || '',
          headquarters_address_province_code: biz.headquarters_address_province_code || '',
          headquarters_address_nation_code: biz.headquarters_address_nation_code || '',
          current_address: biz.current_address || '',
          current_address_province_code: biz.current_address_province_code || '',
          current_address_nation_code: biz.current_address_nation_code || '',
        }));
        if (biz.headquarters_address_nation_code) {
          await hqLocation.handleCountryChange({ target: { value: biz.headquarters_address_nation_code } });
          if (biz.headquarters_address_province_code) {
            await hqLocation.handleProvinceChange({ target: { value: biz.headquarters_address_province_code } });
          }
        }
        if (biz.current_address_nation_code) {
          await currLocation.handleCountryChange({ target: { value: biz.current_address_nation_code } });
          if (biz.current_address_province_code) {
            await currLocation.handleProvinceChange({ target: { value: biz.current_address_province_code } });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (verificationComplete) {
      fetchBusiness();
    }
  }, [verificationComplete, fetchBusiness]);

  // Prefill the current address from the logged in user
  useEffect(() => {
    setCurrentAddressInput(user?.address_no || "");
  }, [user?.address_no]);

  useEffect(() => {
    setAddressOnMap(user?.address_on_map || "");
  }, [user?.address_on_map]);

  const handleBusinessFieldChange = (field) => (e) => {
    setBusinessForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveBusiness = async () => {
    try {
      setBusinessSaving(true);

      const documents = [];
      if (cccdFrontFileId || cccdBackFileId) {
        documents.push({
          type: 'cccd',
          file_ids: [cccdFrontFileId, cccdBackFileId].filter(Boolean),
        });
      }
      if (businessRegFileId) {
        documents.push({
          type: 'business_registration',
          file_ids: [businessRegFileId],
        });
      }

      const payload = {
        business_fullname: businessForm.business_fullname,
        tax_code: businessForm.tax_code,
        headquarters_address: businessForm.headquarters_address,
        headquarters_address_province_code: hqLocation.selectedProvince || businessForm.headquarters_address_province_code,
        headquarters_address_nation_code: hqLocation.selectedCountry || businessForm.headquarters_address_nation_code,
        current_address: businessForm.current_address,
        current_address_province_code: currLocation.selectedProvince || businessForm.current_address_province_code,
        current_address_nation_code: currLocation.selectedCountry || businessForm.current_address_nation_code,
        ...(documents.length > 0 ? { documents } : {}),
      };
      await createOrUpdateBusiness(payload);
      alert(t('adminControl.businessSaveSuccess', 'Đã lưu thông tin doanh nghiệp'));
    } catch (error) {
      console.error("Error saving business:", error);
      alert(t('adminControl.businessSaveError', 'Không thể lưu thông tin doanh nghiệp'));
    } finally {
      setBusinessSaving(false);
    }
  };

  const handleUpdateBusiness = async () => {
    await handleSaveBusiness();
    await fetchBusiness();
  };

  useEffect(() => {
    fetchSessions();
    loadExistingDocuments();
  }, []);

  const loadExistingDocuments = async () => {
    try {
      const response = await getMyDocuments();
      const docs = response.data?.data || [];

      let foundCccd = false;
      let foundBizReg = false;

      for (const doc of docs) {
        const files = doc.file || [];
        if (doc.type === 'cccd' && files.length > 0) {
          if (files[0]) { setCccdFrontDataUrl(files[0].url); setCccdFrontFileId(files[0].id); }
          if (files[1]) { setCccdBackDataUrl(files[1].url); setCccdBackFileId(files[1].id); }
          foundCccd = true;
        }
        if (doc.type === 'business_registration' && files.length > 0) {
          setBusinessRegDataUrl(files[0].url);
          setBusinessRegFileId(files[0].id);
          foundBizReg = true;
        }
      }

      if (foundCccd) setHasIdCaptured(true);
      if (foundBizReg) setHasBusinessVideo(true);

      if (docs.length > 0) {
        const verifyRes = await verifyMyBusiness();
        setIsVerified(verifyRes.data?.verified === true);
      }
    } catch (err) {
      console.error('Error loading existing documents:', err);
    }
  };

  const handleMarkVerified = async () => {
    try {
      setVerifying(true);
      const verifyRes = await verifyMyBusiness();
      setIsVerified(verifyRes.data?.verified === true);
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getSessions();
      // BE may return { data: [...] } or { data: { data: [...] } }
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setSessions(list);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (session) => {
    setSelectedSession(session);
    setOtpPurpose("session");
    setShowOtpModal(true);
    setOtpInput("");
  };

  // "XÁC MINH TÀI KHOẢN" — CCCD for every account, plus the business registration
  // when the customer registered as a household / company account.
  const handleVerifyAccount = () => {
    setNameMismatchError("");

    if (!hasIdCaptured) {
      if (MOCK_VERIFICATION) {
        mockIdCapture();
      } else {
        setCccdFrontDataUrl(null);
        setCccdBackDataUrl(null);
        setCccdFrontFileId(null);
        setCccdBackFileId(null);
        setCccdScanInfo(null);
        openIdScanner();
      }
      return;
    }

    if (requiresBusinessDoc && !hasBusinessVideo) {
      if (MOCK_VERIFICATION) {
        mockBusinessRegCapture();
      } else {
        openCamera('business_reg');
      }
      return;
    }

    // Everything captured — rescan the CCCD from the start
    if (MOCK_VERIFICATION) {
      mockIdCapture();
      return;
    }
    setCccdFrontDataUrl(null);
    setCccdBackDataUrl(null);
    setCccdFrontFileId(null);
    setCccdBackFileId(null);
    setHasIdCaptured(false);
    setCccdScanInfo(null);
    openIdScanner();
  };

  const verifyButtonHint = useMemo(() => {
    if (!hasIdCaptured) return t('adminControl.scanCccdStep');
    if (requiresBusinessDoc && !hasBusinessVideo) return t('adminControl.scanBusinessStep');
    return "";
  }, [hasIdCaptured, hasBusinessVideo, requiresBusinessDoc, t]);

  // Pin the exact spot the customer is at, so a hidden location can still be corrected.
  // The picker opens on the map so the customer can drag the pin when GPS is off or inaccurate.
  const handlePinLocation = () => setShowMapPicker(true);

  const handleSendLocation = (latitude, longitude, resolvedAddress) => {
    setAddressOnMap(`${latitude},${longitude}`);
    setAddressOnMapLabel(resolvedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    // Only seed the typed address when the customer has not written one themselves
    if (resolvedAddress && !currentAddressInput.trim()) setCurrentAddressInput(resolvedAddress);
  };

  const handleUpdateAddressClick = () => {
    if (!currentAddressInput.trim()) {
      alert(t('adminControl.addressRequired'));
      return;
    }
    setOtpPurpose("address");
    setShowOtpModal(true);
    setOtpInput("");
  };

  const handleOtpSubmit = async () => {
    if (!otpInput) {
      alert(t('adminControl.otpRequired', 'Vui lòng nhập mã OTP'));
      return;
    }

    if (otpPurpose === "address") {
      try {
        setAddressSaving(true);
        const res = await updateCurrentAddress(
          {
            address_no: currentAddressInput.trim(),
            ...(addressOnMap ? { address_on_map: addressOnMap } : {}),
          },
          otpInput
        );
        // Keep Redux user in sync so the prefill (reads user.address_no) reflects the save.
        const saved = res?.data?.data || {};
        dispatch(loginAction({
          ...user,
          address_no: saved.address_no ?? currentAddressInput.trim(),
          ...(saved.address_on_map !== undefined
            ? { address_on_map: saved.address_on_map }
            : addressOnMap
              ? { address_on_map: addressOnMap }
              : {}),
        }));
        alert(t('adminControl.addressUpdateSuccess'));
        handleCloseOtpModal();
      } catch (error) {
        console.error("Error updating current address:", error);
        const errorMessage = error.response?.data?.error?.message === 'Invalid OTP'
          ? t('adminControl.otpError', 'Mã OTP không chính xác')
          : t('adminControl.addressUpdateError');
        alert(errorMessage);
      } finally {
        setAddressSaving(false);
      }
      return;
    }

    try {
      const response = await toggleSessionStatus(selectedSession.id, otpInput);
      if (response.data?.success) {
        alert(t('adminControl.toggleSuccess', 'Đã thay đổi trạng thái phiên đăng nhập'));
        handleCloseOtpModal();
        fetchSessions();
      } else {
        alert(t('adminControl.toggleError', 'Không thể thay đổi trạng thái'));
      }
    } catch (error) {
      console.error("Error toggling session status:", error);
      const errorMessage = error.response?.data?.message || t('adminControl.otpError', 'Mã OTP không chính xác');
      alert(errorMessage);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtpInput("");
    setSelectedSession(null);
    setOtpPurpose("session");
  };

  const loggedInDevices = sessions.filter(s => s.status === 'login');
  const loggedOutDevices = sessions.filter(s => s.status === 'logout');

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    localStorage.setItem("selectedColor", newColor);
  };

  const getCameraTitle = () => {
    switch (cameraMode) {
      case 'cccd_front': return 'Chụp CCCD - Mặt trước';
      case 'cccd_back': return 'Chụp CCCD - Mặt sau';
      case 'business_reg': return 'Chụp giấy đăng ký kinh doanh';
      default: return t("camera.title", "Xác minh");
    }
  };

  const getCameraInstruction = () => {
    switch (cameraMode) {
      case 'cccd_front': return 'Đặt mặt trước CCCD vào khung hình, đảm bảo rõ nét và đủ ánh sáng';
      case 'cccd_back': return 'Đặt mặt sau CCCD vào khung hình, đảm bảo rõ nét và đủ ánh sáng';
      case 'business_reg': return 'Đặt giấy đăng ký kinh doanh vào khung hình, đảm bảo toàn bộ nội dung hiển thị rõ';
      default: return '';
    }
  };

  const documentPreviews = [
    cccdFrontDataUrl && { src: cccdFrontDataUrl, alt: "CCCD mặt trước", caption: "Mặt trước" },
    cccdBackDataUrl && { src: cccdBackDataUrl, alt: "CCCD mặt sau", caption: "Mặt sau" },
    businessRegDataUrl && { src: businessRegDataUrl, alt: "Giấy ĐKKD", caption: "Giấy ĐKKD" },
  ].filter(Boolean);

  return (
    <>
    <div className="w-full p-1">
      <div className="bg-transparent backdrop-blur-md p-0 rounded-lg w-full mx-auto">
        {/* Header - pinned to the top of the page */}
        <PageHeaderWithOutColorPicker
          color={color}
          onColorChange={handleChangeColor}
          titlePrefix="3"
          title={t('adminControl.title')}
          compact
        />

        <section className="mt-2">
          <h2 className="mb-2 text-2xl font-extrabold uppercase">{t('adminControl.header3_1')}</h2>

          {/* Password / OTP + verification buttons on the left, device panel on the right */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border-2 border-black px-3 py-1 text-center text-base text-red-600 hover:bg-black hover:text-white"
                onClick={() => navigate("/change-password")}
              >
                {t('adminControl.changePassword')}
              </button>
              <button
                type="button"
                onClick={() => navigate("/change-otp-code")}
                className="border-2 border-black px-3 py-1 text-center text-base text-red-600 hover:bg-black hover:text-white"
              >
                {t('adminControl.changeOtpCode')}
              </button>
              {!isVerified && (
                <>
                  <button
                    type="button"
                    className={`border-2 border-black px-3 py-1 text-center text-base font-extrabold uppercase hover:bg-black hover:text-white ${
                      hasIdCaptured ? 'bg-green-100' : ''
                    }`}
                    onClick={handleVerifyAccount}
                    title={!hasIdCaptured ? t('adminControl.scanCccdStep') : undefined}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ScanLine size={20} />
                      {t('adminControl.verifyAccount')}
                    </span>
                  </button>
                  {requiresBusinessDoc ? (
                    <button
                      type="button"
                      className={`border-2 border-black px-3 py-1 text-center text-base font-extrabold uppercase hover:bg-black hover:text-white ${
                        hasBusinessVideo ? 'bg-green-100' : ''
                      }`}
                      onClick={() => MOCK_VERIFICATION ? mockBusinessRegCapture() : openCamera('business_reg')}
                      title={t('adminControl.scanBusinessStep', 'Chụp giấy phép kinh doanh')}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <ScanLine size={20} />
                        XÁC MINH GPKD
                      </span>
                    </button>
                  ) : <div />}
                </>
              )}
            </div>

            <DevicePanel
              activeTab={deviceTab}
              onTabChange={setDeviceTab}
              loading={loading}
              loggedInDevices={loggedInDevices}
              loggedOutDevices={loggedOutDevices}
              loggedInLabel={t('adminControl.loggedInDevicesHeader')}
              loggedOutLabel={t('adminControl.loggedOutDevicesHeader')}
              noLoggedInLabel={t('adminControl.noLoggedInDevices')}
              noLoggedOutLabel={t('adminControl.noLoggedOutDevices')}
              logoutLabel={t('adminControl.logout')}
              loginLabel={t('adminControl.login')}
              onActionClick={handleActionClick}
            />
          </div>

          {/* Verification status badge */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isVerified ? (
              <span className="border-2 border-green-600 bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                ✓ {t('adminControl.verifiedBadge', 'Tài khoản đã được xác minh')}
              </span>
            ) : verificationComplete ? (
              <button
                type="button"
                onClick={handleMarkVerified}
                disabled={verifying}
                className="border-2 border-black px-3 py-1 text-sm font-bold uppercase hover:bg-black hover:text-white disabled:opacity-50"
              >
                {verifying ? t('adminControl.verifying', 'Đang xác minh...') : t('adminControl.markVerified', 'Xác minh ngay')}
              </button>
            ) : null}
          </div>

          {nameMismatchError && (
            <div className="mt-2 max-w-[890px] border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {nameMismatchError}
            </div>
          )}

          {/* Captured documents + zoom control */}
          {documentPreviews.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setPreviewZoomed((prev) => !prev)}
                title={previewZoomed ? t('adminControl.zoomOut') : t('adminControl.zoomIn')}
                className="mb-1 flex h-5 w-5 items-center justify-center border-2 border-black hover:bg-black hover:text-white"
              >
                {previewZoomed ? <Minus size={12} /> : <Plus size={12} />}
              </button>
              <div className="flex flex-wrap gap-3">
                {documentPreviews.map((preview) => (
                  <div key={preview.caption} className="text-center">
                    <img
                      src={preview.src}
                      alt={preview.alt}
                      className={`border border-gray-400 rounded object-cover ${previewZoomed ? 'h-48 w-72' : 'h-16 w-24'}`}
                    />
                    <div className="text-[10px] text-gray-500 mt-0.5">{preview.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cccdScanInfo && (
            <div className="mt-2 max-w-[520px] border-2 border-black bg-white/70 px-3 py-2 text-xs leading-tight">
              {cccdScanInfo.fullName && <div><span className="font-bold">Họ tên:</span> {cccdScanInfo.fullName}</div>}
              {cccdScanInfo.idNumber && <div><span className="font-bold">Số CCCD:</span> {cccdScanInfo.idNumber}</div>}
            </div>
          )}

          {/* Current address - shown so the customer can correct it while their location is hidden */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setAddressSectionCollapsed(prev => !prev)}
              className="mb-1 flex items-center gap-1 text-sm font-bold text-red-600 hover:opacity-70"
            >
              {addressSectionCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
          {!addressSectionCollapsed && <div className="mt-1 flex items-center gap-2">
            <div className="grid w-full max-w-[620px] grid-cols-[auto_1fr_auto_auto] border-2 border-black text-[13px] leading-tight">
              <div className="border-r-2 border-black px-2 py-1 text-red-600">
                {t('adminControl.currentAddressLabel')}
              </div>
              <input
                type="text"
                value={currentAddressInput}
                onChange={(e) => setCurrentAddressInput(e.target.value)}
                placeholder={t('adminControl.addressPlaceholder')}
                className="px-2 py-1 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePinLocation}
                title={addressOnMap || t('common.pinLocation', 'GHIM VỊ TRÍ')}
                className={`flex items-center justify-center border-l-2 border-black px-2 text-white hover:bg-blue-800 ${
                  addressOnMap ? 'bg-green-700' : 'bg-blue-700'
                }`}
              >
                <MapPin size={16} />
              </button>
              <button
                type="button"
                onClick={handleUpdateAddressClick}
                disabled={addressSaving}
                className="border-l-2 border-black px-3 py-1 font-bold uppercase hover:bg-black hover:text-white disabled:opacity-50"
              >
                {addressSaving ? t('adminControl.saving', 'Đang lưu...') : t('adminControl.update')}
              </button>
            </div>
          </div>}

          {addressOnMap && (
            <div className="mt-1 flex max-w-[890px] items-start gap-1 text-[11px] leading-tight text-green-700">
              <MapPin size={12} className="mt-[2px] shrink-0" />
              <span>{addressOnMapLabel || addressOnMap}</span>
            </div>
          )}
        </section>

        {/* Business details, only relevant once the required documents are on file */}
        {verificationComplete && (
            <section className="mt-4">
              {businessLoading ? (
                <div className="border-2 border-black p-4 text-center">{t('adminControl.loading')}</div>
              ) : (
                <>
                  <div className="border-t-2 border-black">
                    <InfoInputRow
                      label={t('adminControl.fullCompanyName')}
                      value={businessForm.business_fullname}
                      onChange={handleBusinessFieldChange('business_fullname')}
                    />
                    <InfoInputRow
                      label={t('adminControl.taxCode')}
                      value={businessForm.tax_code}
                      onChange={handleBusinessFieldChange('tax_code')}
                    />
                    <InfoInputRow
                      label={t('adminControl.headquartersAddress')}
                      inputs={[
                        { type: 'input', placeholder: t('adminControl.enter'), width: '1fr', value: businessForm.headquarters_address, onChange: handleBusinessFieldChange('headquarters_address') },
                        { type: 'select', placeholder: t('adminControl.selectProvince'), width: '600px', value: hqLocation.selectedProvince, onChange: hqLocation.handleProvinceChange, options: hqProvinceOptions },
                        { type: 'select', placeholder: t('adminControl.country'), width: '600px', value: hqLocation.selectedCountry, onChange: hqLocation.handleCountryChange, options: hqCountryOptions }
                      ]}
                    />
                  </div>

                  <InfoInputRow
                    label={t('adminControl.currentAddress')}
                    inputs={[
                      { type: 'input', placeholder: t('adminControl.enter'), width: '1fr', value: businessForm.current_address, onChange: handleBusinessFieldChange('current_address') },
                      { type: 'select', placeholder: t('adminControl.selectProvince'), width: '300px', value: currLocation.selectedProvince, onChange: currLocation.handleProvinceChange, options: currProvinceOptions },
                      { type: 'select', placeholder: t('adminControl.country'), width: '300px', value: currLocation.selectedCountry, onChange: currLocation.handleCountryChange, options: currCountryOptions },
                      { type: 'button', label: t('adminControl.map'), width: '300px' },
                      { type: 'button', label: t('adminControl.update'), width: '300px', onClick: handleUpdateBusiness }
                    ]}
                  />

                  <div className="grid grid-cols-[180px_265px_265px_300px] border-2 border-black border-t-0 text-[13px] leading-tight">
                    <div className="border-r-2 border-black px-2 py-1 uppercase">
                      {t('adminControl.ecommerceContract')}
                    </div>
                    <button type="button" className="border-r-2 border-black px-2 py-1 uppercase hover:bg-black hover:text-white">
                      {t('adminControl.normalSignature')}
                    </button>
                    <button type="button" className="border-r-2 border-black px-2 py-1 uppercase hover:bg-black hover:text-white">
                      {t('adminControl.digitalSignature')}
                    </button>
                    <button
                      type="button"
                      className="border-r-2 border-black px-2 py-1 uppercase hover:bg-black hover:text-white disabled:opacity-50"
                      onClick={handleSaveBusiness}
                      disabled={businessSaving}
                    >
                      {businessSaving ? t('adminControl.saving', 'Đang lưu...') : t('adminControl.confirmButton')}
                    </button>
                  </div>
                </>
              )}
            </section>
        )}

        {/* 3.2 + 3.3 */}
        <section className="mt-6">
          <div className="grid gap-y-3" style={{gridTemplateColumns: 'max-content auto'}}>
            <h2 className="flex items-center text-2xl font-extrabold uppercase pr-2">{t('adminControl.header3_2')}</h2>
            <div className="flex border-2 border-black w-fit">
                <button
                  type="button"
                  onClick={() => setGoodsTab((prev) => (prev === 'posts' ? null : 'posts'))}
                  className={`flex items-center gap-1 px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${
                    goodsTab === 'posts' ? 'bg-black text-white' : ''
                  }`}
                >
                  {t('adminControl.postsTab')}
                  {goodsTab === 'posts' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setGoodsTab((prev) => (prev === 'joined' ? null : 'joined'))}
                  className={`flex items-center gap-1 border-l-2 border-black px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${
                    goodsTab === 'joined' ? 'bg-black text-white' : ''
                  }`}
                >
                  {t('adminControl.joinedPostsTab')}
                  {goodsTab === 'joined' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            <h2 className="flex items-center text-2xl font-extrabold uppercase pr-2">{t('adminControl.header3_3', 'CÔNG VIỆC TỰ DO')}</h2>
            <div className="flex border-2 border-black w-fit">
                <button
                  type="button"
                  onClick={() => setFreelanceTab((prev) => (prev === 'posts' ? null : 'posts'))}
                  className={`flex items-center gap-1 px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${
                    freelanceTab === 'posts' ? 'bg-black text-white' : ''
                  }`}
                >
                  {t('adminControl.postsTab')}
                  {freelanceTab === 'posts' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFreelanceTab((prev) => (prev === 'joined' ? null : 'joined'))}
                  className={`flex items-center gap-1 border-l-2 border-black px-3 py-1 text-lg font-extrabold uppercase hover:bg-black hover:text-white ${
                    freelanceTab === 'joined' ? 'bg-black text-white' : ''
                  }`}
                >
                  {t('adminControl.joinedPostsTab')}
                  {freelanceTab === 'joined' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
          </div>

          {goodsTab && (
            <div className="mt-2 max-w-[890px] border-2 border-black p-4 text-center text-sm">
              {t('adminControl.sectionEmpty')}
            </div>
          )}
          {freelanceTab && (
            <div className="mt-2 max-w-[890px] border-2 border-black p-4 text-center text-sm">
              {t('adminControl.sectionEmpty')}
            </div>
          )}
        </section>

      </div>
    </div>

    {/* OTP Modal */}
    {showOtpModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">
            {otpPurpose === 'address'
              ? t('adminControl.currentAddressLabel')
              : selectedSession?.status === 'login'
                ? t('adminControl.logoutDevice')
                : t('adminControl.loginDevice')}
          </h3>
          {otpPurpose === 'session' && (
            <p className="mb-4 text-sm text-gray-600">
              {t('adminControl.device')} <span className="font-semibold">{selectedSession?.device_name}</span>
            </p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {otpPurpose === 'address' ? t('adminControl.enterOtpAddress') : t('adminControl.enterOtpConfirm')}
            </label>
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder={t('adminControl.enterOtp')}
              className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOtpSubmit}
              disabled={addressSaving}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-gray-300 disabled:opacity-50"
            >
              {t('adminControl.confirm')}
            </button>
            <button
              onClick={handleCloseOtpModal}
              className="flex-1 border-2 border-black px-4 py-2 rounded font-bold hover:bg-gray-100"
            >
              {t('adminControl.cancel')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Camera Modal */}
    {showCamera && (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-2xl w-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">{getCameraTitle()}</h2>
            <button
              className="text-gray-700 hover:text-gray-900"
              onClick={closeCamera}
            >
              ✕
            </button>
          </div>
          {getCameraInstruction() && (
            <p className="text-sm text-gray-600 mb-3">{getCameraInstruction()}</p>
          )}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto border border-gray-300 rounded"
            />
            {/* Framing guide - line the document up inside it before capturing */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[62%] w-[86%] border-4 border-dashed border-yellow-400/90" />
            </div>
            <div className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-yellow-300">
              {t('adminControl.frameGuide')}
            </div>
            {previewBlocked && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <button
                  className="bg-white text-black px-3 py-2 rounded"
                  onClick={tryStartPreview}
                >
                  {t("camera.clickToPreview", "Nhấp để xem trước")}
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={capturePhoto}
            >
              {t("camera.capture", "Chụp ảnh")}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={closeCamera}
            >
              {t("camera.cancel", "Hủy bỏ")}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* CCCD Scanner Modal */}
    {showIdScanner && (
      <CccdScanner
        onResult={handleCccdResult}
        onClose={closeIdScanner}
      />
    )}

    {/* Map picker for the current address pin */}
    <MapPickerModal
      isOpen={showMapPicker}
      onClose={() => setShowMapPicker(false)}
      onSendLocation={handleSendLocation}
    />
  </>
  );
}
