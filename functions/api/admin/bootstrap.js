import { hashPassword, randomId } from '../auth/_crypto.js'

export async function onRequestPost(context) {
  const setupKey = context.env.ADMIN_BOOTSTRAP_KEY
  const suppliedKey = context.request.headers.get('X-Admin-Bootstrap-Key')
  if (!setupKey || !suppliedKey || suppliedKey !== setupKey) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const db = context.env?.DB
  if (!db) return Response.json({ ok: false, error: 'D1 binding bulunamadı.' }, { status: 503 })
  const body = await context.request.json().catch(() => null)
  const username = String(body?.username || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const fullName = String(body?.fullName || 'Başadmin').trim() || 'Başadmin'
  const email = String(body?.email || '').trim() || null
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 12) return Response.json({ ok: false, error: 'Geçerli kullanıcı adı ve en az 12 karakterlik şifre gerekli.' }, { status: 400 })

  try {
    const existing = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(username).first()
    if (existing) return Response.json({ ok: false, error: 'Kullanıcı adı zaten mevcut.' }, { status: 409 })
    const id = crypto.randomUUID(); const salt = randomId(); const iterations = 310000; const passwordHash = await hashPassword(password, salt, iterations)
    await db.prepare('INSERT INTO users (id, username, password_hash, password_salt, password_iterations, role, full_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)').bind(id, username, passwordHash, salt, iterations, 'admin', fullName, email).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action) VALUES (?, ?, ?)').bind(crypto.randomUUID(), id, 'admin.bootstrap').run()
    return Response.json({ ok: true, user: { id, username, fullName, role: 'admin' } }, { status: 201 })
  } catch { return Response.json({ ok: false, error: 'Admin hesabı oluşturulamadı. D1 şemasının uygulandığından emin olun.' }, { status: 500 }) }
}
