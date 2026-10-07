"use client";
import React from "react"
import PropTypes from "prop-types"

export default function TextLabel({ children, className = "" }) {
  return <div className={className}>{children}</div>
}

TextLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}