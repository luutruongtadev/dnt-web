"use client";
import React from "react";

export default function MessagesPanel({ messages = [], visible, onToggle, compact }) {
  if (!visible) return null;
  return (
    <div className={`fixed left-0 right-0 top-20 z-30 ${compact ? "max-w-3xl mx-auto" : ""}`}>
      <div className="relative mx-4 bg-white/90 backdrop-blur border rounded">
        <button className="absolute -left-8 top-4 px-2 py-1 bg-blue-600 text-white rounded-l" onClick={onToggle}>TN</button>
        <div className="max-h-64 overflow-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`${m.type === "VIP" ? "border border-yellow-400" : "border"} rounded px-3 py-2`}> 
              <div className="text-xs text-gray-500">{m.type === "VIP" ? "VIP" : "Thường"} • {m.time}</div>
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

