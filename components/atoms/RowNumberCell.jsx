"use client";
import React from "react"
import PropTypes from "prop-types"

export default function RowNumberCell({ number, required, className = "" }) {
  return (
    <div className={`border-r border-gray-300 text-center flex items-center justify-center ${className}`}>
      <span className="font-bold">{number}</span>
      {required ? <span className="text-red-500">*</span> : null}
    </div>
  )
}

RowNumberCell.propTypes = {
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
}