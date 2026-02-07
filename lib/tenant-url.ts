import { Prisma } from "@prisma/client"

export function getTenantBaseUrl(
  merchant: { slug: string },
  mapping?: { domain: string } | null
): string {
  if (mapping?.domain) {
    return `https://${mapping.domain}`
  }

  const root = process.env.PLATFORM_ROOT_DOMAIN || "localhost:3000"
  const host = root.includes("://") ? root : root
  if (host.includes("localhost")) {
    return `http://${merchant.slug}.${host}`
  }
  return `https://${merchant.slug}.${host}`
}

export async function getTenantBaseUrlWithMapping(
  merchant: { slug: string; domainMappings?: Array<{ domain: string; status: string }> }
): Promise<string> {
  const mapping = merchant.domainMappings?.find((d) => d.status === "verified")
  return getTenantBaseUrl(merchant, mapping || null)
}
