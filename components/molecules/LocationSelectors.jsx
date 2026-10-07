"use client";
import React from "react"
import PropTypes from "prop-types"
import Select from "../atoms/Select"

export default function LocationSelectors({ countries = [], provinces = [], districts = [], selectedCountry, selectedProvince, selectedDistrict, onCountryChange, onProvinceChange, onDistrictChange }) {
  const countryOptions = (countries || []).map((c, idx) => ({ label: c.vi || c.en, value: c.en || c.vi }))
  const provinceOptions = (provinces || []).map((p, idx) => ({ label: p.vi || p.en, value: p.en || p.vi }))
  const districtOptions = (districts || []).map((d, idx) => ({ label: d.vi || d.en, value: d.en || d.vi }))

  return (
    <div className="p-2">
      <div className="text-center">
        <Select value={selectedCountry} onChange={onCountryChange} options={countryOptions} className="w-full border border-gray-300 p-1 mb-2" />
      </div>
      <div className="text-center">
        <Select value={selectedProvince} onChange={onProvinceChange} options={provinceOptions} className="w-full border border-gray-300 p-1 mb-2" disabled={!selectedCountry} />
      </div>
    </div>
  )
}

LocationSelectors.propTypes = {
  countries: PropTypes.array,
  provinces: PropTypes.array,
  districts: PropTypes.array,
  selectedCountry: PropTypes.string,
  selectedProvince: PropTypes.string,
  selectedDistrict: PropTypes.string,
  onCountryChange: PropTypes.func.isRequired,
  onProvinceChange: PropTypes.func.isRequired,
  onDistrictChange: PropTypes.func.isRequired,
}