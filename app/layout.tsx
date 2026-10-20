import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import "./mirai.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirai",
  description: "Supporting learning, together.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/images/icon-192.png", apple: "/images/icon-192.png" },
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2a66",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body>{children}</body>
    </html>
  );
}
