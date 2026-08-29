// Keep the Pages Functions middleware lightweight.
// Database schema creation/migrations must run as deployment/database operations,
// never on every incoming request. Running CREATE TABLE/INDEX IF NOT EXISTS here
// added dozens of D1 round-trips before every API response and caused avoidable
// first-load latency, especially on mobile networks.
export async function onRequest(context) {
  return context.next()
}
