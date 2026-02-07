import crypto from "crypto"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateCode(prefix: string | null | undefined, length = 8) {
  const bytes = crypto.randomBytes(length)
  let code = ""
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return `${prefix ?? ""}${code}`
}
