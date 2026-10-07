"use client";
import React from "react"
import PropTypes from "prop-types"

export default function Divider({ className = "" }) {
  return <hr className={className} />
}

Divider.propTypes = {
  className: PropTypes.string,
}