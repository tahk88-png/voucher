import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

let buyerOrgId: string
let partnerOrgId: string
let campaignId: string

beforeAll(async () => {
  // Create test buyer org
  const buyerOrg = await prisma.organization.create({
    data: { name: "Test Buyer Concurrency", type: "buyer", status: "active" },
  })
  buyerOrgId = buyerOrg.id

  // Create test partner org
  const partnerOrg = await prisma.organization.create({
    data: { name: "Test Partner Concurrency", type: "partner", status: "active" },
  })
  partnerOrgId = partnerOrg.id

  // Create campaign
  const campaign = await prisma.voucherCampaign.create({
    data: {
      orgId: buyerOrgId,
      name: "Concurrency Test Campaign",
      valueType: "fixed",
      valueAmount: 10000,
      currency: "EUR",
      usageType: "single",
      maxRedemptionsPerVoucher: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "active",
    },
  })
  campaignId = campaign.id

  await prisma.campaignAllowedPartner.create({
    data: { campaignId: campaign.id, partnerOrgId },
  })
})

afterAll(async () => {
  // Clean up in reverse dependency order
  await prisma.auditEvent.deleteMany({ where: { orgId: { in: [buyerOrgId, partnerOrgId] } } })
  await prisma.voucherRedemption.deleteMany({ where: { partnerOrgId } })
  await prisma.campaignAllowedPartner.deleteMany({ where: { campaignId } })
  await prisma.voucherInstance.deleteMany({ where: { orgId: buyerOrgId } })
  await prisma.voucherCampaign.deleteMany({ where: { orgId: buyerOrgId } })
  await prisma.organization.deleteMany({ where: { id: { in: [buyerOrgId, partnerOrgId] } } })
  await prisma.$disconnect()
})

