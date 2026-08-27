import { requireSession } from './_require.js'
import { hashPassword, randomId } from './_crypto.js'

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function onRequestPost(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'D1 bağlantısı bulunamadı.' }, 503)
  const auth = await requireSession(context.request, db)
  if (!auth.ok) return json({ ok: false, error: 'Oturum geçersiz.' }, auth.status)
  const user = { id: auth.session.user_id, role: auth.session.role }

  try {
    const body = await context.request.json().catch(() => ({}))
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    if (!currentPassword || !newPassword) return json({ ok: false, error: 'Mevcut ve yeni şifre zorunludur.' }, 400)
    if (newPassword.length < 8) return json({ ok: false, error: 'Yeni şifre en az 8 karakter olmalı.' }, 400)
    if (newPassword !== String(body.confirmPassword || '')) return json({ ok: false, error: 'Yeni şifre tekrarı eşleşmiyor.' }, 400)

    const row = await db.prepare('SELECT password_hash, password_salt, password_iterations FROM users WHERE id=?').bind(user.id).first()
    if (!row) return json({ ok: false, error: 'Kullanıcı bulunamadı.' }, 404)

    const currentHash = await hashPassword(currentPassword, row.password_salt, row.password_iterations)
    if (currentHash !== row.password_hash) return json({ ok: false, error: 'Mevcut şifre yanlış.' }, 403)

    const salt = randomId()
    const hash = await hashPassword(newPassword, salt)
    await db.prepare('UPDATE users SET password_hash=?, password_salt=?, password_iterations=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(hash, salt, 100000, user.id).run()
    await db.prepare('INSERT INTO audit_logs(id,user_id,action,target_id,created_at) VALUES(?,?,?,?,?)').bind(randomId(), user.id, 'change_password', user.id, new Date().toISOString()).run()

    return json({ ok: true })
  } catch (err) {
    console.error('CHANGE_PASSWORD_ERROR', err)
    return json({ ok: false, error: err?.message || 'Sunucu hatası.' }, 500)
  }
}
