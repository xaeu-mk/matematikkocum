export async function onRequestGet(context) {
  const cookie = context.request.headers.get('Cookie') || ''
  const authenticated = /(?:^|;\s*)mk_session=/.test(cookie)

  return Response.json({
    authenticated,
    user: null,
  })
}
