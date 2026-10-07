"use client";
import React from "react"
import PropTypes from "prop-types"

export default function Select({ value, onChange, options = [], className = "", disabled }) {
  return (
    <select value={value} onChange={onChange} className={className} disabled={disabled}>
      {options.map((opt, idx) => (
        <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

Select.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.node, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })),
  className: PropTypes.string,
  disabled: PropTypes.bool,
}

