"use client";
import { useOutletContext } from '@/lib/router-compat';

// Base path + per-step sub-paths for the multi-screen forgot-password flow.
export const FORGOT_PASSWORD_BASE = '/forgot-password';
export const FORGOT_PASSWORD_STEPS = {
  VERIFY: `${FORGOT_PASSWORD_BASE}/verify`,
  OTP: `${FORGOT_PASSWORD_BASE}/otp`,
  RESET: `${FORGOT_PASSWORD_BASE}/reset`,
};

/**
 * Access the shared forgot-password flow state/handlers provided by
 * <ForgotPasswordFlow /> through the router <Outlet />. Each step screen is its
 * own route but they all read/write the same in-memory state, which stays
 * mounted across step navigation (and is intentionally lost on a full refresh).
 */
export function useForgotPasswordFlow() {
  return useOutletContext();
}
