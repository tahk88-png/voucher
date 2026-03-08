import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireMerchantRole } from "@/lib/rbac"
import {
  PAGE_ADDON_CATALOG,
  PAGE_SECTION_CATALOG,
  getDefaultBuilderConfig,
  type PageBuilderType,
} from "@/lib/page-builder"

const typeSchema = z.enum(["store", "rental"])
const builderSchema = z.object({
  type: typeSchema,
  title: z.string().min(2).max(80),
  subtitle: z.string().max(160).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
  sections: z.array(z.string().min(2).max(40)).min(1).max(24),
  addons: z.array(z.string().min(2).max(40)).optional().default([]),
  theme: z
    .object({
      primary: z.string().max(20).optional(),
      secondary: z.string().max(20).optional(),
      background: z.string().max(20).optional(),
      style: z.enum(["warm", "clean", "bold"]).optional(),
    })
    .optional(),
})

const sectionIds = new Set(PAGE_SECTION_CATALOG.map((section) => section.id))
const addonIds = new Set(PAGE_ADDON_CATALOG.map((addon) => addon.id))

function filterSections(type: PageBuilderType, sections: string[]) {
  const allowed = new Set(
    PAGE_SECTION_CATALOG.filter((section) => section.types.includes(type)).map(
      (section) => section.id
    )
  )
  return sections.filter((id) => sectionIds.has(id) && allowed.has(id))
}

export async function GET(
  req: NextRequest,
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

  await requireMerchantRole(session.user.id, merchant.id, "merchant_staff")

  const typeParam = req.nextUrl.searchParams.get("type")
  const parsedType = typeParam ? typeSchema.safeParse(typeParam) : null

  const pages = await prisma.pageBuilderPage.findMany({
    where: {
      merchantId: merchant.id,
      ...(parsedType?.success ? { type: parsedType.data } : {}),
    },
    orderBy: { updatedAt: "desc" },
  })

  if (parsedType?.success) {
    const existing = pages[0]
    if (!existing) {
      return NextResponse.json({
        page: getDefaultBuilderConfig(parsedType.data),
      })
    }
    return NextResponse.json({
      page: {
        id: existing.id,
        type: existing.type,
        title: existing.title,
        subtitle: existing.subtitle ?? undefined,
        status: existing.status,
        sections: (existing.sectionsJson as string[] | null) ?? [],
        addons: (existing.addonsJson as string[] | null) ?? [],
        theme: (existing.themeJson as Record<string, unknown> | null) ?? undefined,
        updatedAt: existing.updatedAt,
      },
    })
  }

  return NextResponse.json({
    pages: pages.map((page) => ({
      id: page.id,
      type: page.type,
      title: page.title,
      subtitle: page.subtitle ?? undefined,
      status: page.status,
      sections: (page.sectionsJson as string[] | null) ?? [],
      addons: (page.addonsJson as string[] | null) ?? [],
      theme: (page.themeJson as Record<string, unknown> | null) ?? undefined,
      updatedAt: page.updatedAt,
    })),
  })
}

export async function PUT(
  req: NextRequest,
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
  const data = builderSchema.parse(body)
  const sections = filterSections(data.type, data.sections)
  const addons = (data.addons || []).filter((id) => addonIds.has(id))

  const updated = await prisma.pageBuilderPage.upsert({
    where: {
      merchantId_type: {
        merchantId: merchant.id,
        type: data.type,
      },
    },
    update: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      status: data.status ?? "draft",
      sectionsJson: sections,
      addonsJson: addons,
      themeJson: data.theme ? (data.theme as Prisma.InputJsonValue) : undefined,
    },
    create: {
      merchantId: merchant.id,
      type: data.type,
      status: data.status ?? "draft",
      title: data.title,
      subtitle: data.subtitle ?? null,
      sectionsJson: sections,
      addonsJson: addons,
      themeJson: data.theme ? (data.theme as Prisma.InputJsonValue) : undefined,
    },
  })

  return NextResponse.json({
    page: {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      subtitle: updated.subtitle ?? undefined,
      status: updated.status,
      sections,
      addons,
      theme: updated.themeJson ?? undefined,
      updatedAt: updated.updatedAt,
    },
  })
}
