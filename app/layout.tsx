import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "DNT",
  description: "DNT",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* #root preserved: the background-restore effect targets this element. */}
        <div id="root" className="min-h-full flex flex-col flex-1">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
