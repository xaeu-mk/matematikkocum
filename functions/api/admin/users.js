import { hashPassword, randomId } from '../auth/_crypto.js'
import { requireAdmin } from '../auth/_require.js'

const json = (body, status = 200) => Response.json(body, { status })
const allowedRoles = new Set(['admin', 'teacher', 'student', 'parent'])

export async function onRequestGet(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'D1 bağlı değil.' }, 503)
  const auth = await requireAdmin(context.request, db)
  if (!auth.ok) return json({ ok: false, error: auth.status === 403 ? 'Yetkisiz.' : 'Oturum gerekli.' }, auth.status)

  const { results } = await db.prepare('SELECT id, username, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC').all()
  return json({ ok: true, users: results })
}

export async function onRequestPost(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'D1 bağlı değil.' }, 503)
  const auth = await requireAdmin(context.request, db)
  if (!auth.ok) return json({ ok: false, error: auth.status === 403 ? 'Yetkisiz.' : 'Oturum gerekli.' }, auth.status)

  try {
    const body = await context.request.json()
    const username = String(body?.username || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.fullName || '').trim()
    const email = String(body?.email || '').trim() || null
    const role = String(body?.role || '').trim()

    if (!username || !password || !fullName || !allowedRoles.has(role)) return json({ ok: false, error: 'Kullanıcı adı, şifre, ad soyad ve geçerli rol gerekli.' }, 400)
    if (username.length < 3 || username.length > 40) return json({ ok: false, error: 'Kullanıcı adı 3-40 karakter olmalı.' }, 400)
    if (password.length < 8) return json({ ok: false, error: 'Şifre en az 8 karakter olmalı.' }, 400)

    const exists = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(username).first()
    if (exists) return json({ ok: false, error: 'Bu kullanıcı adı zaten kullanılıyor.' }, 409)

    const salt = randomId()
    const iterations = 310000
    const passwordHash = await hashPassword(password, salt, iterations)
    const id = crypto.randomUUID()

    await db.prepare('INSERT INTO users (id, username, password_hash, password_salt, password_iterations, role, full_name, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, username, passwordHash, salt, iterations, role, fullName, email).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), auth.session.user_id, 'user.create', id).run()

    return json({ ok: true, user: { id, username, fullName, email, role, isActive: true } }, 201)
  } catch {
    return json({ ok: false, error: 'Kullanıcı oluşturulamadı.' }, 500)
  }
}
