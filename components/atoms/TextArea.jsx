"use client";
import React from "react"
import PropTypes from "prop-types"

export default function TextArea({ value, onChange, className = "" }) {
  return <textarea value={value || ""} onChange={onChange} className={className} />
}

TextArea.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}