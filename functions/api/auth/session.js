export async function onRequestGet(context) {
  const db = context.env?.DB
  if (!db) return Response.json({ authenticated: false, user: null, configured: false })

  const cookie = context.request.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)mk_session=([^;]+)/)
  if (!match) return Response.json({ authenticated: false, user: null, configured: true })

  const session = await db.prepare(`SELECT s.id, s.expires_at, u.id AS user_id, u.username, u.full_name, u.role, u.is_active FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? LIMIT 1`).bind(match[1]).first()
  if (!session || !session.is_active || new Date(session.expires_at) <= new Date()) {
    return new Response(JSON.stringify({ authenticated: false, user: null, configured: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'mk_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' },
    })
  }

  return Response.json({
    authenticated: true,
    configured: true,
    user: { id: session.user_id, username: session.username, fullName: session.full_name, role: session.role },
  })
}
