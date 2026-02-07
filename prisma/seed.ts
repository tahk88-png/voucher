import { PrismaClient } from "@prisma/client"
import crypto from "crypto"
import { getDefaultBuilderConfig } from "../lib/page-builder"

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

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@coffee-house.com" },
    create: { email: "admin@coffee-house.com", name: "Admin User", emailVerified: new Date() },
    update: { name: "Admin User" },
  })

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@coffee-house.com" },
    create: { email: "staff@coffee-house.com", name: "Staff User", emailVerified: new Date() },
    update: { name: "Staff User" },
  })

  const merchantAdmin2 = await prisma.user.upsert({
    where: { email: "admin@tech-store.com" },
    create: { email: "admin@tech-store.com", name: "Tech Admin", emailVerified: new Date() },
    update: { name: "Tech Admin" },
  })

  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    create: { email: "user@example.com", name: "Regular User", emailVerified: new Date() },
    update: { name: "Regular User" },
  })

  await prisma.merchantMember.createMany({
    data: [
      { merchantId: merchant1.id, userId: adminUser.id, role: "merchant_admin" },
      { merchantId: merchant1.id, userId: staffUser.id, role: "merchant_staff" },
      { merchantId: merchant2.id, userId: merchantAdmin2.id, role: "merchant_admin" },
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
        headline: "£10 Store Credit",
        finePrint: "Credit expires 60 days after redemption",
      },
      codePrefix: "TS",
    },
  })

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

  await prisma.referral.create({
    data: {
      voucherId: voucher1.id,
      merchantId: merchant1.id,
      referrerUserId: regularUser.id,
      friendHash: "hashed_friend_identifier_1",
      status: "opened",
    },
  })

  console.log("Seeding completed.")
  console.log("Sample credentials:")
  console.log("  Admin: admin@coffee-house.com")
  console.log("  Staff: staff@coffee-house.com")
  console.log("  Tech admin: admin@tech-store.com")
  console.log("  User: user@example.com")
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
