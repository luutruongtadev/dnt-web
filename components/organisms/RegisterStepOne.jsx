"use client";
import { useState } from "react"
import PropTypes from "prop-types"
import { Eye, EyeOff, QrCode } from "lucide-react"
import RegisterCountrySelect from "../molecules/RegisterCountrySelect"
import RegisterAccountTypeSelect from "../molecules/RegisterAccountTypeSelect"
import QRModalComponent from "../QRModalComponent"

function SecureField({ name, value, placeholder, onChange, error, visible, onToggleVisible }) {
  const preventEvent = (e) => e.preventDefault()
  return (
    <div className="grid grid-cols-1 items-center gap-4">
      <div className="relative w-full flex items-center">
        <div className="relative w-full">
          <input
            type={visible ? "text" : "password"}
            className="border py-1.5 px-2 rounded w-full pr-10 text-[13px]"
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            onCopy={preventEvent}
            onPaste={preventEvent}
            onCut={preventEvent}
            onContextMenu={preventEvent}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={onToggleVisible}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <span className="text-red-500 ml-2">*</span>
      </div>
      {error ? <p className="text-red-500 text-xs mt-0.5">{error}</p> : null}
    </div>
  )
}

SecureField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  visible: PropTypes.bool,
  onToggleVisible: PropTypes.func.isRequired,
}

