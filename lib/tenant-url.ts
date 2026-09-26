import { getAppUrl } from "@/lib/app-url"

/**
 * Scheme for tenant links: the same one the platform itself is served on
 * (NEXT_PUBLIC_APP_URL), so a plain-http dev/staging setup never gets https://
 * links to hosts that don't serve TLS.
 */
function getAppProtocol(): string {
  return new URL(getAppUrl()).protocol // "http:" | "https:"
}

export function getTenantBaseUrl(
  merchant: { slug: string },
  mapping?: { domain: string } | null
): string {
  const protocol = getAppProtocol()
  if (mapping?.domain) {
    return `${protocol}//${mapping.domain}`
  }

  const root = process.env.PLATFORM_ROOT_DOMAIN || "localhost:3000"
  // Accept a root configured with a scheme ("https://example.com") as well.
  const host = root.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/+$/, "")
  return `${protocol}//${merchant.slug}.${host}`
}

export async function getTenantBaseUrlWithMapping(
  merchant: { slug: string; domainMappings?: Array<{ domain: string; status: string }> }
): Promise<string> {
  const mapping = merchant.domainMappings?.find((d) => d.status === "verified")
  return getTenantBaseUrl(merchant, mapping || null)
}
