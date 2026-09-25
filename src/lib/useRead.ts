import { useCallback, useEffect, useState } from "react";
import { IS_DEPLOYED } from "./config";

export interface ReadState<T> {
  loading: boolean;
  error: string;
  data: T | null;
  configured: boolean;
  reload: () => void;
}

/** Generic on-chain read with graceful "not deployed / unreachable" states. */
export function useRead<T>(fn: () => Promise<T>, deps: unknown[]): ReadState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const run = useCallback(async () => {
    if (!IS_DEPLOYED) {
      setLoading(false);
      setData(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(await fn());
    } catch (e: any) {
      setData(null);
      setError(e?.message ? String(e.message).slice(0, 220) : "The studio gateway did not answer this read");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  useEffect(() => {
    run();
  }, [run]);

  return { loading, error, data, configured: IS_DEPLOYED, reload: () => setNonce((n) => n + 1) };
}
