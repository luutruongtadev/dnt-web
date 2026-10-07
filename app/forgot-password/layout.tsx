"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { OutletChildrenContext } from "@/lib/router-compat";

// ForgotPasswordFlow holds shared state and renders <Outlet /> (the step screen).
// We pass the active step route element through OutletChildrenContext so the
// compat <Outlet> can render it while re-exposing the flow context to the step.
// Loaded client-only (reads localStorage during render).
const ForgotPasswordFlow = dynamic(
  () => import("@/views/forgot-password/ForgotPasswordFlow"),
  { ssr: false, loading: () => null }
);

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OutletChildrenContext.Provider value={children}>
      <ForgotPasswordFlow />
    </OutletChildrenContext.Provider>
  );
}
