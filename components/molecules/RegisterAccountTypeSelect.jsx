"use client";
import React from "react"
import PropTypes from "prop-types"

export default function RegisterAccountTypeSelect({ value, onChange, error, t }) {
  return (
    <div className="grid grid-cols-1 items-center gap-4">
      <div className="relative w-full flex items-center">
        <select className="border py-1.5 px-2 rounded w-full text-[13px]" name="account_type" value={value} onChange={onChange}>
          <option value="">{t("register.accountTypePlaceholder", "Loại tài khoản")}</option>
          <option value="ca_nhan">{t("register.accountTypePersonal", "Tài khoản cá nhân")}</option>
          <option value="ho_kinh_doanh">{t("register.accountTypeHousehold", "Tài khoản hộ kinh doanh")}</option>
          <option value="doanh_nghiep">{t("register.accountTypeBusiness", "Tài khoản doanh nghiệp")}</option>
        </select>
        <span className="text-red-500 ml-2">*</span>
      </div>
      {error ? <p className="text-red-500 text-xs mt-0.5">{error}</p> : null}
    </div>
  )
}

RegisterAccountTypeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  t: PropTypes.func.isRequired,
}
