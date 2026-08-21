export async function onRequestPost(context) {
  const db = context.env?.DB
  const cookie = context.request.headers.get('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)mk_session=([^;]+)/)

  if (db && match) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(match[1]).run()
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'mk_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  })
}
