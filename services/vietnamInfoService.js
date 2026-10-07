import { cachedFetch } from "@/lib/clientCache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";
const TTL = 10 * 60 * 1000; // 10 min — province list is stable within a session

// Returns [{ vi, en }, ...] for Vietnamese provinces, with "Tất cả" prepended.
export const getVietnamProvinces = () =>
  cachedFetch("vietnam-info:tinh", async () => {
    const res = await fetch(`${API_URL}/vietnam-info`);
    const json = await res.json();
    const tinh = json?.data?.tinh || [];
    const all = { vi: "Tất cả", en: "All" };
    return [all, ...tinh.map((p) => ({ vi: p.name, en: p.name }))];
  }, TTL);
