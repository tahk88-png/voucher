/**
 * Maps a NextAuth `?error=` code (lib/auth.ts sends auth errors back to
 * /login) to the key of the message the sign-in page shows.
 */
export function authErrorKey(code: string | null): "errorCredentialsSignin" | "errorAuthGeneric" | null {
  if (!code) return null
  return code === "CredentialsSignin" ? "errorCredentialsSignin" : "errorAuthGeneric"
}