async function createTestVoucher(code: string, value: number = 5000) {
  const codeHash = hashToken(code)
  return prisma.voucherInstance.create({
    data: {
      campaignId,
      orgId: buyerOrgId,
      code,
      codeHash,
      status: "active",
      initialValueAmount: value,
      remainingValueAmount: value,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })
}

describe("B2B Voucher Redemption - Idempotency", () => {
  it("should return same redemption on idempotent retry", async () => {
    const voucher = await createTestVoucher("IDEMP-TEST-001")
    const idempotencyKey = "idemp-test-key-001"

    // Import the redeemVoucher function
    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    const result1 = await redeemVoucher({
      codeOrQr: "IDEMP-TEST-001",
      partnerOrgId,
      amount: 2000,
      currency: "EUR",
      idempotencyKey,
    })

    expect(result1.reused).toBe(false)
    expect(result1.redemption.amountRedeemed).toBe(2000)

    // Retry with same idempotency key
    const result2 = await redeemVoucher({
      codeOrQr: "IDEMP-TEST-001",
      partnerOrgId,
      amount: 2000,
      currency: "EUR",
      idempotencyKey,
    })

    expect(result2.reused).toBe(true)
    expect(result2.redemption.id).toBe(result1.redemption.id)
    expect(result2.redemption.amountRedeemed).toBe(result1.redemption.amountRedeemed)
  })

  it("should create separate redemptions for different idempotency keys", async () => {
    const voucher = await createTestVoucher("IDEMP-TEST-002", 10000)
    // Update to multi-use campaign for this test
    await prisma.voucherCampaign.update({
      where: { id: campaignId },
      data: { usageType: "multi", maxRedemptionsPerVoucher: 5 },
    })

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    const result1 = await redeemVoucher({
      codeOrQr: "IDEMP-TEST-002",
      partnerOrgId,
      amount: 1000,
      currency: "EUR",
      idempotencyKey: "key-a-002",
    })

    const result2 = await redeemVoucher({
      codeOrQr: "IDEMP-TEST-002",
      partnerOrgId,
      amount: 1000,
      currency: "EUR",
      idempotencyKey: "key-b-002",
    })

    expect(result1.redemption.id).not.toBe(result2.redemption.id)
    expect(result1.reused).toBe(false)
    expect(result2.reused).toBe(false)

    // Restore campaign to single use
    await prisma.voucherCampaign.update({
      where: { id: campaignId },
      data: { usageType: "single", maxRedemptionsPerVoucher: 1 },
    })
  })
})

describe("B2B Voucher Redemption - Concurrency Safety", () => {
  it("should not double-spend on concurrent redemptions", async () => {
    const voucher = await createTestVoucher("CONC-TEST-001", 3000)

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    // Fire two concurrent redemptions for the full amount, different idempotency keys
    const promises = [
      redeemVoucher({
        codeOrQr: "CONC-TEST-001",
        partnerOrgId,
        amount: 3000,
        currency: "EUR",
        idempotencyKey: "conc-key-a-001",
      }).catch((e: Error) => ({ error: e.message })),
      redeemVoucher({
        codeOrQr: "CONC-TEST-001",
        partnerOrgId,
        amount: 3000,
        currency: "EUR",
        idempotencyKey: "conc-key-b-001",
      }).catch((e: Error) => ({ error: e.message })),
    ]

    const results = await Promise.all(promises)

    const successes = results.filter((r) => !("error" in r))
    const failures = results.filter((r) => "error" in r)

    // Exactly one should succeed (single-use voucher)
    expect(successes.length).toBe(1)
    expect(failures.length).toBe(1)

    // Verify voucher state - should be fully redeemed
    const updated = await prisma.voucherInstance.findUnique({ where: { id: voucher.id } })
    expect(updated?.status).toBe("redeemed")
    expect(updated?.remainingValueAmount).toBe(0)

    // Verify only one redemption exists
    const redemptions = await prisma.voucherRedemption.findMany({
      where: { voucherId: voucher.id },
    })
    expect(redemptions.length).toBe(1)
  })

  it("should not exceed remaining value on concurrent partial redemptions", async () => {
    // Create multi-use voucher with 5000 value
    await prisma.voucherCampaign.update({
      where: { id: campaignId },
      data: { usageType: "multi", maxRedemptionsPerVoucher: 10 },
    })
    const voucher = await createTestVoucher("CONC-TEST-002", 5000)

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    // Fire 5 concurrent redemptions for 2000 each (total 10000 > 5000 available)
    const promises = Array.from({ length: 5 }, (_, i) =>
      redeemVoucher({
        codeOrQr: "CONC-TEST-002",
        partnerOrgId,
        amount: 2000,
        currency: "EUR",
        idempotencyKey: `conc-partial-${i}`,
      }).catch((e: Error) => ({ error: e.message }))
    )

    const results = await Promise.all(promises)

    const successes = results.filter((r) => !("error" in r))
    const failures = results.filter((r) => "error" in r)

    // With Serializable isolation, concurrent writes cause serialization failures.
    // The key invariant: at least 1 succeeds, and total redeemed never exceeds available.
    expect(successes.length).toBeGreaterThanOrEqual(1)
    expect(successes.length).toBeLessThanOrEqual(2)
    expect(failures.length).toBeGreaterThanOrEqual(3)

    // Verify total redeemed does not exceed initial value
    const redemptions = await prisma.voucherRedemption.findMany({
      where: { voucherId: voucher.id },
    })
    const totalRedeemed = redemptions.reduce((sum, r) => sum + r.amountRedeemed, 0)
    expect(totalRedeemed).toBeLessThanOrEqual(5000)

    // Verify remaining value is correct
    const updated = await prisma.voucherInstance.findUnique({ where: { id: voucher.id } })
    expect(updated!.remainingValueAmount).toBe(5000 - totalRedeemed)

    // Restore
    await prisma.voucherCampaign.update({
      where: { id: campaignId },
      data: { usageType: "single", maxRedemptionsPerVoucher: 1 },
    })
  })
})

describe("B2B Voucher Redemption - Validation Rules", () => {
  it("should reject expired voucher", async () => {
    const code = "EXPIRED-TEST-001"
    const codeHash = hashToken(code)
    await prisma.voucherInstance.create({
      data: {
        campaignId,
        orgId: buyerOrgId,
        code,
        codeHash,
        status: "active",
        initialValueAmount: 5000,
        remainingValueAmount: 5000,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    })

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    await expect(
      redeemVoucher({
        codeOrQr: code,
        partnerOrgId,
        amount: 1000,
        currency: "EUR",
        idempotencyKey: "expired-key-001",
      })
    ).rejects.toThrow("expired")
  })

  it("should reject unauthorized partner", async () => {
    const voucher = await createTestVoucher("PARTNER-TEST-001")
    const unauthorizedOrg = await prisma.organization.create({
      data: { name: "Unauthorized Partner", type: "partner", status: "active" },
    })

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    await expect(
      redeemVoucher({
        codeOrQr: "PARTNER-TEST-001",
        partnerOrgId: unauthorizedOrg.id,
        amount: 1000,
        currency: "EUR",
        idempotencyKey: "partner-key-001",
      })
    ).rejects.toThrow("Partner not allowed")

    // Clean up
    await prisma.organization.delete({ where: { id: unauthorizedOrg.id } })
  })

  it("should reject voided voucher", async () => {
    const code = "VOIDED-TEST-001"
    const codeHash = hashToken(code)
    await prisma.voucherInstance.create({
      data: {
        campaignId,
        orgId: buyerOrgId,
        code,
        codeHash,
        status: "voided",
        initialValueAmount: 5000,
        remainingValueAmount: 5000,
      },
    })

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    await expect(
      redeemVoucher({
        codeOrQr: code,
        partnerOrgId,
        amount: 1000,
        currency: "EUR",
        idempotencyKey: "voided-key-001",
      })
    ).rejects.toThrow("not active")
  })

  it("should reject currency mismatch", async () => {
    const voucher = await createTestVoucher("CURRENCY-TEST-001")

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    await expect(
      redeemVoucher({
        codeOrQr: "CURRENCY-TEST-001",
        partnerOrgId,
        amount: 1000,
        currency: "USD", // Campaign currency is EUR
        idempotencyKey: "currency-key-001",
      })
    ).rejects.toThrow("Currency mismatch")
  })

  it("should reject insufficient remaining value", async () => {
    const voucher = await createTestVoucher("INSUFF-TEST-001", 1000)

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    await expect(
      redeemVoucher({
        codeOrQr: "INSUFF-TEST-001",
        partnerOrgId,
        amount: 5000,
        currency: "EUR",
        idempotencyKey: "insuff-key-001",
      })
    ).rejects.toThrow("Insufficient remaining value")
  })
})

describe("B2B Voucher Validation", () => {
  it("should validate active voucher successfully", async () => {
    await createTestVoucher("VALID-TEST-001")

    const { validateVoucherCode } = await import("@/lib/b2b/vouchers")

    const result = await validateVoucherCode({
      codeOrQr: "VALID-TEST-001",
      partnerOrgId,
    })

    expect(result.valid).toBe(true)
    expect(result.valuePreview?.type).toBe("fixed")
    expect(result.valuePreview?.amount).toBe(5000)
  })

  it("should reject non-existent voucher code", async () => {
    const { validateVoucherCode } = await import("@/lib/b2b/vouchers")

    const result = await validateVoucherCode({
      codeOrQr: "DOES-NOT-EXIST",
      partnerOrgId,
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("not_found")
  })

  it("should reject voucher from unauthorized partner", async () => {
    await createTestVoucher("UNAUTH-VALID-001")

    const unauthorizedOrg = await prisma.organization.create({
      data: { name: "Unauthorized Validator", type: "partner", status: "active" },
    })

    const { validateVoucherCode } = await import("@/lib/b2b/vouchers")

    const result = await validateVoucherCode({
      codeOrQr: "UNAUTH-VALID-001",
      partnerOrgId: unauthorizedOrg.id,
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("partner_not_allowed")

    await prisma.organization.delete({ where: { id: unauthorizedOrg.id } })
  })
})

describe("B2B Audit Trail", () => {
  it("should record audit event on redemption", async () => {
    const voucher = await createTestVoucher("AUDIT-TEST-001")

    const { redeemVoucher } = await import("@/lib/b2b/vouchers")

    const result = await redeemVoucher({
      codeOrQr: "AUDIT-TEST-001",
      partnerOrgId,
      amount: 2000,
      currency: "EUR",
      idempotencyKey: "audit-key-001",
    })

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        orgId: buyerOrgId,
        entityId: result.redemption.id,
        entityType: "redemption",
        eventType: "redeem",
      },
    })

    expect(auditEvents.length).toBe(1)
    expect(auditEvents[0].actorType).toBe("partner_api")
  })
})
