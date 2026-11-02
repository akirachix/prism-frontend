"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((list) => list.forEach((reg) => reg.unregister()))
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => keys.forEach((key) => caches.delete(key)))
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
