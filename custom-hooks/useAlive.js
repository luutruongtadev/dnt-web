"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendAlive } from "../services/aliveService";

const ALIVE_INTERVAL_MS = 30000;

const useAlive = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const ping = () => {
      if (!mounted) return;
      sendAlive(`${pathname}${search}`).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") ping();
    };

    ping();
    intervalId = window.setInterval(ping, ALIVE_INTERVAL_MS);
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, search]);
};

export { useAlive };
