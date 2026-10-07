"use client";
import React from "react"
import PropTypes from "prop-types"
import Select from "react-select"

const compactStyles = {
  control: (base) => ({ ...base, minHeight: 36, fontSize: 13 }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  input: (base) => ({ ...base, margin: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 36 }),
}

export default function RegisterCountrySelect({ countries, selectedCountry, onChange, placeholder, error }) {
  return (
    <div className="grid grid-cols-1 items-center gap-4">
      <div className="relative w-full flex items-center">
        <Select options={countries} onChange={onChange} value={selectedCountry} placeholder={placeholder} className="w-full" styles={compactStyles} />
        <span className="text-red-500 ml-2">*</span>
      </div>
      {error ? <p className="text-red-500 text-xs mt-0.5">{error}</p> : null}
    </div>
  )
}

RegisterCountrySelect.propTypes = {
  countries: PropTypes.array.isRequired,
  selectedCountry: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  error: PropTypes.string,
}