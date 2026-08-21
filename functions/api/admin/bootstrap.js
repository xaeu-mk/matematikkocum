import { hashPassword } from '../../_lib/password.js'

export async function onRequestPost(context) {
  const setupKey = context.env.ADMIN_BOOTSTRAP_KEY
  const suppliedKey = context.request.headers.get('X-Admin-Bootstrap-Key')

  if (!setupKey || !suppliedKey || suppliedKey !== setupKey) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await context.request.json().catch(() => null)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')

  if (!username || !password || password.length < 12) {
    return Response.json({ ok: false, error: 'Geçerli kullanıcı adı ve en az 12 karakterlik şifre gerekli.' }, { status: 400 })
  }

  const db = context.env.DB
  if (!db) return Response.json({ ok: false, error: 'D1 binding bulunamadı.' }, { status: 503 })

  const existing = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(username).first()
  if (existing) return Response.json({ ok: false, error: 'Kullanıcı adı zaten mevcut.' }, { status: 409 })

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  await db.prepare('INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)')
    .bind(id, username, passwordHash, 'admin', 'active').run()

  return Response.json({ ok: true, user: { id, username, role: 'admin' } }, { status: 201 })
}
