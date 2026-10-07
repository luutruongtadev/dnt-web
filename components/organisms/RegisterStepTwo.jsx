"use client";
import React from "react"
import PropTypes from "prop-types"
import { useNavigate } from '@/lib/router-compat'

export default function RegisterStepTwo({
  t,
  handleContractDownload,
  isReadContract,
  handleRegister,
}) {
  const navigate = useNavigate()
  const [isTick, setIsTick] = React.useState(false)

  const handleCheckboxChange = (e) => {
    setIsTick(e.target.checked)
  }
  const handleSubmited = () => {
    if (isTick) {
      handleRegister()
    } else {
      alert("Vui lòng đồng ý điều khoản")
    }
  }
  return (
    <div className="mt-6">
      <button className="border-2 border-black text-black font-bold px-6 py-2 rounded text-center hover:bg-gray-200 mt-4 mb-4 flex w-full justify-center items-center" onClick={handleContractDownload}>
        <div className="flex flex-col items-center text-center">
          <p>
            {t("register.checkContract")} <em className="text-red-500">*</em>
          </p>
          <p>({t("register.clickToViewFile")})</p>
        </div>
      </button>
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center">
          <input name="isReadContract" type="checkbox" className="w-5 h-5" onChange={handleCheckboxChange} />
          <span className="text-red-500 text-lg">*</span>
        </div>
        <div className="text-left">
          {t("register.contractConfirmation1", "Tôi xác nhận đã đọc, hiểu rõ và đồng ý, chấp nhận ký hợp đồng cũng như tuân thủ mọi điều khoản và điều kiện do website - app yêu cầu bao gồm thêm các nội dung sau:")} <br />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center">
          <input type="checkbox" className="w-5 h-5" />
        </div>
        <div className="text-left">
          {t("register.contractConfirmation", "Tôi xác nhận đã đọc, hiểu rõ và đồng ý, chấp nhận ký hợp đồng cũng như tuân thủ mọi điều khoản và điều kiện do website - app yêu cầu bao gồm thêm các nội dung sau:")} {" "}
          "<a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              navigate('/cookie-policy')
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Chính sách Cookie
          </a>"
        </div>
      </div>
      {/* reCAPTCHA v2 Checkbox — user must tick before registering */}
      <div className="flex justify-center my-4">
        <div id="recaptcha-register"></div>
      </div>

      <div className="text-center mt-4">
        <button className="border-2 border-black text-black font-bold px-1 py-2 rounded hover:bg-gray-200 flex-1" onClick={() => handleSubmited()} title={!isTick ? "Vui lòng xem và chấp nhận hợp đồng" : ""}>
          {t("register.registerTitle", "Đăng ký")}
        </button>
      </div>
    </div>
  )
}

RegisterStepTwo.propTypes = {
  t: PropTypes.func.isRequired,
  handleContractDownload: PropTypes.func.isRequired,
  isReadContract: PropTypes.bool.isRequired,
  handleRegister: PropTypes.func.isRequired,
}
