/**
 * Lightweight Stale-While-Revalidate In-Memory Cache
 * Prevents redundant network requests, avoids DDOSing the server during rapid navigation,
 * and delivers instantaneous zero-loading UI transitions.
 */

const cacheStore = new Map();

export async function fetchWithCache(key, fetcher, ttlMs = 15000) {
  const now = Date.now();
  const cached = cacheStore.get(key);

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // Deduplicate in-flight promises so multiple components requesting the same data
  // simultaneously only trigger ONE network request.
  if (cached?.inFlight) {
    return cached.inFlight;
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cacheStore.set(key, { data, timestamp: Date.now(), inFlight: null });
      return data;
    } catch (err) {
      // If network fails but we had stale data, return stale data as fallback
      if (cached?.data) {
        return cached.data;
      }
      cacheStore.delete(key);
      throw err;
    }
  })();

  cacheStore.set(key, {
    data: cached?.data || null,
    timestamp: cached?.timestamp || 0,
    inFlight: promise,
  });

  return promise;
}

export function invalidateCache(keyPrefix) {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
}
