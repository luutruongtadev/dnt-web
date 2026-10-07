"use client";

import dynamic from "next/dynamic";

// Client-only render (matches original Vite SPA; views read localStorage/window).
const View = dynamic(() => import("@/views/NewFreelancerPostPage"), { ssr: false, loading: () => null });

export default function Page() {
  return <View />;
}
