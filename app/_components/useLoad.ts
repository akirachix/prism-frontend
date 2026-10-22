"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";

import { errorMessage } from "@/lib/api";

export { orNull } from "@/lib/api";

/**
 * Run an async loader when the deps change and keep its result. Results
 * from a stale run are ignored, so fast navigation cannot show old data.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  useEffect(() => {
    let active = true;
    load()
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((value) => value + 1);
  }, []);

  return { data, error, loading, reload, setData };
}
