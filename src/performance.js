// Client-side performance layer: request deduplication + short-lived read cache.
// This only reduces duplicate network work; it does not add UI/features.
const originalFetch = window.fetch.bind(window)
const cache = new Map()
const MAX_ENTRIES = 80
const TTL = {
  app: 8000,
  calendar: 3000,
  session: 30000
}

const getTtl = url => {
  if (url.startsWith('/api/app?resource=')) return TTL.app
  if (url.startsWith('/api/calendar?action=')) return TTL.calendar
  if (url.startsWith('/api/auth/session')) return TTL.session
  return 0
}

const trimCache = () => {
  if (cache.size <= MAX_ENTRIES) return
  const entries = [...cache.entries()].sort((a, b) => a[1].time - b[1].time)
  for (let i = 0; i < entries.length - MAX_ENTRIES; i++) cache.delete(entries[i][0])
}

const invalidate = () => {
  for (const [key, value] of cache) {
    if (value?.pending) continue
    cache.delete(key)
  }
}

window.fetch = async (input, init = {}) => {
  const method = String(init.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase()
  const url = typeof input === 'string' ? input : input?.url || ''

  // Any write can change previously cached data. Invalidate before the write
  // so a following navigation never receives an intentionally stale snapshot.
  if (method !== 'GET') {
    invalidate()
    return originalFetch(input, init)
  }

  const ttl = getTtl(url)
  if (!ttl || init.cache === 'no-store') return originalFetch(input, init)

  const key = url
  const now = Date.now()
  const cached = cache.get(key)

  if (cached?.response && now - cached.time < ttl) {
    // LRU touch: recently used entries stay available longer when the cache fills.
    cache.delete(key)
    cache.set(key, { ...cached, time: now })
    return cached.response.clone()
  }

  if (cached?.pending) {
    const response = await cached.pending
    return response.clone()
  }

  const request = originalFetch(input, init)
    .then(response => {
      if (!response.ok) {
        cache.delete(key)
        return response
      }
      const entry = { time: Date.now(), response: response.clone() }
      cache.set(key, entry)
      trimCache()
      return response
    })
    .catch(error => {
      cache.delete(key)
      throw error
    })

  cache.set(key, { time: now, pending: request })
  trimCache()
  return request
}

window.__mkInvalidateCache = invalidate
