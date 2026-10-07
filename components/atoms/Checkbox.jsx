"use client";
import React from "react"
import PropTypes from "prop-types"

export default function Checkbox({ name, checked, onChange, className = "" }) {
  return <input type="checkbox" name={name} checked={!!checked} onChange={onChange} className={className} />
}

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}