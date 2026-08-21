export function onRequestGet() {
  return Response.json({
    ok: true,
    service: 'matematikkocum-api',
    environment: 'cloudflare-pages',
    timestamp: new Date().toISOString(),
  })
}
