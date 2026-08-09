// Re-export the trusted client-IP helper so existing `@/lib/request` importers
// (commerce redemption confirm/revoke, mobile login, contact, discount
// validate) get the hardened priority order: x-real-ip (platform-set) before
// the client-spoofable leftmost x-forwarded-for hop. The previous local
// implementation preferred XFF first, which an attacker can rotate per request.
export { getClientIp } from './get-client-ip'
