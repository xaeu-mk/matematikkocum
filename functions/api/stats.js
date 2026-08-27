export async function onRequestGet(context) {
  const db = context.env?.DB
  if (!db) return Response.json({ ok: false, error: 'Veritabanı bağlantısı yok.' }, { status: 503 })

  try {
    const [students, teachers, parents] = await Promise.all([
      db.prepare("SELECT COUNT(*) n FROM users WHERE role='student' AND is_active=1").first(),
      db.prepare("SELECT COUNT(*) n FROM users WHERE role='teacher' AND is_active=1").first(),
      db.prepare("SELECT COUNT(*) n FROM users WHERE role='parent' AND is_active=1").first()
    ])
    return Response.json({
      ok: true,
      stats: {
        students: Number(students?.n || 0),
        teachers: Number(teachers?.n || 0),
        parents: Number(parents?.n || 0)
      }
    }, { headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) {
    console.error('STATS_ERROR', err)
    return Response.json({ ok: false, error: 'İstatistik alınamadı.' }, { status: 500 })
  }
}
