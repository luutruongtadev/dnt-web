import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "DNT",
  description: "DNT",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <head>
        {/* FontAwesome icons (carried over from the Vite index.html) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* #root preserved: the background-restore effect targets this element.
            Default bg #1242ae matches the old Vite index.html. */}
        <div
          id="root"
          className="min-h-full flex flex-col flex-1"
          style={{ backgroundColor: "#1242ae" }}
        >
          <Providers>{children}</Providers>
        </div>
        {/* Google reCAPTCHA — required for window.grecaptcha on login/register. */}
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
