// Lightweight client-side request deduplication/cache for fast workspace navigation.
// No feature or UI behavior is changed here; only repeated GET requests are avoided.
const originalFetch = window.fetch.bind(window)
const cache = new Map()
const TTL_APP = 8000
const TTL_CALENDAR = 3000
const MAX_ENTRIES = 80

const getTtl = url => {
  if (url.startsWith('/api/app?resource=')) return TTL_APP
  if (url.startsWith('/api/calendar?action=')) return TTL_CALENDAR
  if (url.startsWith('/api/auth/session')) return 30000
  return 0
}

const trimCache = () => {
  if (cache.size <= MAX_ENTRIES) return
  const entries = [...cache.entries()].sort((a, b) => a[1].time - b[1].time)
  for (let i = 0; i < entries.length - MAX_ENTRIES; i++) cache.delete(entries[i][0])
}

window.fetch = async (input, init = {}) => {
  const method = String(init.method || 'GET').toUpperCase()
  const url = typeof input === 'string' ? input : input?.url || ''
  const ttl = method === 'GET' ? getTtl(url) : 0

  // Mutations invalidate cached reads so the UI never intentionally keeps stale data.
  if (method !== 'GET') {
    cache.clear()
    return originalFetch(input, init)
  }
  if (!ttl) return originalFetch(input, init)

  const key = url
  const now = Date.now()
  const cached = cache.get(key)

  if (cached?.response && now - cached.time < ttl) {
    return cached.response.clone()
  }

  if (cached?.pending) {
    const response = await cached.pending
    return response.clone()
  }

  const request = originalFetch(input, init).then(response => {
    if (!response.ok) {
      cache.delete(key)
      return response
    }
    // Keep a clone in memory while returning the original stream to the caller.
    cache.set(key, { time: Date.now(), response: response.clone() })
    trimCache()
    return response
  }).catch(error => {
    cache.delete(key)
    throw error
  })

  cache.set(key, { time: now, pending: request })
  trimCache()
  return request
}

window.__mkInvalidateCache = () => cache.clear()
