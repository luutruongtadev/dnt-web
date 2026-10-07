"use client";
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

export default function FileInput({ name, onChange, className = "", label, selectedFile }) {
  const { t } = useTranslation()
  const fileName = selectedFile?.name || ""
  const defaultLabel = (
    <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
      {t("productGrid.uploadFile")}
    </span>
  )

  return (
    <div className={className}>
      {/* Always hide native input to avoid showing default "No file chosen" text */}
      <input type="file" name={name} id={name} onChange={onChange} className="sr-only" />
      <label htmlFor={name} className="block cursor-pointer-label">
        {label ?? defaultLabel}
      </label>
      {fileName && (
        <div className="mt-1 max-w-[150px] truncate text-[10px] text-gray-700" title={fileName}>
          {fileName}
        </div>
      )}
    </div>
  )
}

FileInput.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  className: PropTypes.string,
  label: PropTypes.node,
  selectedFile: PropTypes.object,
}
