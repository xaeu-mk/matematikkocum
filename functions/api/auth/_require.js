export async function requireSession(request, db) {
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)mk_session=([^;]+)/)
  if (!match) return { ok: false, status: 401 }

  const session = await db.prepare(`SELECT s.id, s.expires_at, u.id AS user_id, u.username, u.full_name, u.role, u.is_active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? LIMIT 1`).bind(match[1]).first()
  if (!session || !session.is_active || new Date(session.expires_at) <= new Date()) return { ok: false, status: 401 }

  return { ok: true, session, cookieId: match[1] }
}

export async function requireAdmin(request, db) {
  const result = await requireSession(request, db)
  if (!result.ok) return result
  if (result.session.role !== 'admin') return { ok: false, status: 403, session: result.session }
  return result
}
