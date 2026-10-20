import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirai",
  description: "Mirai, support for every learner.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2a66",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={quicksand.variable}>{children}</body>
    </html>
  );
}
