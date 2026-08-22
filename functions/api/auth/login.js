import { createSession, hashPassword } from './_crypto.js'

const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers })

export async function onRequestPost(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'Kimlik doğrulama servisi henüz Cloudflare D1 ile bağlanmadı.' }, 503)
  try {
    const body = await context.request.json()
    const username = String(body?.username || '').trim().toLowerCase()
    const password = String(body?.password || '')
    if (!username || !password) return json({ ok: false, error: 'Kullanıcı adı ve şifre gerekli.' }, 400)

    // Production D1'de yardımcı tablolar eksik kaldıysa login'i çalışır hale getir.
    await db.prepare(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`).run()
    await db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, target_id TEXT, metadata TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL)`).run()

    const user = await db.prepare('SELECT id, username, password_hash, password_salt, password_iterations, role, full_name, is_active FROM users WHERE username = ? LIMIT 1').bind(username).first()
    if (!user || !user.is_active) return json({ ok: false, error: 'Kullanıcı adı veya şifre hatalı.' }, 401)

    const candidate = await hashPassword(password, user.password_salt, user.password_iterations || 310000)
    if (candidate !== user.password_hash) return json({ ok: false, error: 'Kullanıcı adı veya şifre hatalı.' }, 401)

    const session = await createSession(db, user.id)
    try {
      await db.prepare('INSERT INTO audit_logs (id, user_id, action) VALUES (?, ?, ?)').bind(crypto.randomUUID(), user.id, 'login').run()
    } catch (error) {
      console.error('audit log failed', error)
    }

    return json({ ok: true, user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role } }, 200, {
      'Set-Cookie': `mk_session=${session.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    })
  } catch (error) {
    console.error('login failed', error)
    return json({ ok: false, error: `Giriş servisi hatası: ${error?.message || 'bilinmeyen hata'}` }, 500)
  }
}
