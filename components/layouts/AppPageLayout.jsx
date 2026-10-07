"use client";
import React from "react"
import PropTypes from "prop-types"

export default function AppPageLayout({ children }) {
  return (
    <div className="flex justify-center items-center min-h-screen overflow-x-hidden">
      <div className="bg-transparent backdrop-blur-md p-1 rounded-lg w-full min-w-0 mx-auto">
        {children}
      </div>
    </div>
  )
}

AppPageLayout.propTypes = {
  children: PropTypes.node,
}