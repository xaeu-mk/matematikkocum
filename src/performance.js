// Lightweight client-side request deduplication/cache for fast workspace navigation.
const originalFetch = window.fetch.bind(window)
const cache = new Map()
const TTL = 4000

window.fetch = async (input, init = {}) => {
  const method = String(init.method || 'GET').toUpperCase()
  const url = typeof input === 'string' ? input : input?.url || ''
  const isAppGet = method === 'GET' && (url.startsWith('/api/app?resource=') || url.startsWith('/api/auth/session'))
  if (!isAppGet) {
    if (method !== 'GET') cache.clear()
    return originalFetch(input, init)
  }

  const key = url
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && now - cached.time < TTL) {
    return cached.response.clone()
  }

  const pending = cached?.pending
  if (pending) {
    const response = await pending
    return response.clone()
  }

  const request = originalFetch(input, init).then(async response => {
    // Clone once so the caller and cache each get their own readable body.
    const copy = response.clone()
    cache.set(key, { time: Date.now(), response: copy })
    return response
  }).catch(error => {
    cache.delete(key)
    throw error
  })

  cache.set(key, { time: now, pending: request })
  return request
}

window.__mkInvalidateCache = () => cache.clear()
