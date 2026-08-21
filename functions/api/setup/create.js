import { hashPassword } from '../../_lib/password.js'

export async function onRequestPost(context) {
  const db = context.env.DB
  if (!db) return Response.json({ ok: false, error: 'D1 binding bulunamadı.' }, { status: 503 })

  const existing = await db.prepare('SELECT COUNT(*) AS count FROM users').first()
  if (Number(existing?.count || 0) > 0) {
    return Response.json({ ok: false, error: 'Kurulum zaten tamamlandı.' }, { status: 409 })
  }

  const body = await context.request.json().catch(() => null)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const passwordConfirm = String(body?.passwordConfirm || '')

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return Response.json({ ok: false, error: 'Kullanıcı adı 3-32 karakter olmalı ve yalnızca harf, rakam, _, ., - içermeli.' }, { status: 400 })
  }
  if (password.length < 12) return Response.json({ ok: false, error: 'Şifre en az 12 karakter olmalı.' }, { status: 400 })
  if (password !== passwordConfirm) return Response.json({ ok: false, error: 'Şifreler eşleşmiyor.' }, { status: 400 })

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  await db.prepare('INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)')
    .bind(id, username, passwordHash, 'admin', 'active').run()

  return Response.json({ ok: true, user: { id, username, role: 'admin' } }, { status: 201 })
}
