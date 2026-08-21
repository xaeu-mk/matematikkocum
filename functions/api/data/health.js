export async function onRequestGet(context) {
  const bindings = context.env || {}
  const hasD1 = Boolean(bindings.DB)
  const hasR2 = Boolean(bindings.STORAGE)

  return Response.json({
    ok: true,
    bindings: { d1: hasD1, r2: hasR2 },
  })
}
