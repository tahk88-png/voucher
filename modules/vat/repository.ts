/**
 * VAT Repository
 *
 * Data access for VAT rates and merchant exemptions.
 * SECURITY: Merchant-scoped operations are always tenant-bound.
 */

import { BaseRepository } from '@/modules/core/base-repository';

export type VatExemptionType = 'b2b' | 'export' | 'charity' | 'public_body';

export class VatRepository extends BaseRepository {
  async findApplicableStandardRate(countryCode: string, at: Date = new Date()) {
    return this.prisma.vatRate.findFirst({
      where: {
        countryCode: countryCode.toUpperCase(),
        rateType: 'standard',
        isActive: true,
        effectiveFrom: { lte: at },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: at } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async listRatesForCountry(countryCode: string, at: Date = new Date()) {
    return this.prisma.vatRate.findMany({
      where: {
        countryCode: countryCode.toUpperCase(),
        isActive: true,
        effectiveFrom: { lte: at },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: at } }],
      },
      orderBy: [{ rateType: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async findActiveExemption(
    countryCode: string,
    exemptionType?: VatExemptionType,
    at: Date = new Date()
  ) {
    const tenantId = this.requireTenantId();

    return this.prisma.vatExemption.findFirst({
      where: {
        merchantId: tenantId,
        countryCode: countryCode.toUpperCase(),
        ...(exemptionType ? { exemptionType } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gte: at } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertExemption(input: {
    countryCode: string;
    exemptionType: VatExemptionType;
    documentReference?: string;
    approvedBy?: string;
    approvedAt?: Date;
    expiresAt?: Date;
  }) {
    const tenantId = this.requireTenantId();

    return this.prisma.vatExemption.upsert({
      where: {
        merchantId_countryCode_exemptionType: {
          merchantId: tenantId,
          countryCode: input.countryCode.toUpperCase(),
          exemptionType: input.exemptionType,
        },
      },
      create: {
        merchantId: tenantId,
        countryCode: input.countryCode.toUpperCase(),
        exemptionType: input.exemptionType,
        documentReference: input.documentReference,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt,
        expiresAt: input.expiresAt,
      },
      update: {
        documentReference: input.documentReference,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt,
        expiresAt: input.expiresAt,
      },
    });
  }

  async removeExemption(countryCode: string, exemptionType: VatExemptionType) {
    const tenantId = this.requireTenantId();

    await this.prisma.vatExemption.deleteMany({
      where: {
        merchantId: tenantId,
        countryCode: countryCode.toUpperCase(),
        exemptionType,
      },
    });
  }
}
