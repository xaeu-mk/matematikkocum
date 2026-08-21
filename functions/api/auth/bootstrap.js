import { hashPassword, randomId } from './_crypto.js'

const json = (body, status = 200) => Response.json(body, { status })

export async function onRequestPost(context) {
  const db = context.env?.DB
  const bootstrapKey = context.env?.BOOTSTRAP_ADMIN_KEY
  if (!db || !bootstrapKey) return json({ ok: false, error: 'Bootstrap servisi yapılandırılmadı.' }, 503)

  const providedKey = context.request.headers.get('X-Bootstrap-Key') || ''
  if (providedKey !== bootstrapKey) return json({ ok: false, error: 'Geçersiz bootstrap anahtarı.' }, 403)

  try {
    const existing = await db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
    if (existing) return json({ ok: false, error: 'Admin hesabı zaten oluşturulmuş.' }, 409)

    const body = await context.request.json()
    const username = String(body?.username || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const fullName = String(body?.fullName || '').trim()
    if (!username || !password || !fullName) return json({ ok: false, error: 'Kullanıcı adı, şifre ve ad soyad gerekli.' }, 400)
    if (password.length < 12) return json({ ok: false, error: 'İlk admin şifresi en az 12 karakter olmalı.' }, 400)

    const salt = randomId()
    const iterations = 310000
    const passwordHash = await hashPassword(password, salt, iterations)
    const id = crypto.randomUUID()
    await db.prepare('INSERT INTO users (id, username, password_hash, password_salt, password_iterations, role, full_name) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, username, passwordHash, salt, iterations, 'admin', fullName).run()
    await db.prepare('INSERT INTO audit_logs (id, user_id, action) VALUES (?, ?, ?)').bind(crypto.randomUUID(), id, 'admin.bootstrap').run()

    return json({ ok: true, user: { id, username, fullName, role: 'admin' } }, 201)
  } catch {
    return json({ ok: false, error: 'Admin hesabı oluşturulamadı.' }, 500)
  }
}
