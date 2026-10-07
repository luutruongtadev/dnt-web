"use client";
import React from "react"
import PropTypes from "prop-types"

export default function TextInput({ name, value, onChange, className = "", placeholder }) {
  return (
    <input
      type="text"
      name={name}
      value={value || ""}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  )
}

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
}