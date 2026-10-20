"use client";

/**
 * Run an async loader when the component mounts and expose
 * { data, error, loading, reload }.
 *
 * Pass a STABLE function (a module-level function such as `parentApi.child`,
 * or one wrapped in useCallback): the loader runs again whenever its identity
 * changes. Results of a superseded request are ignored.
 */
import { useEffect, useState } from "react";

interface Settled<T> {
  loader: () => Promise<T>;
  attempt: number;
  data: T | null;
  error: string | null;
}

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

export function useAsync<T>(loader: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loader().then(
      (data) => {
        if (!cancelled) setSettled({ loader, attempt, data, error: null });
      },
      (err: unknown) => {
        if (!cancelled) setSettled({ loader, attempt, data: null, error: messageOf(err) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loader, attempt]);

  const current = settled && settled.loader === loader && settled.attempt === attempt;
  return {
    data: current ? settled.data : null,
    error: current ? settled.error : null,
    loading: !current,
    reload: () => setAttempt((n) => n + 1),
  };
}
