import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions<_T> {
  onError?: (error: Error) => void;
}

interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options?: UseFetchOptions<T>
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store the latest fetchFn without triggering re-renders
  const fetchFnRef = useRef(fetchFn);
  const optionsRef = useRef(options);

  // Update refs when props change
  fetchFnRef.current = fetchFn;
  optionsRef.current = options;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      optionsRef.current?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - uses refs instead

  useEffect(() => {
    fetch();
  }, [fetch]); // Only re-run when fetch changes (which it won't)

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
    setData,
  };
}
