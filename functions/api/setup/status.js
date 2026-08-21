export async function onRequestGet(context) {
  const db = context.env.DB
  if (!db) return Response.json({ ok: false, setupRequired: true, error: 'D1 binding bulunamadı.' }, { status: 503 })
  const row = await db.prepare("SELECT COUNT(*) AS count FROM users").first()
  return Response.json({ ok: true, setupRequired: Number(row?.count || 0) === 0 })
}
