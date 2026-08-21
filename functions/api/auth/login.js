const json = (body, status = 200) => Response.json(body, { status })

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')

    if (!username || !password) {
      return json({ ok: false, error: 'Kullanıcı adı ve şifre gerekli.' }, 400)
    }

    // Production authentication will use D1 + PBKDF2/HMAC.
    // Until credentials are stored, never create a fake authenticated session.
    return json({ ok: false, error: 'Kimlik doğrulama henüz yapılandırılmadı.' }, 501)
  } catch {
    return json({ ok: false, error: 'Geçersiz istek.' }, 400)
  }
}
