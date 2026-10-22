import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";

import ServiceWorker from "./_components/ServiceWorker";
import SessionProvider from "./_components/SessionProvider";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirai",
  description: "Mirai, support for every learner.",
  applicationName: "Mirai",
  appleWebApp: { capable: true, title: "Mirai", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2a66",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={quicksand.variable}>
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
