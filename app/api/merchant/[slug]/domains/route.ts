import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { resolveTxt } from "dns/promises"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireMerchantRole } from "@/lib/rbac"
import { requireMerchantCapability, AccessControlError, accessErrorResponse } from "@/lib/access-control"

const domainSchema = z
  .string()
  .min(3)
  .max(255)
  .transform((value) => value.toLowerCase().trim())

const TXT_PREFIX = "_vouchr"

function getVerificationRecord(domain: string, token: string) {
  return {
    name: `${TXT_PREFIX}.${domain}`,
    value: `vouchr-verification=${token}`,
  }
}

async function verifyDomainToken(domain: string, token: string) {
  const { name, value } = getVerificationRecord(domain, token)
  try {
    const records = await resolveTxt(name)
    const flattened = records.flat().map((entry) => entry.trim())
    return flattened.some((entry) => entry === token || entry === value)
  } catch {
    return false
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{slug: string}> }
) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  })
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_admin")

  const domains = await prisma.domainMapping.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ domains })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{slug: string}> }
) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  })
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_admin")

  // Custom domains are a Pro+ capability — adding one requires the
  // domain.custom entitlement (this route has no withErrorHandler wrapper,
  // so convert the thrown AccessControlError into a clean response).
  try {
    await requireMerchantCapability(merchant.id, merchant.slug, "domain.custom")
  } catch (err) {
    if (err instanceof AccessControlError) return accessErrorResponse(err)
    throw err
  }

  const body = await req.json().catch(() => ({}))
  const domain = domainSchema.parse(body.domain || "")

  const existing = await prisma.domainMapping.findUnique({ where: { domain } })
  if (existing) {
    if (existing.merchantId !== merchant.id) {
      return NextResponse.json({ error: "Domain already in use" }, { status: 409 })
    }
    return NextResponse.json({ domain: existing })
  }

  const verificationToken = randomUUID()
  const created = await prisma.domainMapping.create({
    data: {
      merchantId: merchant.id,
      domain,
      status: "pending",
      verificationToken,
    },
  })

  const verification = getVerificationRecord(domain, verificationToken)
  return NextResponse.json({ domain: created, verification })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{slug: string}> }
) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  })
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_admin")

  const body = await req.json().catch(() => ({}))
  const domain = domainSchema.parse(body.domain || "")

  const mapping = await prisma.domainMapping.findFirst({
    where: { domain, merchantId: merchant.id },
  })
  if (!mapping) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 })
  }

  if (!mapping.verificationToken) {
    return NextResponse.json({ error: "Missing verification token" }, { status: 400 })
  }

  const verified = await verifyDomainToken(domain, mapping.verificationToken)
  if (!verified) {
    const verification = getVerificationRecord(domain, mapping.verificationToken)
    return NextResponse.json(
      {
        error: "Domain not verified",
        verification,
      },
      { status: 400 }
    )
  }

  const updated = await prisma.domainMapping.update({
    where: { id: mapping.id },
    data: { status: "verified", verifiedAt: new Date() },
  })

  return NextResponse.json({ domain: updated })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{slug: string}> }
) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  })
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_admin")

  const url = new URL(req.url)
  const domainParam = url.searchParams.get("domain")
  const domain = domainParam ? domainSchema.parse(domainParam) : null
  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 })
  }

  const mapping = await prisma.domainMapping.findFirst({
    where: { domain, merchantId: merchant.id },
  })
  if (!mapping) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 })
  }
  await prisma.domainMapping.delete({ where: { id: mapping.id } })
  return NextResponse.json({ ok: true })
}
