"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import { USE_MOCKS } from "@/config";
import { NextRouterProvider, useLocation } from "@/lib/router";

const MOCKS_ON = process.env.NODE_ENV === "development" && USE_MOCKS;

const noSubscribe = () => () => {};
const useInBrowser = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

export default function Providers({ children }: { children: ReactNode }) {
  const inBrowser = useInBrowser();
  const [mocksReady, setMocksReady] = useState(!MOCKS_ON);

  useEffect(() => {
    if (!MOCKS_ON) return undefined;
    let live = true;

    if (typeof window !== "undefined") {
      import("@/mocks/browser")
        .then(({ startWorker }) => startWorker())
        .then(() => {
          if (live) setMocksReady(true);
        });
    }
    return () => {
      live = false;
    };
  }, []);

  if (!inBrowser || !mocksReady) return null;
  return (
    <NextRouterProvider>
      <PageBoundary>{children}</PageBoundary>
    </NextRouterProvider>
  );
}

function PageBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
