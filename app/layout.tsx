import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";

import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";
import "@fontsource/inter/700.css";
import "@/styles/tokens.css";
import "./globals.css";

import Providers from "@/app-shell/Providers";

export const metadata: Metadata = {
  title: "mirai",
  description: "Early screening support for teachers and parents.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#00235B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}

export const instant = false;