export default function RegisterStepOne({
  t,
  countries,
  banks,
  selectedCountry,
  setSelectedCountry,
  validationErrors,
  formData,
  handleInputChange,
  isFormValid,
  isVerifying,
  handleNextClick,
  handleBankNumberBlur,
  isFetchingAccountName,
  accountNameError,
}) {
  const [visibleFields, setVisibleFields] = useState({})
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  const toggleFieldVisible = (name) => {
    setVisibleFields((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleScanResult = (result) => {
    const jsontext = JSON.parse(result)
    handleInputChange({ target: { name: "reference_id", value: jsontext.stk } })
    setIsQrModalOpen(false)
  }

  return (
    <div className="mt-0">
      {/* {error ? <p className="text-red-500">{error}</p> : null} */}
      <div className="grid grid-cols-2 gap-2 mt-0">
        <RegisterCountrySelect
          countries={countries}
          selectedCountry={selectedCountry}
          onChange={(option) => {
            setSelectedCountry(option)
            if (validationErrors.country) {
              // clear error outside
            }
          }}
          placeholder={t("register.countryPlaceholder", "Quốc gia (Nation)")}
          error={validationErrors.country}
        />
        <RegisterAccountTypeSelect
          t={t}
          value={formData.account_type}
          onChange={handleInputChange}
          error={validationErrors.account_type}
        />
      </div>
      <div className="space-y-1.5 mt-1">
        <div className="grid grid-cols-1 items-center gap-4">
          <div className="relative w-full flex items-center">
            <input type="text" className="border py-1.5 px-2 rounded w-full text-[13px]" placeholder={t("register.accountNumberPlaceholder", "ID = SỐ TÀI KHOẢN NGÂN HÀNG")} name="bank_number" value={formData.bank_number} onChange={handleInputChange} onBlur={handleBankNumberBlur} />
            <span className="text-red-500 ml-2">*</span>
          </div>
          {validationErrors.bank_number ? <p className="text-red-500 text-xs mt-0.5">{validationErrors.bank_number}</p> : null}
        </div>
        <div className="grid grid-cols-1 items-center gap-4">
          <div className="relative w-full flex items-center">
            <select className="border py-1.5 px-2 rounded w-full text-[13px]" name="bank_name" value={formData.bank_name} onChange={handleInputChange}>
              <option value="">{t("register.selectBankPlaceholder", "Chọn ngân hàng (With bank)")}</option>
              {banks && banks.length > 0 ? (
                banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                   ({bank.code}) {bank.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading banks...</option>
              )}
            </select>
            <span className="text-red-500 ml-2">*</span>
          </div>
          {validationErrors.bank_name ? <p className="text-red-500 text-xs mt-0.5">{validationErrors.bank_name}</p> : null}
        </div>
        <div className="grid grid-cols-1 items-center gap-4">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              readOnly
              className="border py-1.5 px-2 rounded w-full text-[13px] bg-gray-100 text-gray-700"
              placeholder={t("register.accountHolderNamePlaceholder", "Tên chủ tài khoản")}
              name="full_name"
              value={isFetchingAccountName ? t("common.loading", "Đang tải...") : formData.full_name}
              disabled={isFetchingAccountName}
              onChange={() => {}}
            />
            <span className="text-red-500 ml-2">*</span>
          </div>
          {accountNameError ? <p className="text-red-500 text-xs mt-0.5">{accountNameError}</p> : null}
        </div>
        <SecureField
          name="password"
          value={formData.password}
          placeholder={t("register.passwordPlaceholder", "MẬT KHẨU")}
          onChange={handleInputChange}
          error={validationErrors.password}
          visible={!!visibleFields.password}
          onToggleVisible={() => toggleFieldVisible("password")}
        />
        <SecureField
          name="repeat_password"
          value={formData.repeat_password}
          placeholder={t("register.repeatPasswordPlaceholder", "NHẬP LẠI MẬT KHẨU")}
          onChange={handleInputChange}
          error={validationErrors.repeat_password}
          visible={!!visibleFields.repeat_password}
          onToggleVisible={() => toggleFieldVisible("repeat_password")}
        />
        <SecureField
          name="otp"
          value={formData.otp}
          placeholder={t("register.otpPlaceholder", "MẬT MÃ OTP")}
          onChange={handleInputChange}
          error={validationErrors.otp}
          visible={!!visibleFields.otp}
          onToggleVisible={() => toggleFieldVisible("otp")}
        />
        <SecureField
          name="repeat_otp"
          value={formData.repeat_otp}
          placeholder={t("register.repeatOtpPlaceholder", "NHẬP LẠI MẬT MÃ OTP")}
          onChange={handleInputChange}
          error={validationErrors.repeat_otp}
          visible={!!visibleFields.repeat_otp}
          onToggleVisible={() => toggleFieldVisible("repeat_otp")}
        />
        <SecureField
          name="recovery_character"
          value={formData.recovery_character}
          placeholder={t("register.recoveryCharacterPlaceholder", "KỲ TỰ KHÔI PHỤC TÀI KHOẢN")}
          onChange={handleInputChange}
          error={validationErrors.recovery_character}
          visible={!!visibleFields.recovery_character}
          onToggleVisible={() => toggleFieldVisible("recovery_character")}
        />
        <SecureField
          name="repeat_recovery_character"
          value={formData.repeat_recovery_character}
          placeholder={t("register.repeatRecoveryCharacterPlaceholder", "NHẬP LẠI KÝ TỰ KHÔI PHỤC TÀI KHOẢN (Repeat account recovery character)")}
          onChange={handleInputChange}
          error={validationErrors.repeat_recovery_character}
          visible={!!visibleFields.repeat_recovery_character}
          onToggleVisible={() => toggleFieldVisible("repeat_recovery_character")}
        />
        <div className="grid grid-cols-1 items-center gap-4">
          <div className="relative w-full flex items-center">
            <button
              type="button"
              className="mr-2 p-1.5 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setIsQrModalOpen(true)}
              title={t("register.scanQr", "Quét QR")}
            >
              <QrCode size={20} />
            </button>
            <input type="text" className="border py-1.5 px-2 rounded w-full text-[13px]" placeholder={t("register.discountMemberIdPlaceholder", "ID THÀNH VIÊN NHẬN GIẢM GIÁ / ID NGƯỜI GIỚI THIỆU")} name="reference_id" value={formData.reference_id} onChange={handleInputChange} />
            <span className="text-red-500 ml-2"></span>
            <span className="text-red-500 ml-2"> </span>
          </div>
          {validationErrors.reference_id ? <p className="text-red-500 text-xs mt-0.5">{validationErrors.reference_id}</p> : null}
        </div>
      </div>
      <div className="text-center mt-2">
        <button className={`border-2 border-black font-bold px-1 py-1.5 rounded flex-1  ${isFormValid() && !isVerifying ? "text-black hover:bg-gray-200" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`} onClick={handleNextClick} disabled={!isFormValid() || isVerifying}>
          {t("register.next", "Tiếp Theo")} <br />
        </button>
      </div>
      {isQrModalOpen && <QRModalComponent isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} onScanResult={handleScanResult} />}
    </div>
  )
}

RegisterStepOne.propTypes = {
  t: PropTypes.func.isRequired,
  countries: PropTypes.array.isRequired,
  banks: PropTypes.array,
  selectedCountry: PropTypes.object,
  setSelectedCountry: PropTypes.func.isRequired,
  validationErrors: PropTypes.object.isRequired,
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  isFormValid: PropTypes.func.isRequired,
  isVerifying: PropTypes.bool.isRequired,
  handleNextClick: PropTypes.func.isRequired,
  handleBankNumberBlur: PropTypes.func.isRequired,
  isFetchingAccountName: PropTypes.bool,
  accountNameError: PropTypes.string,
}
