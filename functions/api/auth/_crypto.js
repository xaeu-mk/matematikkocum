const encoder = new TextEncoder()
const toBase64Url = (bytes) => { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte) }); return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') }
export const randomId = () => toBase64Url(crypto.getRandomValues(new Uint8Array(18)))
export const hashPassword = async (password, salt, iterations = 100000) => {
  const safeIterations = Math.min(Number(iterations) || 100000, 100000)
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:encoder.encode(salt), iterations:safeIterations, hash:'SHA-256' }, keyMaterial, 256)
  return toBase64Url(new Uint8Array(bits))
}
export const createSession = async (db, userId) => {
  const id = randomId(); const expires = new Date(Date.now() + 604800000).toISOString()
  await db.prepare('INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)').bind(id,userId,expires).run()
  return { id, expires }
}
