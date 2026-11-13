import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const deriveKey = promisify(scrypt)
const options = { N: 2 ** 17, r: 8, p: 1, maxmem: 160 * 1024 ** 2 }
const dummySalt = randomBytes(16)
const dummyKey = Buffer.alloc(64)

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt, 64, options)
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(password, hash) {
  const [, saltHex, keyHex] = hash?.split(':') ?? []
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : dummySalt
  const expected = keyHex ? Buffer.from(keyHex, 'hex') : dummyKey
  const key = await deriveKey(password, salt, expected.length, options)
  return timingSafeEqual(key, expected) && Boolean(hash)
}
