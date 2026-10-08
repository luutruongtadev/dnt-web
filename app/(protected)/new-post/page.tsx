"use client";

import dynamic from "next/dynamic";

// Client-only render (matches original Vite SPA; views read localStorage/window).
const View = dynamic(() => import("@/views/NewPostPage"), { ssr: false, loading: () => <div className="min-h-screen" /> });

export default function Page() {
  return <View />;
}
