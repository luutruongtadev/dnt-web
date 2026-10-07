"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Ported from dnt-fe ProtectedRoute: require an authToken in localStorage,
// otherwise redirect to /login. Runs client-side (pages here are client-only).
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthed(true);
    }
  }, [router]);

  if (!authed) return null;
  return <>{children}</>;
}
