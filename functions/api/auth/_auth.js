export const getSessionUser = async (request, db) => {
  if (!db) return null
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)mk_session=([^;]+)/)
  if (!match) return null

  const session = await db.prepare(`SELECT s.id, s.expires_at, u.id AS user_id, u.username, u.full_name, u.role, u.is_active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? LIMIT 1`).bind(match[1]).first()
  if (!session || !session.is_active || new Date(session.expires_at) <= new Date()) return null

  return { id: session.user_id, username: session.username, fullName: session.full_name, role: session.role }
}

export const requireAdmin = async (request, db) => {
  const user = await getSessionUser(request, db)
  return user?.role === 'admin' ? user : null
}
