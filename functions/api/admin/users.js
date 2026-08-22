import { hashPassword, randomId } from '../auth/_crypto.js'
import { requireAdmin } from '../auth/_require.js'

const json = (body, status = 200) => Response.json(body, { status })
const allowedRoles = new Set(['admin', 'teacher', 'student', 'parent'])

async function adminAuth(context) {
  const db = context.env?.DB
  if (!db) return { db: null, response: json({ ok: false, error: 'D1 bağlı değil.' }, 503) }
  const auth = await requireAdmin(context.request, db)
  if (!auth.ok) return { db, response: json({ ok: false, error: auth.status === 403 ? 'Yetkisiz.' : 'Oturum gerekli.' }, auth.status) }
  return { db, auth }
}

export async function onRequestGet(context) {
  const result = await adminAuth(context)
  if (result.response) return result.response
  const { db } = result
  const { results } = await db.prepare('SELECT id, username, full_name AS fullName, email, role, is_active AS isActive, created_at AS createdAt FROM users ORDER BY created_at DESC').all()
  return json({ ok: true, users: results || [] })
}

export async function onRequestPost(context) {
  const result = await adminAuth(context)
  if (result.response) return result.response
  const { db, auth } = result
  try {
    const body = await context.request.json()
    const username = String(body?.username || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.fullName || '').trim()
    const email = String(body?.email || '').trim() || null
    const role = String(body?.role || '').trim()
    if (!username || !password || !fullName || !allowedRoles.has(role)) return json({ ok: false, error: 'Kullanıcı adı, şifre, ad soyad ve geçerli rol gerekli.' }, 400)
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) return json({ ok: false, error: 'Kullanıcı adı 3-32 karakter olmalı.' }, 400)
    if (password.length < 8) return json({ ok: false, error: 'Şifre en az 8 karakter olmalı.' }, 400)
    if (fullName.length > 120) return json({ ok: false, error: 'Ad soyad çok uzun.' }, 400)
    const exists = await db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').bind(username).first()
    if (exists) return json({ ok: false, error: 'Bu kullanıcı adı zaten kullanılıyor.' }, 409)
    const salt = randomId(); const iterations = 310000; const passwordHash = await hashPassword(password, salt, iterations); const id = crypto.randomUUID()
    await db.prepare('INSERT INTO users (id, username, password_hash, password_salt, password_iterations, role, full_name, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, username, passwordHash, salt, iterations, role, fullName, email).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), auth.session.user_id, `user.create:${role}`, id).run()
    return json({ ok: true, user: { id, username, fullName, email, role, isActive: true } }, 201)
  } catch { return json({ ok: false, error: 'Kullanıcı oluşturulamadı.' }, 500) }
}

export async function onRequestPatch(context) {
  const result = await adminAuth(context)
  if (result.response) return result.response
  const { db, auth } = result
  try {
    const body = await context.request.json(); const id = String(body?.id || '').trim()
    if (!id) return json({ ok: false, error: 'Kullanıcı kimliği gerekli.' }, 400)
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first()
    if (!user) return json({ ok: false, error: 'Kullanıcı bulunamadı.' }, 404)
    if (user.id === auth.session.user_id && body?.isActive === false) return json({ ok: false, error: 'Kendi hesabını pasifleştiremezsin.' }, 400)
    const updates = []; const values = []
    if (typeof body?.isActive === 'boolean') { updates.push('is_active = ?'); values.push(body.isActive ? 1 : 0) }
    if (body?.role && allowedRoles.has(body.role)) { updates.push('role = ?'); values.push(body.role) }
    if (typeof body?.fullName === 'string' && body.fullName.trim()) { updates.push('full_name = ?'); values.push(body.fullName.trim().slice(0,120)) }
    if (typeof body?.email === 'string') { updates.push('email = ?'); values.push(body.email.trim() || null) }
    if (typeof body?.password === 'string' && body.password.length >= 8) { const salt = randomId(); const iterations = 310000; updates.push('password_hash = ?', 'password_salt = ?', 'password_iterations = ?'); values.push(await hashPassword(body.password, salt, iterations), salt, iterations) }
    if (!updates.length) return json({ ok: false, error: 'Değişiklik bulunamadı.' }, 400)
    updates.push('updated_at = CURRENT_TIMESTAMP'); values.push(id)
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_id) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), auth.session.user_id, 'user.update', id).run()
    return json({ ok: true })
  } catch { return json({ ok: false, error: 'Kullanıcı güncellenemedi.' }, 500) }
}

export async function onRequestDelete(context) {
  const result = await adminAuth(context)
  if (result.response) return result.response
  const { db, auth } = result
  try {
    const url = new URL(context.request.url); const id = url.searchParams.get('id')
    if (!id) return json({ ok: false, error: 'Kullanıcı kimliği gerekli.' }, 400)
    if (id === auth.session.user_id) return json({ ok: false, error: 'Kendi hesabını silemezsin.' }, 400)
    const user = await db.prepare('SELECT id, username FROM users WHERE id = ?').bind(id).first()
    if (!user) return json({ ok: false, error: 'Kullanıcı bulunamadı.' }, 404)
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action, target_id, metadata) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), auth.session.user_id, 'user.delete', id, JSON.stringify({ username: user.username })).run()
    return json({ ok: true })
  } catch { return json({ ok: false, error: 'Kullanıcı silinemedi.' }, 500) }
}
