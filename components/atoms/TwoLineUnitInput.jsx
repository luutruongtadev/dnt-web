"use client";
import React, { useMemo } from "react"
import PropTypes from "prop-types"
import { getUserCountry } from "../../utils/user"

export default function TwoLineUnitInput({
  name,
  value,
  onChange,
  placeholder = "",
  className = "",
  type = "text",
  country,
  unitBottom = "D",
  disabled = false,
  inputProps = {},
  isInput = false,
  centerOnly = false,
  unit = ""
}) {
  const resolvedCountry = useMemo(() => {
    return getUserCountry();
  }, [])

  if (centerOnly) {
    return (
      <div className={`flex flex-col items-center justify-center leading-tight font-bold w-full h-full ${className}`}>
        <span className="text-sm">{resolvedCountry}</span>
        <span className="text-sm">{unitBottom}</span>
      </div>
    )
  }

  return (
    <div className={`w-full flex items-center justify-center relative ${className}`}>
      {isInput ? (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3 pr-16 border-0 outline-none bg-transparent text-right"
          {...inputProps}
        />
      ) : (
        <div className="w-full p-3 pr-16 border-0 outline-none bg-transparent text-right">
          {value}
        </div>
      )}
      <div className="absolute right-1 inset-y-0 flex flex-col items-center justify-center leading-tight font-bold">
        <span className="text-sm">{unit ? unit : resolvedCountry}</span>
        <span hidden={unit} className="text-sm">{unitBottom}</span>
      </div>
    </div>
  )
}

TwoLineUnitInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  country: PropTypes.string,
  unitBottom: PropTypes.string,
  disabled: PropTypes.bool,
  inputProps: PropTypes.object,
  isInput: PropTypes.bool,
  centerOnly: PropTypes.bool,
}

