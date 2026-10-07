"use client";
import React from "react"
import PropTypes from "prop-types"

export default function RegisterBankNameSelect({ value, onChange, error, placeholder }) {
  return (
    <div className="grid grid-cols-1 items-center gap-4">
      <div className="relative w-full flex items-center">
        <select className="border p-2 rounded w-full" name="bank_name" value={value} onChange={onChange}>
          <option value="">{placeholder}</option>
          <option value="GPBank">Ngân hàng TNHH MTV Dầu khí toàn cầu (GPBank)</option>
          <option value="Agribank">Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)</option>
          <option value="OceanBank">Ngân hàng TNHH MTV Đại Dương (OceanBank)</option>
          <option value="VietinBank">Ngân hàng TMCP Công thương Việt Nam (VietinBank)</option>
          <option value="BIDV">Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)</option>
          <option value="Vietcombank">Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)</option>
        </select>
        <span className="text-red-500 ml-2">*</span>
      </div>
      {error ? <p className="text-red-500 text-sm mt-1">{error}</p> : null}
    </div>
  )
}

RegisterBankNameSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
}