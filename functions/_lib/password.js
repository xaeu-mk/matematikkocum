const ITERATIONS = 310000
const KEY_LENGTH = 32

function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, KEY_LENGTH * 8)
  return `pbkdf2_sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`
}

export async function verifyPassword(password, encoded) {
  const [algorithm, iterationsText, saltText, hashText] = String(encoded || '').split('$')
  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !saltText || !hashText) return false
  const iterations = Number(iterationsText)
  if (!Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 1000000) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: base64ToBytes(saltText), iterations, hash: 'SHA-256' }, key, KEY_LENGTH * 8)
  const actual = new Uint8Array(bits)
  const expected = base64ToBytes(hashText)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}
