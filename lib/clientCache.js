// Lightweight in-memory TTL cache for client-side fetches.
// Prevents re-fetching stable data (vietnam-info, countries, etc.) on every navigation.

const store = new Map(); // key → { value, expiresAt }

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Fetch-and-cache helper: calls fetcher() once, caches result for ttlMs.
export async function cachedFetch(key, fetcher, ttlMs) {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const result = await fetcher();
  cacheSet(key, result, ttlMs);
  return result;
}
