import { Prisma, PrismaClient } from "@prisma/client"
import crypto from "crypto"
import { getDefaultBuilderConfig } from "../lib/page-builder"
import { hashPassword } from "../lib/passwords"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  await prisma.merchant.deleteMany({
    where: { slug: { in: ["coffee-house", "tech-store"] } },
  })

  const merchant1 = await prisma.merchant.create({
    data: {
      name: "Coffee House",
      slug: "coffee-house",
      country: "US",
      defaultCurrency: "USD",
      website: "https://coffee-house.example",
      supportEmail: "support@coffee-house.example",
      brandColorsJson: {
        primary: "#8B4513",
        secondary: "#D2691E",
        background: "#FFF8DC",
      },
      onboardedAt: new Date(),
    },
  })

  const merchant2 = await prisma.merchant.create({
    data: {
      name: "Tech Store",
      slug: "tech-store",
      country: "GB",
      defaultCurrency: "GBP",
      website: "https://tech-store.example",
      supportEmail: "support@tech-store.example",
      brandColorsJson: {
        primary: "#0066CC",
        secondary: "#003366",
        background: "#F0F8FF",
      },
      onboardedAt: new Date(),
    },
  })

  const credentials = {
    platformAdmin: {
      email: process.env.TEST_PLATFORM_ADMIN_EMAIL ?? "platform-admin@gifthub.local",
      password: process.env.TEST_PLATFORM_ADMIN_PASSWORD ?? "platform123",
      name: "Platform Admin",
    },
    merchantAdmin: {
      email: process.env.TEST_ADMIN_EMAIL ?? "admin@coffee-house.com",
      password: process.env.TEST_ADMIN_PASSWORD ?? "admin123",
      name: "Admin User",
    },
    merchantStaff: {
      email: process.env.TEST_STAFF_EMAIL ?? "staff@coffee-house.com",
      password: process.env.TEST_STAFF_PASSWORD ?? "staff123",
      name: "Staff User",
    },
    techAdmin: {
      email: process.env.TEST_TECH_ADMIN_EMAIL ?? "admin@tech-store.com",
      password: process.env.TEST_TECH_ADMIN_PASSWORD ?? "techadmin123",
      name: "Tech Admin",
    },
    endUser: {
      email: process.env.TEST_USER_EMAIL ?? "test@example.com",
      password: process.env.TEST_USER_PASSWORD ?? "test123",
      name: "Test User",
    },
    regularUser: {
      email: "user@example.com",
      password: "user123",
      name: "Regular User",
    },
  }

  const credentialHashes = {
    platformAdmin: await hashPassword(credentials.platformAdmin.password),
    merchantAdmin: await hashPassword(credentials.merchantAdmin.password),
    merchantStaff: await hashPassword(credentials.merchantStaff.password),
    techAdmin: await hashPassword(credentials.techAdmin.password),
    endUser: await hashPassword(credentials.endUser.password),
    regularUser: await hashPassword(credentials.regularUser.password),
  }

  const platformAdminUser = await prisma.user.upsert({
    where: { email: credentials.platformAdmin.email },
    create: {
      email: credentials.platformAdmin.email,
      name: credentials.platformAdmin.name,
      passwordHash: credentialHashes.platformAdmin,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.platformAdmin.name,
      passwordHash: credentialHashes.platformAdmin,
      emailVerified: new Date(),
      status: "active",
    },
  })

  // Create platform admin org and assign membership
  const existingPlatformOrg = await prisma.organization.findFirst({
    where: { name: "GiftHub Platform" },
  })
  const platformOrg = existingPlatformOrg ?? (await prisma.organization.create({
    data: {
      name: "GiftHub Platform",
      type: "platform_owner",
      status: "active",
    },
  }))

  await prisma.orgMembership.upsert({
    where: {
      orgId_userId: { orgId: platformOrg.id, userId: platformAdminUser.id },
    },
    create: { orgId: platformOrg.id, userId: platformAdminUser.id, role: "owner" },
    update: {},
  })

  const adminUser = await prisma.user.upsert({
    where: { email: credentials.merchantAdmin.email },
    create: {
      email: credentials.merchantAdmin.email,
      name: credentials.merchantAdmin.name,
      passwordHash: credentialHashes.merchantAdmin,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.merchantAdmin.name,
      passwordHash: credentialHashes.merchantAdmin,
      emailVerified: new Date(),
      status: "active",
    },
  })

  const staffUser = await prisma.user.upsert({
    where: { email: credentials.merchantStaff.email },
    create: {
      email: credentials.merchantStaff.email,
      name: credentials.merchantStaff.name,
      passwordHash: credentialHashes.merchantStaff,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.merchantStaff.name,
      passwordHash: credentialHashes.merchantStaff,
      emailVerified: new Date(),
      status: "active",
    },
  })

  const merchantAdmin2 = await prisma.user.upsert({
    where: { email: credentials.techAdmin.email },
    create: {
      email: credentials.techAdmin.email,
      name: credentials.techAdmin.name,
      passwordHash: credentialHashes.techAdmin,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.techAdmin.name,
      passwordHash: credentialHashes.techAdmin,
      emailVerified: new Date(),
      status: "active",
    },
  })

  const endUser = await prisma.user.upsert({
    where: { email: credentials.endUser.email },
    create: {
      email: credentials.endUser.email,
      name: credentials.endUser.name,
      passwordHash: credentialHashes.endUser,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.endUser.name,
      passwordHash: credentialHashes.endUser,
      emailVerified: new Date(),
      status: "active",
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { email: credentials.regularUser.email },
    create: {
      email: credentials.regularUser.email,
      name: credentials.regularUser.name,
      passwordHash: credentialHashes.regularUser,
      emailVerified: new Date(),
      status: "active",
    },
    update: {
      name: credentials.regularUser.name,
      passwordHash: credentialHashes.regularUser,
      emailVerified: new Date(),
      status: "active",
    },
  })

  await prisma.merchantMember.createMany({
    data: [
      { merchantId: merchant1.id, userId: adminUser.id, role: "merchant_admin" },
      { merchantId: merchant1.id, userId: staffUser.id, role: "merchant_staff" },
      { merchantId: merchant2.id, userId: merchantAdmin2.id, role: "merchant_admin" },
    ],
    skipDuplicates: true,
  })

  // Create user org memberships (for platform access)
  await prisma.orgMembership.createMany({
    data: [
      { orgId: platformOrg.id, userId: adminUser.id, role: "admin" },
      { orgId: platformOrg.id, userId: staffUser.id, role: "support" },
      { orgId: platformOrg.id, userId: merchantAdmin2.id, role: "admin" },
      { orgId: platformOrg.id, userId: endUser.id, role: "support" },
      { orgId: platformOrg.id, userId: regularUser.id, role: "support" },
    ],
    skipDuplicates: true,
  })

  // Create sample wallet credits for end users
  await prisma.creditLedger.createMany({
    data: [
      {
        merchantId: merchant1.id,
        userId: endUser.id,
        amount: 5000,
        currency: "USD",
        status: "available",
        source: "referral_redemption",
        sourceId: `credit_${endUser.id}_1`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        merchantId: merchant2.id,
        userId: endUser.id,
        amount: 3000,
        currency: "GBP",
        status: "available",
        source: "referral_redemption",
        sourceId: `credit_${endUser.id}_2`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        merchantId: merchant1.id,
        userId: regularUser.id,
        amount: 2500,
        currency: "USD",
        status: "available",
        source: "referral_redemption",
        sourceId: `credit_${regularUser.id}_1`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  })

  const existingBuyerOrg = await prisma.organization.findFirst({
    where: { name: "Acme Corp" },
  })
  const buyerOrg = existingBuyerOrg ?? (await prisma.organization.create({
    data: {
      name: "Acme Corp",
      type: "buyer",
      registryCode: "1234567",
      vatNumber: "EE123456789",
      billingEmail: "finance@acme.example",
      status: "active",
    },
  }))

  const existingPartnerOrg = await prisma.organization.findFirst({
    where: { name: "Coffee House Partner" },
  })
  const partnerOrg = existingPartnerOrg ?? (await prisma.organization.create({
    data: {
      name: "Coffee House Partner",
      type: "partner",
      billingEmail: "billing@coffee-house.example",
      status: "active",
    },
  }))

  await prisma.orgMembership.createMany({
    data: [
      { orgId: buyerOrg.id, userId: adminUser.id, role: "owner" },
      { orgId: buyerOrg.id, userId: staffUser.id, role: "finance" },
      { orgId: partnerOrg.id, userId: adminUser.id, role: "partner_cashier" },
    ],
    skipDuplicates: true,
  })

  const partnerKey = "partner_demo_key_coffee_house"
  const partnerKeyHash = crypto.createHash("sha256").update(partnerKey).digest("hex")
  await prisma.partnerApiKey.upsert({
    where: { keyHash: partnerKeyHash },
    create: { orgId: partnerOrg.id, label: "Demo Partner Key", keyHash: partnerKeyHash },
    update: {},
  })

  let b2bCampaign = await prisma.voucherCampaign.findFirst({
    where: { orgId: buyerOrg.id, name: "Employee Benefits Q1" },
  })
  if (!b2bCampaign) {
    b2bCampaign = await prisma.voucherCampaign.create({
      data: {
        orgId: buyerOrg.id,
        name: "Employee Benefits Q1",
        description: "Quarterly benefit vouchers for employees",
        codePrefix: "ACME-2026-",
        valueType: "fixed",
        valueAmount: 5000,
        currency: "EUR",
        usageType: "single",
        maxRedemptionsPerVoucher: 1,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "active",
      },
    })
  }

  await prisma.campaignAllowedPartner.createMany({
    data: [{ campaignId: b2bCampaign.id, partnerOrgId: partnerOrg.id }],
    skipDuplicates: true,
  })

  const voucherCode = `${b2bCampaign.codePrefix}0001`
  const voucherHash = crypto.createHash("sha256").update(voucherCode).digest("hex")
  const existingVoucher = await prisma.voucherInstance.findUnique({
    where: { code: voucherCode },
  })
  if (!existingVoucher) {
    await prisma.voucherInstance.create({
      data: {
        campaignId: b2bCampaign.id,
        orgId: buyerOrg.id,
        code: voucherCode,
        codeHash: voucherHash,
        status: "active",
        issuedToType: "person",
        issuedToEmail: "employee@acme.example",
        initialValueAmount: 5000,
        remainingValueAmount: 5000,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    })
  }

  const campaign1 = await prisma.campaign.create({
    data: {
      merchantId: merchant1.id,
      name: "Holiday Special",
      description: "Limited time holiday promotion",
      type: "limited",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      price: 0,
      discountRules: {
        type: "percentage",
        value: 15,
      },
      maxRedemptions: 100,
      terms: "Valid for new customers only",
      creditPercentage: 500,
      status: "active",
    },
  })

  const campaign2 = await prisma.campaign.create({
    data: {
      merchantId: merchant1.id,
      name: "Weekly Monday Drop",
      description: "Weekly limited stock drop",
      type: "weekly",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      price: 500,
      discountRules: {
        type: "fixed_amount",
        value: 500,
      },
      maxRedemptions: 50,
      maxPurchases: 100,
      terms: "Limited stock, first come first served",
      creditPercentage: 1000,
      status: "active",
    },
  })

  const voucher1 = await prisma.voucher.create({
    data: {
      merchantId: merchant1.id,
      campaignId: campaign1.id,
      status: "published",
      type: "percentage",
      value: 1500,
      currency: "USD",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimitTotal: 100,
      usageLimitPerUser: 1,
      weeklyDropEnabled: false,
      designJson: {
        logo: null,
        primaryColor: "#8B4513",
        secondaryColor: "#D2691E",
        backgroundColor: "#FFF8DC",
        headline: "15% Off Your Order",
        finePrint: "Valid for new customers only",
      },
      codePrefix: "CH",
    },
  })

  const voucher2 = await prisma.voucher.create({
    data: {
      merchantId: merchant1.id,
      campaignId: campaign2.id,
      status: "published",
      type: "fixed_amount",
      value: 500,
      currency: "USD",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usageLimitTotal: 50,
      usageLimitPerUser: 1,
      weeklyDropEnabled: true,
      weeklyDropJson: {
        dayOfWeek: 1,
        startTime: "10:00",
        stock: 20,
        durationMinutes: 60,
      },
      designJson: {
        logo: null,
        primaryColor: "#8B4513",
        secondaryColor: "#D2691E",
        backgroundColor: "#FFF8DC",
        headline: "$5 Off - Weekly Drop",
        finePrint: "Limited stock, first come first served",
      },
      codePrefix: "CHWD",
    },
  })

  await prisma.voucher.create({
    data: {
      merchantId: merchant2.id,
      status: "published",
      type: "credit_amount",
      value: 1000,
      currency: "GBP",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimitTotal: 200,
      usageLimitPerUser: 1,
      weeklyDropEnabled: false,
      designJson: {
        logo: null,
        primaryColor: "#0066CC",
        secondaryColor: "#003366",
        backgroundColor: "#F0F8FF",
        headline: "GBP 10 Store Credit",
        finePrint: "Credit expires 60 days after redemption",
      },
      codePrefix: "TS",
    },
  })

  type CampaignSeedTemplate = {
    merchantId: string
    currency: string
    name: string
    description: string
    type: "weekly" | "limited"
    status: "draft" | "active" | "ended"
    startOffsetDays: number
    durationDays: number
    price: number
    discountType: "percentage" | "fixed_amount" | "credit_amount"
    discountValue: number
    voucherType: "percentage" | "fixed_amount" | "credit_amount"
    voucherValue: number
    usageLimitTotal: number
    usageLimitPerUser: number
    creditPercentage: number
    codePrefix: string
    colorPrimary: string
    colorSecondary: string
    colorBackground: string
    terms: string
    weeklyDropJson?: {
      dayOfWeek: number
      startTime: string
      stock: number
      durationMinutes: number
    }
  }

  const dayMs = 24 * 60 * 60 * 1000
  const campaignTemplates: CampaignSeedTemplate[] = [
    {
      merchantId: merchant1.id,
      currency: "USD",
      name: "Coffee Brunch Bundle",
      description: "Cafe combo for coffee and bakery lovers.",
      type: "limited",
      status: "active",
      startOffsetDays: -3,
      durationDays: 45,
      price: 1299,
      discountType: "fixed_amount",
      discountValue: 400,
      voucherType: "fixed_amount",
      voucherValue: 400,
      usageLimitTotal: 160,
      usageLimitPerUser: 2,
      creditPercentage: 700,
      codePrefix: "CAFE",
      colorPrimary: "#7B4F2C",
      colorSecondary: "#D99B5F",
      colorBackground: "#FFF3E4",
      terms: "Valid on brunch menu items from 08:00-14:00.",
    },
    {
      merchantId: merchant1.id,
      currency: "USD",
      name: "Beauty and Wellness Reset",
      description: "Spa and massage package for beauty and wellness.",
      type: "limited",
      status: "active",
      startOffsetDays: -1,
      durationDays: 60,
      price: 4900,
      discountType: "fixed_amount",
      discountValue: 1200,
      voucherType: "fixed_amount",
      voucherValue: 1200,
      usageLimitTotal: 90,
      usageLimitPerUser: 1,
      creditPercentage: 1200,
      codePrefix: "BEAUTY",
      colorPrimary: "#B86B77",
      colorSecondary: "#E8A9B5",
      colorBackground: "#FFF1F4",
      terms: "Reservation required 24h in advance.",
    },
    {
      merchantId: merchant1.id,
      currency: "USD",
      name: "Family Kids Birthday Pass",
      description: "Family and kids package for birthday play sessions.",
      type: "limited",
      status: "active",
      startOffsetDays: -5,
      durationDays: 40,
      price: 2999,
      discountType: "percentage",
      discountValue: 20,
      voucherType: "percentage",
      voucherValue: 2000,
      usageLimitTotal: 140,
      usageLimitPerUser: 1,
      creditPercentage: 900,
      codePrefix: "FAMILY",
      colorPrimary: "#6A8F4E",
      colorSecondary: "#B9D88A",
      colorBackground: "#F4FFE9",
      terms: "Includes one free kids drink.",
    },
    {
      merchantId: merchant1.id,
      currency: "USD",
      name: "Outdoor Adventure Weekend",
      description: "Outdoor hike and trail snack partner offer.",
      type: "weekly",
      status: "active",
      startOffsetDays: -7,
      durationDays: 84,
      price: 1500,
      discountType: "fixed_amount",
      discountValue: 500,
      voucherType: "fixed_amount",
      voucherValue: 500,
      usageLimitTotal: 100,
      usageLimitPerUser: 1,
      creditPercentage: 1000,
      codePrefix: "OUTDOOR",
      colorPrimary: "#3E6D54",
      colorSecondary: "#86BC9E",
      colorBackground: "#ECFFF4",
      terms: "Redeemable only on Saturdays and Sundays.",
      weeklyDropJson: {
        dayOfWeek: 6,
        startTime: "09:00",
        stock: 30,
        durationMinutes: 90,
      },
    },
    {
      merchantId: merchant2.id,
      currency: "GBP",
      name: "Fitness and Sport Pro Pack",
      description: "Gym and fitness accessories with training credit.",
      type: "limited",
      status: "active",
      startOffsetDays: -2,
      durationDays: 50,
      price: 4500,
      discountType: "percentage",
      discountValue: 18,
      voucherType: "percentage",
      voucherValue: 1800,
      usageLimitTotal: 130,
      usageLimitPerUser: 2,
      creditPercentage: 1100,
      codePrefix: "FIT",
      colorPrimary: "#245C9D",
      colorSecondary: "#78A8DE",
      colorBackground: "#EFF7FF",
      terms: "Applies to fitness tagged products only.",
    },
    {
      merchantId: merchant2.id,
      currency: "GBP",
      name: "Live Concert Ticket Drop",
      description: "Events and ticket bundle with limited seats.",
      type: "weekly",
      status: "active",
      startOffsetDays: -6,
      durationDays: 70,
      price: 3500,
      discountType: "fixed_amount",
      discountValue: 900,
      voucherType: "fixed_amount",
      voucherValue: 900,
      usageLimitTotal: 120,
      usageLimitPerUser: 1,
      creditPercentage: 800,
      codePrefix: "EVENT",
      colorPrimary: "#3E3B8E",
      colorSecondary: "#8A84E2",
      colorBackground: "#F1F0FF",
      terms: "Limited seats per drop. First come first served.",
      weeklyDropJson: {
        dayOfWeek: 4,
        startTime: "12:00",
        stock: 25,
        durationMinutes: 75,
      },
    },
    {
      merchantId: merchant2.id,
      currency: "GBP",
      name: "Workshop Masterclass Access",
      description: "Workshop and class access for creators and teams.",
      type: "limited",
      status: "active",
      startOffsetDays: 1,
      durationDays: 30,
      price: 2000,
      discountType: "fixed_amount",
      discountValue: 600,
      voucherType: "fixed_amount",
      voucherValue: 600,
      usageLimitTotal: 80,
      usageLimitPerUser: 1,
      creditPercentage: 600,
      codePrefix: "WORK",
      colorPrimary: "#5A5A5A",
      colorSecondary: "#B9B9B9",
      colorBackground: "#FAFAFA",
      terms: "Seats are confirmed only after purchase.",
    },
    {
      merchantId: merchant2.id,
      currency: "GBP",
      name: "Travel and Stay Explorer",
      description: "Travel and hotel partner bundle for weekend trips.",
      type: "limited",
      status: "active",
      startOffsetDays: -4,
      durationDays: 90,
      price: 7900,
      discountType: "fixed_amount",
      discountValue: 1500,
      voucherType: "fixed_amount",
      voucherValue: 1500,
      usageLimitTotal: 70,
      usageLimitPerUser: 1,
      creditPercentage: 1300,
      codePrefix: "TRAVEL",
      colorPrimary: "#1B5D72",
      colorSecondary: "#7BC6D8",
      colorBackground: "#ECFAFF",
      terms: "Subject to partner inventory availability.",
    },
    {
      merchantId: merchant2.id,
      currency: "GBP",
      name: "Draft Fitness Preview",
      description: "Upcoming fitness campaign preview for early planning.",
      type: "limited",
      status: "draft",
      startOffsetDays: 7,
      durationDays: 35,
      price: 4200,
      discountType: "percentage",
      discountValue: 15,
      voucherType: "percentage",
      voucherValue: 1500,
      usageLimitTotal: 60,
      usageLimitPerUser: 1,
      creditPercentage: 500,
      codePrefix: "DRAFTFIT",
      colorPrimary: "#2E5F7E",
      colorSecondary: "#89BDD9",
      colorBackground: "#F1F8FD",
      terms: "Draft campaign not publicly visible.",
    },
    {
      merchantId: merchant1.id,
      currency: "USD",
      name: "Winter Event Archive",
      description: "Event and ticket campaign already finished.",
      type: "limited",
      status: "ended",
      startOffsetDays: -60,
      durationDays: 20,
      price: 1800,
      discountType: "fixed_amount",
      discountValue: 300,
      voucherType: "fixed_amount",
      voucherValue: 300,
      usageLimitTotal: 75,
      usageLimitPerUser: 1,
      creditPercentage: 400,
      codePrefix: "ENDED",
      colorPrimary: "#8F6A46",
      colorSecondary: "#CFB094",
      colorBackground: "#FFF7EF",
      terms: "Ended campaign for historical dashboard data.",
    },
  ]

  for (const template of campaignTemplates) {
    const startDate = new Date(Date.now() + template.startOffsetDays * dayMs)
    const endDate = new Date(startDate.getTime() + template.durationDays * dayMs)
    const voucherStatus = template.status === "active" ? "published" : template.status

    const campaign = await prisma.campaign.create({
      data: {
        merchantId: template.merchantId,
        name: template.name,
        description: template.description,
        type: template.type,
        startDate,
        endDate,
        price: template.price,
        discountRules: {
          type: template.discountType,
          value: template.discountValue,
          currency: template.currency,
        },
        maxRedemptions: template.usageLimitTotal,
        maxPurchases: Math.max(template.usageLimitTotal, template.usageLimitTotal + 40),
        terms: template.terms,
        creditPercentage: template.creditPercentage,
        status: template.status,
      },
    })

    await prisma.voucher.create({
      data: {
        merchantId: template.merchantId,
        campaignId: campaign.id,
        status: voucherStatus,
        type: template.voucherType,
        value: template.voucherValue,
        currency: template.currency,
        validFrom: startDate,
        validTo: endDate,
        usageLimitTotal: template.usageLimitTotal,
        usageLimitPerUser: template.usageLimitPerUser,
        weeklyDropEnabled: Boolean(template.weeklyDropJson),
        weeklyDropJson: template.weeklyDropJson ?? Prisma.DbNull,
        designJson: {
          logo: null,
          primaryColor: template.colorPrimary,
          secondaryColor: template.colorSecondary,
          backgroundColor: template.colorBackground,
          headline: template.name,
          finePrint: template.terms,
        },
        codePrefix: template.codePrefix,
      },
    })
  }

  await prisma.product.createMany({
    data: [
      {
        merchantId: merchant1.id,
        name: "House Blend",
        description: "Freshly roasted beans",
        price: 1599,
        currency: "USD",
      },
      {
        merchantId: merchant1.id,
        name: "Gift Pack",
        description: "Coffee + mug set",
        price: 3299,
        currency: "USD",
      },
      {
        merchantId: merchant2.id,
        name: "Wireless Headphones",
        description: "Noise cancelling, 30h battery",
        price: 9900,
        currency: "GBP",
      },
      {
        merchantId: merchant2.id,
        name: "Smart Home Kit",
        description: "Sensor + hub bundle",
        price: 12900,
        currency: "GBP",
      },
    ],
  })

  await prisma.rentalItem.createMany({
    data: [
      {
        merchantId: merchant1.id,
        name: "Espresso Machine",
        description: "Perfect for pop-ups and events",
        dailyRate: 4500,
        weeklyRate: 25000,
        currency: "USD",
      },
      {
        merchantId: merchant2.id,
        name: "Projector Kit",
        description: "Portable 4K projector with screen",
        dailyRate: 6000,
        weeklyRate: 32000,
        currency: "GBP",
      },
    ],
  })

  const storeConfig1 = getDefaultBuilderConfig("store")
  const rentalConfig1 = getDefaultBuilderConfig("rental")
  await prisma.pageBuilderPage.createMany({
    data: [
      {
        merchantId: merchant1.id,
        type: "store",
        status: "published",
        title: storeConfig1.title,
        subtitle: storeConfig1.subtitle,
        sectionsJson: storeConfig1.sections,
        addonsJson: storeConfig1.addons,
        themeJson: storeConfig1.theme,
      },
      {
        merchantId: merchant1.id,
        type: "rental",
        status: "published",
        title: rentalConfig1.title,
        subtitle: rentalConfig1.subtitle,
        sectionsJson: rentalConfig1.sections,
        addonsJson: rentalConfig1.addons,
        themeJson: rentalConfig1.theme,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.pageBuilderPage.createMany({
    data: [
      {
        merchantId: merchant2.id,
        type: "store",
        status: "published",
        title: "Tech Storefront",
        subtitle: "Top electronics curated for teams.",
        sectionsJson: storeConfig1.sections,
        addonsJson: storeConfig1.addons,
        themeJson: storeConfig1.theme,
      },
      {
        merchantId: merchant2.id,
        type: "rental",
        status: "published",
        title: "Tech Rentals",
        subtitle: "Rent gear for your next launch.",
        sectionsJson: rentalConfig1.sections,
        addonsJson: rentalConfig1.addons,
        themeJson: rentalConfig1.theme,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.sitePage.createMany({
    data: [
      {
        merchantId: merchant1.id,
        scope: "tenant",
        slug: "/",
        title: "Coffee House",
        description: "Coffee House homepage",
        status: "published",
        blocksJson: ["hero", "featured_products", "featured_vouchers", "featured_rentals", "tenant_stats"],
      },
      {
        merchantId: merchant1.id,
        scope: "tenant",
        slug: "about",
        title: "About",
        description: "About Coffee House",
        status: "published",
        blocksJson: ["hero", "featured_vouchers", "tenant_stats"],
      },
      {
        merchantId: merchant1.id,
        scope: "tenant",
        slug: "contact",
        title: "Contact",
        description: "Contact Coffee House",
        status: "published",
        blocksJson: ["hero", "tenant_stats"],
      },
      {
        merchantId: merchant2.id,
        scope: "tenant",
        slug: "/",
        title: "Tech Store",
        description: "Tech Store homepage",
        status: "published",
        blocksJson: ["hero", "featured_products", "featured_vouchers", "featured_rentals", "tenant_stats"],
      },
      {
        merchantId: merchant2.id,
        scope: "tenant",
        slug: "about",
        title: "About",
        description: "About Tech Store",
        status: "published",
        blocksJson: ["hero", "featured_products", "tenant_stats"],
      },
      {
        merchantId: merchant2.id,
        scope: "tenant",
        slug: "contact",
        title: "Contact",
        description: "Contact Tech Store",
        status: "published",
        blocksJson: ["hero", "tenant_stats"],
      },
      {
        scope: "hub",
        slug: "/",
        title: "Hub",
        description: "Hub homepage",
        status: "published",
        blocksJson: ["hero", "featured_tenants", "featured_products", "featured_rentals", "featured_vouchers"],
      },
    ],
    skipDuplicates: true,
  })

  await prisma.navigationLink.createMany({
    data: [
      { scope: "hub", label: "Hub", href: "/hub", position: "header", order: 0 },
      { scope: "hub", label: "Tenants", href: "/hub#tenants", position: "header", order: 1 },
      { scope: "hub", label: "Campaigns", href: "/campaigns", position: "header", order: 2 },
      { scope: "hub", label: "Privacy", href: "/privacy", position: "footer", order: 0 },
      { scope: "hub", label: "Terms", href: "/terms", position: "footer", order: 1 },
      { scope: "tenant", merchantId: merchant1.id, label: "Home", href: "/", position: "header", order: 0 },
      { scope: "tenant", merchantId: merchant1.id, label: "Shop", href: "/shop", position: "header", order: 1 },
      { scope: "tenant", merchantId: merchant1.id, label: "Rent", href: "/rent", position: "header", order: 2 },
      { scope: "tenant", merchantId: merchant1.id, label: "Vouchers", href: "/campaigns", position: "header", order: 3 },
      { scope: "tenant", merchantId: merchant1.id, label: "About", href: "/p/about", position: "footer", order: 0 },
      { scope: "tenant", merchantId: merchant1.id, label: "Contact", href: "/p/contact", position: "footer", order: 1 },
      { scope: "tenant", merchantId: merchant2.id, label: "Home", href: "/", position: "header", order: 0 },
      { scope: "tenant", merchantId: merchant2.id, label: "Shop", href: "/shop", position: "header", order: 1 },
      { scope: "tenant", merchantId: merchant2.id, label: "Rent", href: "/rent", position: "header", order: 2 },
      { scope: "tenant", merchantId: merchant2.id, label: "Vouchers", href: "/campaigns", position: "header", order: 3 },
      { scope: "tenant", merchantId: merchant2.id, label: "About", href: "/p/about", position: "footer", order: 0 },
      { scope: "tenant", merchantId: merchant2.id, label: "Contact", href: "/p/contact", position: "footer", order: 1 },
    ],
    skipDuplicates: true,
  })

  await prisma.domainMapping.createMany({
    data: [
      {
        merchantId: merchant1.id,
        domain: "coffee-house.local",
        status: "verified",
        verificationToken: "local-verify-coffee",
        verifiedAt: new Date(),
      },
      {
        merchantId: merchant2.id,
        domain: "tech-store.local",
        status: "verified",
        verificationToken: "local-verify-tech",
        verifiedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  // Create sample voucher purchases for end users
  await prisma.voucherPurchase.createMany({
    data: [
      {
        voucherId: voucher1.id,
        campaignId: campaign1.id,
        merchantId: merchant1.id,
        userId: endUser.id,
        amount: 0,
        currency: "USD",
        status: "paid",
      },
      {
        voucherId: voucher2.id,
        campaignId: campaign2.id,
        merchantId: merchant1.id,
        userId: regularUser.id,
        amount: 500,
        platformFeeAmount: 25,
        currency: "USD",
        status: "paid",
      },
    ],
    skipDuplicates: true,
  })

  // Create sample redemption for end user
  await prisma.redemption.create({
    data: {
      merchantId: merchant1.id,
      voucherId: voucher1.id,
      redeemedByUserId: endUser.id,
      redeemedByStaffUserId: staffUser.id,
      method: "online",
      amountBeforeDiscount: 10000,
      discountApplied: 1500,
      currency: "USD",
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.referral.create({
    data: {
      voucherId: voucher1.id,
      merchantId: merchant1.id,
      referrerUserId: endUser.id,
      friendHash: "hashed_friend_identifier_1",
      status: "opened",
    },
  })

  // ── Gift Hub Seed Data ──
  console.log("Seeding Gift Hub data...")

  // Clean existing gift data
  await prisma.giftFeedItem.deleteMany({})
  await prisma.giftFeedModule.deleteMany({})
  await prisma.userGiftInteraction.deleteMany({})
  await prisma.userGiftProfile.deleteMany({})
  await prisma.sponsoredGiftPlacement.deleteMany({})
  await prisma.giftProductOccasion.deleteMany({})
  await prisma.giftProductPersona.deleteMany({})
  await prisma.giftProduct.deleteMany({})
  await prisma.giftCategory.deleteMany({})
  await prisma.giftOccasion.deleteMany({})
  await prisma.giftPersona.deleteMany({})

  // Categories
  const catExperiences = await prisma.giftCategory.create({
    data: { name: "Experiences", slug: "experiences", description: "Unforgettable experiences and activities", icon: "🎭", color: "#E17B5C", sortOrder: 0 },
  })
  const catFood = await prisma.giftCategory.create({
    data: { name: "Food & Drink", slug: "food-drink", description: "Gourmet food, wine, and culinary delights", icon: "🍷", color: "#9DB5A5", sortOrder: 1 },
  })
  const catWellness = await prisma.giftCategory.create({
    data: { name: "Wellness & Self-Care", slug: "wellness", description: "Spa, fitness, and wellness gifts", icon: "🧘", color: "#A78BFA", sortOrder: 2 },
  })
  const catTech = await prisma.giftCategory.create({
    data: { name: "Tech & Gadgets", slug: "tech", description: "Smart devices and tech accessories", icon: "💻", color: "#3B82F6", sortOrder: 3 },
  })
  const catHome = await prisma.giftCategory.create({
    data: { name: "Home & Living", slug: "home-living", description: "Decor, plants, and cozy essentials", icon: "🏠", color: "#F5C98E", sortOrder: 4 },
  })

  // Occasions
  const occBirthday = await prisma.giftOccasion.create({
    data: { name: "Birthday", slug: "birthday", description: "Birthday celebrations", icon: "🎂", seasonalityWeight: 1.0, activeMonths: [], sortOrder: 0 },
  })
  const occChristmas = await prisma.giftOccasion.create({
    data: { name: "Christmas", slug: "christmas", description: "Holiday season gifts", icon: "🎄", seasonalityWeight: 2.5, activeMonths: [11, 12], sortOrder: 1 },
  })
  const occValentines = await prisma.giftOccasion.create({
    data: { name: "Valentine's Day", slug: "valentines", description: "Romantic gifts for your special someone", icon: "❤️", seasonalityWeight: 2.0, activeMonths: [1, 2], sortOrder: 2 },
  })
  const occThankYou = await prisma.giftOccasion.create({
    data: { name: "Thank You", slug: "thank-you", description: "Show appreciation", icon: "🙏", seasonalityWeight: 1.0, activeMonths: [], sortOrder: 3 },
  })
  const occGraduation = await prisma.giftOccasion.create({
    data: { name: "Graduation", slug: "graduation", description: "Celebrate academic achievements", icon: "🎓", seasonalityWeight: 1.5, activeMonths: [5, 6], sortOrder: 4 },
  })

  // Personas
  const perPartner = await prisma.giftPersona.create({
    data: { name: "For Partner", slug: "partner", description: "Romantic gifts for your significant other", icon: "💑", tags: ["partner", "husband", "wife", "boyfriend", "girlfriend"], sortOrder: 0 },
  })
  const perFriend = await prisma.giftPersona.create({
    data: { name: "For Friend", slug: "friend", description: "Fun and thoughtful gifts for friends", icon: "👫", tags: ["friend", "bestie", "bff", "pal"], sortOrder: 1 },
  })
  const perParent = await prisma.giftPersona.create({
    data: { name: "For Parent", slug: "parent", description: "Gifts for mom and dad", icon: "👨‍👩‍👧", tags: ["parent", "mom", "dad", "mother", "father"], sortOrder: 2 },
  })
  const perColleague = await prisma.giftPersona.create({
    data: { name: "For Colleague", slug: "colleague", description: "Professional and appropriate gifts", icon: "💼", tags: ["colleague", "coworker", "boss", "employee", "corporate"], sortOrder: 3 },
  })
  const perChild = await prisma.giftPersona.create({
    data: { name: "For Child", slug: "child", description: "Fun gifts for kids and teens", icon: "👶", tags: ["child", "kid", "teen", "teenager", "son", "daughter"], sortOrder: 4 },
  })

  // Products (20 diverse gifts across merchants)
  const giftProducts = [
    { title: "Sunset Wine Tasting", description: "A guided tasting of 6 premium wines at a scenic vineyard with cheese pairing", priceCents: 7500, cat: catFood, tags: ["wine", "experience", "romantic"], featured: true },
    { title: "Spa Day Retreat", description: "Full-day spa experience with massage, facial, and relaxation pool access", priceCents: 12000, cat: catWellness, tags: ["spa", "relaxation", "self-care"], featured: true },
    { title: "Smart Home Starter Kit", description: "Smart speaker, 2 smart bulbs, and a smart plug bundle", priceCents: 9900, cat: catTech, tags: ["smart-home", "gadget", "digital"], featured: false },
    { title: "Gourmet Chocolate Box", description: "Handcrafted artisan chocolates — 24 pieces in a luxury gift box", priceCents: 3500, cat: catFood, tags: ["chocolate", "luxury", "handmade"], featured: true },
    { title: "Indoor Herb Garden Kit", description: "Self-watering ceramic planter with basil, mint, and rosemary seeds", priceCents: 4500, cat: catHome, tags: ["plants", "garden", "sustainable"], featured: false },
    { title: "Cooking Masterclass", description: "3-hour hands-on cooking class with a professional chef — choose your cuisine", priceCents: 8500, cat: catExperiences, tags: ["cooking", "experience", "food"], featured: true },
    { title: "Wireless Noise-Cancelling Earbuds", description: "Premium sound quality with 30-hour battery life and active noise cancellation", priceCents: 11900, cat: catTech, tags: ["audio", "gadget", "wireless"], featured: false },
    { title: "Scented Candle Collection", description: "Set of 4 hand-poured soy candles — Lavender, Vanilla, Sandalwood, Citrus", priceCents: 2800, cat: catHome, tags: ["candles", "decor", "relaxation"], featured: false },
    { title: "Adventure Day Pass", description: "Full-day access to zip-lining, rock climbing, and obstacle courses", priceCents: 6500, cat: catExperiences, tags: ["adventure", "outdoor", "experience"], featured: true },
    { title: "Yoga & Meditation Subscription", description: "3-month premium subscription to online yoga and meditation classes", priceCents: 3900, cat: catWellness, tags: ["yoga", "meditation", "digital", "subscription"], featured: false },
    { title: "Artisan Coffee Subscription", description: "Monthly delivery of freshly roasted single-origin beans for 3 months", priceCents: 4200, cat: catFood, tags: ["coffee", "subscription", "artisan"], featured: false },
    { title: "Portable Bluetooth Speaker", description: "Waterproof speaker with 360° sound, perfect for outdoor adventures", priceCents: 5900, cat: catTech, tags: ["audio", "portable", "outdoor"], featured: false },
    { title: "Luxury Bath Bomb Set", description: "12 handmade bath bombs with essential oils and dried flowers", priceCents: 2400, cat: catWellness, tags: ["bath", "relaxation", "handmade"], featured: false },
    { title: "Photo Book Creator Voucher", description: "Create a personalized 40-page hardcover photo book — voucher code included", priceCents: 4500, cat: catHome, tags: ["personalized", "photos", "gift-card"], featured: false },
    { title: "Escape Room Experience", description: "Thrilling 60-minute escape room for up to 4 people — choose your theme", priceCents: 8000, cat: catExperiences, tags: ["escape-room", "experience", "group"], featured: false },
    { title: "Premium Steak Dinner for Two", description: "3-course dinner with a bottle of wine at a top-rated steakhouse", priceCents: 15000, cat: catFood, tags: ["dinner", "steak", "romantic", "luxury"], featured: true },
    { title: "Smart Fitness Tracker", description: "Heart rate, sleep tracking, GPS, and 7-day battery life", priceCents: 7900, cat: catTech, tags: ["fitness", "gadget", "health"], featured: false },
    { title: "Cozy Throw Blanket", description: "Ultra-soft merino wool throw blanket — perfect for movie nights", priceCents: 6500, cat: catHome, tags: ["cozy", "blanket", "comfort"], featured: false },
    { title: "Hot Air Balloon Ride", description: "Breathtaking sunrise hot air balloon flight with champagne breakfast", priceCents: 25000, cat: catExperiences, tags: ["adventure", "luxury", "experience", "romantic"], featured: true },
    { title: "Mindfulness Journal & Pen Set", description: "Guided gratitude journal with premium fountain pen in gift box", priceCents: 3200, cat: catWellness, tags: ["journal", "mindfulness", "stationery"], featured: false },
  ]

  const createdProducts = []
  const merchants = [merchant1, merchant2]

  for (let i = 0; i < giftProducts.length; i++) {
    const gp = giftProducts[i]
    const merchant = merchants[i % merchants.length]

    const product = await prisma.giftProduct.create({
      data: {
        title: gp.title,
        description: gp.description,
        priceCents: gp.priceCents,
        currency: "EUR",
        categoryId: gp.cat.id,
        merchantId: merchant.id,
        tags: gp.tags,
        isFeatured: gp.featured,
        mediaUrls: [],
        engagementScore: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500),
        purchaseCount: Math.floor(Math.random() * 50),
      },
    })
    createdProducts.push(product)
  }

  // Link products to occasions and personas
  const occasionMap: Record<string, typeof occBirthday[]> = {
    "experiences": [occBirthday, occChristmas, occGraduation],
    "food-drink": [occBirthday, occChristmas, occValentines, occThankYou],
    "wellness": [occBirthday, occValentines, occThankYou],
    "tech": [occBirthday, occChristmas, occGraduation],
    "home-living": [occChristmas, occThankYou],
  }

  const personaMap: Record<string, typeof perPartner[]> = {
    "experiences": [perPartner, perFriend],
    "food-drink": [perPartner, perFriend, perParent],
    "wellness": [perPartner, perParent, perFriend],
    "tech": [perFriend, perColleague, perChild],
    "home-living": [perParent, perPartner, perColleague],
  }

  for (let i = 0; i < createdProducts.length; i++) {
    const product = createdProducts[i]
    const catSlug = giftProducts[i].cat.slug

    const occasions = occasionMap[catSlug] || [occBirthday]
    const personas = personaMap[catSlug] || [perFriend]

    for (const occ of occasions) {
      await prisma.giftProductOccasion.create({
        data: { productId: product.id, occasionId: occ.id },
      }).catch(() => {}) // ignore duplicate
    }

    for (const per of personas) {
      await prisma.giftProductPersona.create({
        data: { productId: product.id, personaId: per.id },
      }).catch(() => {}) // ignore duplicate
    }
  }

  // Feed Modules
  const trendingModule = await prisma.giftFeedModule.create({
    data: {
      title: "Trending Now",
      subtitle: "Most popular gifts this week",
      type: "TRENDING",
      sortOrder: 0,
      isActive: true,
    },
  })

  const seasonalModule = await prisma.giftFeedModule.create({
    data: {
      title: "Season's Best",
      subtitle: "Top picks for the current season",
      type: "SEASONAL",
      sortOrder: 1,
      isActive: true,
    },
  })

  const budgetModule = await prisma.giftFeedModule.create({
    data: {
      title: "Under €50",
      subtitle: "Great gifts that won't break the bank",
      type: "BUDGET_RANGE",
      sortOrder: 2,
      isActive: true,
      config: JSON.stringify({ budgetMax: 5000 }),
    },
  })

  const premiumModule = await prisma.giftFeedModule.create({
    data: {
      title: "Premium Picks",
      subtitle: "Luxury gifts for special occasions",
      type: "EDITORIAL",
      sortOrder: 3,
      isActive: true,
    },
  })

  const aiModule = await prisma.giftFeedModule.create({
    data: {
      title: "AI Recommended",
      subtitle: "Curated just for you",
      type: "AI_CURATED",
      sortOrder: 4,
      isActive: true,
    },
  })

  // Add items to modules
  const featuredProducts = createdProducts.filter((_, i) => giftProducts[i].featured)
  const cheapProducts = createdProducts.filter((_, i) => giftProducts[i].priceCents <= 5000)

  for (let i = 0; i < Math.min(featuredProducts.length, 5); i++) {
    await prisma.giftFeedItem.create({
      data: { moduleId: trendingModule.id, productId: featuredProducts[i].id, priority: 5 - i },
    })
    await prisma.giftFeedItem.create({
      data: { moduleId: premiumModule.id, productId: featuredProducts[i].id, priority: 5 - i },
    })
  }

  for (let i = 0; i < Math.min(cheapProducts.length, 5); i++) {
    await prisma.giftFeedItem.create({
      data: { moduleId: budgetModule.id, productId: cheapProducts[i].id, priority: 5 - i },
    })
  }

  for (let i = 0; i < Math.min(createdProducts.length, 5); i++) {
    await prisma.giftFeedItem.create({
      data: { moduleId: seasonalModule.id, productId: createdProducts[i].id, priority: 5 - i },
    })
    await prisma.giftFeedItem.create({
      data: { moduleId: aiModule.id, productId: createdProducts[i + 5 < createdProducts.length ? i + 5 : i].id, priority: 5 - i },
    })
  }

  // Sponsored placements
  for (let i = 0; i < 3; i++) {
    const product = featuredProducts[i % featuredProducts.length]
    const merchant = merchants[i % merchants.length]
    await prisma.sponsoredGiftPlacement.create({
      data: {
        merchantId: merchant.id,
        productId: product.id,
        bidCents: (i + 1) * 50,
        dailyBudgetCents: (i + 1) * 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        targetPersonas: [],
        targetOccasions: [],
      },
    })
  }

  console.log(`Gift Hub seed: ${createdProducts.length} products, 5 categories, 5 occasions, 5 personas, 5 modules, 3 sponsors`)

  console.log("Seeding completed.")
  console.log("Sample credentials (email / password):")
  console.log(`  Platform Admin: ${credentials.platformAdmin.email} / ${credentials.platformAdmin.password}`)
  console.log(`  Merchant Admin: ${credentials.merchantAdmin.email} / ${credentials.merchantAdmin.password}`)
  console.log(`  Merchant Staff: ${credentials.merchantStaff.email} / ${credentials.merchantStaff.password}`)
  console.log(`  Tech Admin: ${credentials.techAdmin.email} / ${credentials.techAdmin.password}`)
  console.log(`  End User: ${credentials.endUser.email} / ${credentials.endUser.password}`)
  console.log(`  Secondary User: ${credentials.regularUser.email} / ${credentials.regularUser.password}`)
  console.log(`  Platform admin user id: ${platformAdminUser.id}`)
  console.log(`  Secondary user id: ${regularUser.id}`)
}

function isRetryableDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return error.message.includes("Can't reach database server") || error.message.includes("P1001")
}

async function runSeedWithRetry(maxAttempts = 5) {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await main()
      return
    } catch (error) {
      lastError = error
      if (!isRetryableDatabaseError(error) || attempt === maxAttempts) {
        throw error
      }
      const waitMs = attempt * 1000
      console.warn(`Database not ready (attempt ${attempt}/${maxAttempts}). Retrying in ${waitMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  throw lastError
}

runSeedWithRetry()
  .catch((error) => {
    console.error("Seeding failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
