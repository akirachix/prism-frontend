"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";

import { errorMessage } from "@/lib/api";

export { orNull } from "@/lib/api";

/**
 * Run an async loader when the deps change and keep its result. Results
 * from a stale run are ignored, so fast navigation cannot show old data.
 *
 * Only the deps (compared by value) and reload() start a new load. The
 * loader itself may be a new arrow function on every render: it is kept in
 * a ref, so it can never cause a request loop.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const key = `${JSON.stringify(deps)}#${version}`;

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setSettledKey(key);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const loading = settledKey !== key;

  const reload = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  return { data, error, loading, reload, setData };
}
