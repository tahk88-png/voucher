import { cache } from "react"
import { headers } from "next/headers"
import type { JsonValue } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/prisma"

export type TenantMode = "tenant" | "hub"

export interface TenantContext {
  mode: TenantMode
  tenant: {
    id: string
    slug: string
    name: string
    defaultCurrency: string
    brandLogoUrl: string | null
    brandColorsJson: JsonValue | null
    website: string | null
    supportEmail: string | null
  } | null
  host: string
}

function parseHost(rawHost: string) {
  const [hostname, port] = rawHost.split(":")
  return { hostname: hostname.toLowerCase(), port }
}

function getRootDomain() {
  const root = process.env.PLATFORM_ROOT_DOMAIN || "localhost:3000"
  const [hostname, port] = root.split(":")
  return { hostname: hostname.toLowerCase(), port }
}

export async function resolveTenantByHost(hostHeader: string): Promise<TenantContext> {
  const { hostname, port } = parseHost(hostHeader || "")
  const root = getRootDomain()

  if (!hostname) {
    return { mode: "hub", tenant: null, host: hostHeader || "" }
  }

  const custom = await prisma.domainMapping.findUnique({
    where: { domain: hostname },
    include: {
      merchant: {
        select: {
          id: true,
          slug: true,
          name: true,
          defaultCurrency: true,
          brandLogoUrl: true,
          brandColorsJson: true,
          website: true,
          supportEmail: true,
        },
      },
    },
  })

  if (custom?.merchant && custom.status === "verified") {
    return { mode: "tenant", tenant: custom.merchant, host: hostHeader }
  }

  const isRoot =
    hostname === root.hostname && (!root.port || !port || root.port === port)
  if (isRoot) {
    return { mode: "hub", tenant: null, host: hostHeader }
  }

  if (hostname.endsWith(`.${root.hostname}`)) {
    const slug = hostname.slice(0, -1 * (root.hostname.length + 1))
    if (slug) {
      const merchant = await prisma.merchant.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          defaultCurrency: true,
          brandLogoUrl: true,
          brandColorsJson: true,
          website: true,
          supportEmail: true,
        },
      })
      if (merchant) {
        return { mode: "tenant", tenant: merchant, host: hostHeader }
      }
    }
  }

  return { mode: "hub", tenant: null, host: hostHeader }
}

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const host = headers().get("x-forwarded-host") || headers().get("host") || ""
  return resolveTenantByHost(host)
})

export async function getTenantContextFromRequest(req: Request): Promise<TenantContext> {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.headers.get("x-host") ||
    ""
  return resolveTenantByHost(host)
}
