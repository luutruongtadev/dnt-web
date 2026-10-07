"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Building2, Camera } from 'lucide-react';
import { getMe, updateAvatarFile } from '../services/authService';
import { downloadContract } from '../services/contractService';
import { getAvatarUrl } from '../utils/user';
import planetImage from '../assets/planet.jpg';
import ContractModal from './ContractModal';

const DEFAULT_AVATAR = 'https://th.bing.com/th/id/OIP.aqzvZTh44zgk38UdpdE1KQHaHa?rs=1&pid=ImgDetMain';

const CompanyInfoTable = ({ userCountry = 'vi' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'vi';
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState({ contract: false });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractFiles, setContractFiles] = useState([]);
  const [contractActiveIndex, setContractActiveIndex] = useState(0);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

  const countryData = {
    vi: {
      companyName: 'CÔNG TY TNHH ĐẠI NGHĨA TÍN',
      mst: '3702678200',
      soGphd: '1234567890',
    },
    en: {
      companyName: 'US TECHNOLOGY CORPORATION',
      mst: '9876543210',
      soGphd: 'GP987654321',
    },
  };
  const fallback = countryData[userCountry] || countryData.vi;

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const response = await getMe(authToken);
        setUserData(response.data);
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUserData(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUserData(JSON.parse(storedUser));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const openDoc = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewContract = async () => {
    setDlLoading((prev) => ({ ...prev, contract: true }));
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await getMe(authToken);
      const user = response.data;
      const blob = await downloadContract({
        benAIdentityNumber: user?.identityNumber || user?.cccd || '',
        benAName: user?.full_name || user?.username || '',
        benAAddress: user?.address_no || '',
        returnBlob: true,
      });
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Lỗi xem hợp đồng: ' + err.message);
    } finally {
      setDlLoading((prev) => ({ ...prev, contract: false }));
    }
  };

  const handleOpenContractModal = async () => {
    setContractError('');
    setContractModalOpen(true);
    setContractLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await getMe(authToken);
      const user = response.data;

      const generateResponse = await axios.post(
        `${API_URL}/contract/generate`,
        {
          benAIdentityNumber: user?.identityNumber || user?.cccd || '',
          benAName: user?.full_name || user?.username || '',
          benAAddress: user?.address_no || '',
          collateralCode: 'CONTRACT_TEMPLATE',
        },
        { responseType: 'blob', headers: { 'Content-Type': 'application/json' } }
      );

      const contentDisposition = generateResponse.headers?.['content-disposition'] || '';
      let generatedFileName = 'contract.docx';
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
      if (match) generatedFileName = match[1].replace(/['"]/g, '').trim();

      const generatedBlob = new Blob([generateResponse.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const generatedUrl = window.URL.createObjectURL(generatedBlob);

      const collateralsResponse = await axios.get(`${API_URL}/collaterals/download/CONTRACT`);
      const collateralFilesRaw = collateralsResponse.data?.files || [];
      const collateralFiles = await Promise.all(
        collateralFilesRaw.filter(Boolean).map(async (rawUrl, index) => {
          const clean = String(rawUrl).replace(/`/g, '').trim();
          const downloadName = clean.split('?')[0].split('/').pop() || `file_${index + 1}.pdf`;
          try {
            const fileResp = await axios.get(clean, { responseType: 'blob' });
            const contentType = fileResp.headers?.['content-type'] || 'application/pdf';
            const inlineBlob = new Blob([fileResp.data], { type: contentType });
            return { type: 'collateral', url: window.URL.createObjectURL(inlineBlob), label: `File ${index + 1}`, downloadName };
          } catch {
            return { type: 'collateral', url: clean, label: `File ${index + 1}`, downloadName };
          }
        })
      );

      setContractFiles([
        { type: 'generated', kind: 'docx', blob: generatedBlob, url: generatedUrl, label: 'Hợp đồng', downloadName: generatedFileName },
        ...collateralFiles,
      ]);
      setContractActiveIndex(0);
    } catch (err) {
      const msg = 'Không thể tải hợp đồng. Vui lòng thử lại.';
      setContractError(msg);
    } finally {
      setContractLoading(false);
    }
  };

  const handleCloseContractModal = () => {
    contractFiles.forEach((f) => { try { window.URL.revokeObjectURL(f.url); } catch {} });
    setContractFiles([]);
    setContractModalOpen(false);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh tối đa 5MB');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert('Vui lòng đăng nhập để cập nhật avatar');
      return;
    }

    setAvatarUploading(true);
    try {
      const response = await updateAvatarFile(authToken, file);
      const updated = response.data;
      setUserData((prev) => ({ ...prev, ...updated }));
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(storedUser), ...updated }));
      }
    } catch (err) {
      alert('Cập nhật avatar thất bại: ' + err.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-2"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const bankName = userData?.bank_name || 'VIETINBANK';
  const bankLabel = currentLang === 'vi'
    ? `SỐ TÀI KHOẢN VIETINBANK: ${userData?.bank_account_number || '108873456789'}`
    : `VIETINBANK ACCOUNT NO: ${userData?.bank_account_number || '108873456789'}`;

  const companyLogo = userData?.company_logo?.url || planetImage;

  return (
    <>
    <div className="w-full h-full px-4 py-4">
      {/* Main layout: 2 columns — left logo+avatar, right info box */}
      <div className="flex flex-row gap-6 items-start">

        {/* LEFT COLUMN: Company logo + user avatar (centered column) */}
        <div className="flex flex-col items-center flex-shrink-0 w-auto">
          {/* Company logo — LARGE, round, main focal point */}
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-blue-700 shadow-lg"
          />

          {/* Contract link below logo */}
          <button
            type="button"
            onClick={handleOpenContractModal}
            className="text-red-600 font-bold underline text-center leading-tight mt-1"
            style={{ fontSize: 'clamp(8px, 0.75vw, 11px)' }}
          >
            HỢP ĐỒNG
          </button>

          {/* User avatar — small, round, centered below logo. Ấn vào để đổi avatar. */}
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="relative mt-4 rounded-full group disabled:opacity-70"
            title="Đổi avatar"
          >
            <img
              src={getAvatarUrl(userData?.avt) || DEFAULT_AVATAR}
              alt="avatar"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-blue-700"
            />
            <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
              <Camera size={16} className="text-white opacity-0 group-hover:opacity-100" />
            </span>
            {avatarUploading && (
              <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-[10px]">
                ...
              </span>
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {/* User name — centered, uppercase */}
          <div className="font-bold text-sm sm:text-base text-center mt-2 break-words leading-tight">
            {(userData?.full_name || 'NGUYEN VAN A').toUpperCase()}
          </div>
        </div>

        {/* RIGHT COLUMN: Info box — dùng table để cột thẳng hàng, border cùng độ dày */}
        <div className="flex-1 min-w-0">
          <table className="w-full table-auto border-collapse border-2 border-black text-xs sm:text-sm">
            <tbody>
              {/* Header — Company name */}
              <tr>
                <td colSpan={3} className="border-2 border-black px-2 py-0.5 text-center">
                  <span className="font-bold text-blue-700" style={{ fontSize: "clamp(16px, 1.6vw, 26px)", lineHeight: 1.2, display: "block" }}>
                    {userData?.company_name || fallback.companyName}
                  </span>
                </td>
              </tr>

              {/* Row 1: Số ĐKKD */}
              <tr>
                <td className="border-2 border-black bg-gray-100 px-2 py-1.5 font-bold whitespace-nowrap align-middle">
                  {currentLang === 'vi' ? 'Số ĐKKD:' : 'Business Reg. No.:'}
                </td>
                <td className="border-2 border-black px-2 py-1.5 text-center font-bold align-middle">
                  3702678200
                </td>
                <td className="border-2 border-black px-2 py-1.5 text-center align-middle w-px">
                  <button
                    type="button"
                    onClick={() => openDoc(userData?.tax_code_certificate?.url)}
                    disabled={!userData?.tax_code_certificate?.url}
                    className="text-xs py-1 px-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {currentLang === 'vi' ? 'Xem' : 'View'}
                  </button>
                </td>
              </tr>

              {/* Row 2: Số GPHD */}
              <tr>
                <td className="border-2 border-black bg-gray-100 px-2 py-1.5 font-bold whitespace-nowrap align-middle">
                  {currentLang === 'vi' ? 'Số GPHĐ:' : 'License No.:'}
                </td>
                <td className="border-2 border-black px-2 py-1.5 text-center font-bold align-middle">
                  {fallback.soGphd || '-'}
                </td>
                <td className="border-2 border-black px-2 py-1.5 text-center align-middle w-px">
                  <button
                    type="button"
                    onClick={() => openDoc(userData?.business_registration?.url)}
                    disabled={!userData?.business_registration?.url}
                    className="text-xs py-1 px-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {currentLang === 'vi' ? 'Xem' : 'View'}
                  </button>
                </td>
              </tr>

              {/* Row 3: Tài khoản định danh tại ngân hàng (MERGED label + value) */}
              <tr>
                <td colSpan={2} className="border-2 border-black bg-gray-100 px-2 py-1.5 font-bold text-center leading-tight align-middle">
                  {bankLabel}
                </td>
                <td className="border-2 border-black px-2 py-1.5 text-center align-middle w-px">
                  <button
                    type="button"
                    onClick={() => openDoc(userData?.bank_certificate?.url)}
                    disabled={!userData?.bank_certificate?.url}
                    className="text-xs py-1 px-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    {currentLang === 'vi' ? 'Xem' : 'View'}
                  </button>
                </td>
              </tr>

              {/* Row 4: Registered for operation */}
              <tr>
                <td colSpan={3} className="border-2 border-black p-1.5 text-center">
                  <button
                    onClick={handleViewContract}
                    disabled={dlLoading.contract}
                    className="w-full flex items-center justify-center gap-2 text-blue-700 font-bold text-sm hover:text-blue-800 disabled:opacity-50 leading-tight"
                  >
                    {userData?.company_logo?.url ? (
                      <img src={userData.company_logo.url} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <Building2 size={12} className="flex-shrink-0" />
                    )}
                    <span>
                      {dlLoading.contract
                        ? '...'
                        : (currentLang === 'vi'
                          ? '(LOGO) ĐÃ ĐĂNG KÝ HOẠT ĐỘNG'
                          : '(LOGO) REGISTERED FOR OPERATION')}
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

      <ContractModal
        isOpen={contractModalOpen}
        isLoading={contractLoading}
        contractFiles={contractFiles}
        contractActiveIndex={contractActiveIndex}
        setContractActiveIndex={setContractActiveIndex}
        contractError={contractError}
        onClose={handleCloseContractModal}
      />
    </>
  );
};

export default CompanyInfoTable;
