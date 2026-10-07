"use client";
import React from "react"
import PropTypes from "prop-types"
import { preventInvalidNumberKeys } from "../../utils/inputGuards"

export default function NumberInput({ name, value, onChange, className = "", placeholder, min = 0, step = 1 }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      name={name}
      value={value || ""}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      onKeyDown={preventInvalidNumberKeys}
    />
  )
}

NumberInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}