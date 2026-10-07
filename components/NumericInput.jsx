"use client";
import React from "react";

export default function NumericInput({
  value,
  onChange,
  className,
  placeholder,
  name,
  id,
  autoFocus,
  disabled,
  required,
  maxLength,
  min,
  max,
  ariaLabel,
}) {
  const handleBeforeInput = (event) => {
    if (event.data && /\D/.test(event.data)) {
      event.preventDefault();
    }
  };

  const handleChange = (event) => {
    const rawValue = event.target.value || "";
    const sanitizedValue = rawValue.replace(/[^\d]/g, "");
    if (typeof maxLength === "number" && sanitizedValue.length > maxLength) {
      onChange(sanitizedValue.slice(0, maxLength));
      return;
    }
    onChange(sanitizedValue);
  };

  const handlePaste = (event) => {
    const pasted = (event.clipboardData || window.clipboardData).getData("text");
    if (/[^\d]/.test(pasted)) {
      event.preventDefault();
      const sanitized = (pasted || "").replace(/[^\d]/g, "");
      if (sanitized) {
        const target = event.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const next = (value || "").slice(0, start) + sanitized + (value || "").slice(end);
        onChange(next);
      }
    }
  };

  const handleKeyDown = (event) => {
    // Allow navigation/editing keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Home",
      "End",
      "Enter",
    ];
    if (allowedKeys.includes(event.key)) return;
    // Block non-digit keys
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const applyMinMax = (val) => {
    if (val === "" || val == null) return val;
    let numeric = val;
    if (typeof min === "number" && Number(numeric) < min) numeric = String(min);
    if (typeof max === "number" && Number(numeric) > max) numeric = String(max);
    return numeric;
  };

  const displayedValue = applyMinMax(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayedValue}
      onBeforeInput={handleBeforeInput}
      onChange={handleChange}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      name={name}
      id={id}
      autoFocus={autoFocus}
      disabled={disabled}
      required={required}
      aria-label={ariaLabel}
    />
  );
}


