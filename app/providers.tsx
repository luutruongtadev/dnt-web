"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import store from "../context/store";
import "../i18n";
import { useAlive } from "../custom-hooks/useAlive";

// Ported from dnt-fe main.jsx: optional password gate in front of the app.
function PasswordGate({ children }: { children: ReactNode }) {
  const pwd = "NghiA(80808";
  const isEnabled =
    process.env.NEXT_PUBLIC_REACT_APP_ENABLE_PASSWORD_GATE === "true";
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  if (!isEnabled) return <>{children}</>;

  const qrLoginPaths = ["/qr-login", "/admin/qr-login"];
  const isQrLoginPath =
    typeof window !== "undefined" &&
    qrLoginPaths.includes(window.location.pathname);
  if (isQrLoginPath) return <>{children}</>;

  if (!verified) {
    const submit = () => {
      if (input === pwd || input === "1") {
        setVerified(true);
        setError("");
      } else {
        setError("Incorrect password");
      }
    };
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="mb-3 text-lg font-semibold">Enter password</h2>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-60 p-2 border border-gray-300 rounded"
            placeholder="Password"
          />
          <div className="mt-2.5 flex gap-2 items-center">
            <button
              onClick={submit}
              className="px-3 py-2 bg-red-500 text-white rounded"
            >
              Submit
            </button>
            {error && <span className="text-red-600">{error}</span>}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Ported from dnt-fe App.jsx: restore saved background + alive ping.
function AppEffects() {
  useAlive();
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const savedBgImage = localStorage.getItem("selectedBgImage");
    if (savedBgImage) {
      root.style.backgroundImage = `url(${savedBgImage})`;
      root.style.backgroundSize = "cover";
      root.style.backgroundRepeat = "no-repeat";
      root.style.backgroundAttachment = "fixed";
    } else {
      const savedColor = localStorage.getItem("selectedColor");
      if (savedColor) root.style.backgroundColor = savedColor;
    }
  }, []);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <Suspense fallback={null}>
        <AppEffects />
      </Suspense>
      <PasswordGate>{children}</PasswordGate>
    </Provider>
  );
}
