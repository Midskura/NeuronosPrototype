/**
 * useNeuronCache — Global data cache with stale-while-revalidate
 * 
 * Performance Optimization Phase 2
 * 
 * Architecture:
 * - Single in-memory cache store shared via React Context
 * - Each entry: { data, fetchedAt, promise? (for dedup) }
 * - TTL: 60s default. Stale data returned instantly, revalidated in background.
 * - invalidate(keyPattern) for cache-busting after mutations.
 * - useCachedFetch<T>(key, fetcher, ttl?) — drop-in replacement for useState+useEffect fetch patterns
 */

import { createContext, useContext, useCallback, useRef, useState, useEffect, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────

interface CacheEntry<T = any> {
  data: T;
  fetchedAt: number;
  /** In-flight promise for deduplication */
  promise?: Promise<T>;
}

interface NeuronCacheContextValue {
  /** Get a cached value (or undefined if not cached) */
  get: <T>(key: string) => CacheEntry<T> | undefined;
  /** Set a cached value */
  set: <T>(key: string, data: T) => void;
  /** Invalidate one or more cache entries by key prefix */
  invalidate: (keyPattern: string) => void;
  /** Invalidate ALL cache entries */
  invalidateAll: () => void;
  /** Store an in-flight promise for dedup */
  setPromise: <T>(key: string, promise: Promise<T>) => void;
  /** Get an in-flight promise for dedup */
  getPromise: <T>(key: string) => Promise<T> | undefined;
  /** Clear the promise after resolution */
  clearPromise: (key: string) => void;
}

// ─── Context ────────────────────────────────────────────────

const NeuronCacheContext = createContext<NeuronCacheContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────

export function NeuronCacheProvider({ children }: { children: ReactNode }) {
  // Use a ref so cache mutations don't trigger re-renders of the entire tree
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const get = useCallback(<T,>(key: string): CacheEntry<T> | undefined => {
    return cacheRef.current.get(key) as CacheEntry<T> | undefined;
  }, []);

  const set = useCallback(<T,>(key: string, data: T): void => {
    cacheRef.current.set(key, { data, fetchedAt: Date.now() });
  }, []);

  const invalidate = useCallback((keyPattern: string): void => {
    const keysToDelete: string[] = [];
    cacheRef.current.forEach((_, key) => {
      if (key.startsWith(keyPattern) || key.includes(keyPattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(k => cacheRef.current.delete(k));
    if (keysToDelete.length > 0) {
      console.log(`[NeuronCache] Invalidated ${keysToDelete.length} entries matching "${keyPattern}"`);
    }
  }, []);

  const invalidateAll = useCallback((): void => {
    const size = cacheRef.current.size;
    cacheRef.current.clear();
    console.log(`[NeuronCache] Invalidated all ${size} entries`);
  }, []);

  const setPromise = useCallback(<T,>(key: string, promise: Promise<T>): void => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      entry.promise = promise;
    } else {
      cacheRef.current.set(key, { data: undefined, fetchedAt: 0, promise });
    }
  }, []);

  const getPromise = useCallback(<T,>(key: string): Promise<T> | undefined => {
    return cacheRef.current.get(key)?.promise as Promise<T> | undefined;
  }, []);

  const clearPromise = useCallback((key: string): void => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      delete entry.promise;
    }
  }, []);

  const value: NeuronCacheContextValue = {
    get, set, invalidate, invalidateAll,
    setPromise, getPromise, clearPromise,
  };

  return (
    <NeuronCacheContext.Provider value={value}>
      {children}
    </NeuronCacheContext.Provider>
  );
}

// ─── Hook: useNeuronCacheContext ────────────────────────────

export function useNeuronCacheContext(): NeuronCacheContextValue {
  const ctx = useContext(NeuronCacheContext);
  if (!ctx) {
    throw new Error("useNeuronCacheContext must be used within <NeuronCacheProvider>");
  }
  return ctx;
}

// ─── Hook: useCachedFetch ───────────────────────────────────

interface UseCachedFetchOptions {
  /** Cache TTL in milliseconds. Default: 60_000 (60 seconds) */
  ttl?: number;
  /** Skip fetching (e.g. if a dependency is missing) */
  skip?: boolean;
  /** Dependencies that trigger a re-fetch when changed (like useEffect deps) */
  deps?: any[];
}

interface UseCachedFetchResult<T> {
  data: T;
  isLoading: boolean;
  /** True if showing stale data while revalidating in background */
  isStale: boolean;
  /** Force a refresh, ignoring TTL */
  refresh: () => Promise<void>;
  /** Optimistically update data in both local state and cache (no API call) */
  mutate: (updater: T | ((prev: T) => T)) => void;
}

const DEFAULT_TTL = 60_000; // 60 seconds

export function useCachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  defaultValue: T,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const { ttl = DEFAULT_TTL, skip = false, deps = [] } = options;
  const cache = useNeuronCacheContext();

  const [data, setData] = useState<T>(() => {
    // Initialize from cache if available
    const cached = cache.get<T>(cacheKey);
    return cached?.data ?? defaultValue;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = cache.get<T>(cacheKey);
    return !cached?.data || cached.data === defaultValue;
  });
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async (force: boolean = false) => {
    if (skip) return;

    const cached = cache.get<T>(cacheKey);
    const now = Date.now();
    const isFresh = cached && cached.data !== undefined && cached.fetchedAt > 0 && (now - cached.fetchedAt < ttl);

    // If fresh and not forced, skip
    if (isFresh && !force) {
      setData(cached!.data);
      setIsLoading(false);
      setIsStale(false);
      return;
    }

    // If stale data exists, show it immediately (stale-while-revalidate)
    if (cached && cached.data !== undefined && cached.fetchedAt > 0) {
      setData(cached.data);
      setIsLoading(false);
      setIsStale(true);
    } else {
      setIsLoading(true);
    }

    // Deduplicate: if there's already an in-flight request, wait for it
    const existingPromise = cache.getPromise<T>(cacheKey);
    if (existingPromise && !force) {
      try {
        const result = await existingPromise;
        setData(result);
        setIsLoading(false);
        setIsStale(false);
      } catch {
        setIsLoading(false);
        setIsStale(false);
      }
      return;
    }

    // Start new fetch
    const promise = fetcher();
    cache.setPromise(cacheKey, promise);

    try {
      const result = await promise;
      cache.set(cacheKey, result);
      setData(result);
      setIsStale(false);
    } catch (error) {
      console.error(`[NeuronCache] Fetch failed for "${cacheKey}":`, error);
    } finally {
      cache.clearPromise(cacheKey);
      setIsLoading(false);
    }
  }, [cacheKey, fetcher, skip, ttl, cache]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /** Optimistically set data — updates both local state and the cache immediately */
  const mutate = useCallback((updater: T | ((prev: T) => T)) => {
    setData(prev => {
      const newData = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      cache.set(cacheKey, newData);
      return newData;
    });
  }, [cache, cacheKey]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, skip, ...deps]);

  return { data, isLoading, isStale, refresh, mutate };
}

// ─── Utility: useInvalidateCache ────────────────────────────

/**
 * Lightweight hook to invalidate cache entries after mutations.
 * Usage: const invalidate = useInvalidateCache();
 *        invalidate("projects");  // invalidates all keys containing "projects"
 */
export function useInvalidateCache() {
  const cache = useNeuronCacheContext();
  return cache.invalidate;
}