/**
 * VAT Service
 *
 * Business logic for VAT calculation and exemption handling.
 */

import { getTenantContext, hasPermission } from '@/lib/async-context';
import { auditFromContext } from '@/modules/core/audit-service';
import { ForbiddenError, InvalidOperationError, NotFoundError } from '@/modules/core/errors';
import { VatExemptionType, VatRepository } from '@/modules/vat/repository';

export interface VatCalculationInput {
  countryCode: string;
  amountNet?: number;
  amountGross?: number;
  exemptionType?: VatExemptionType;
}

export interface VatCalculationResult {
  countryCode: string;
  rate: number;
  exempted: boolean;
  exemptionType?: VatExemptionType;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export class VatService {
  private repository: VatRepository;

  constructor(repository?: VatRepository) {
    this.repository = repository || new VatRepository();
  }

  async getApplicableRate(countryCode: string, exemptionType?: VatExemptionType) {
    const normalizedCountryCode = countryCode.toUpperCase();

    if (exemptionType) {
      const exemption = await this.repository.findActiveExemption(
        normalizedCountryCode,
        exemptionType
      );

      if (exemption) {
        return {
          countryCode: normalizedCountryCode,
          rate: 0,
          exempted: true,
          exemptionType,
        };
      }
    }

    const rate = await this.repository.findApplicableStandardRate(normalizedCountryCode);
    if (!rate) {
      throw new NotFoundError(`No active VAT rate found for country ${normalizedCountryCode}`);
    }

    return {
      countryCode: normalizedCountryCode,
      rate: rate.rate,
      exempted: false,
    };
  }

  async calculateVat(input: VatCalculationInput): Promise<VatCalculationResult> {
    const hasNet = typeof input.amountNet === 'number';
    const hasGross = typeof input.amountGross === 'number';

    if (hasNet === hasGross) {
      throw new InvalidOperationError(
        'Provide exactly one of amountNet or amountGross for VAT calculation'
      );
    }

    const rateInfo = await this.getApplicableRate(input.countryCode, input.exemptionType);
    const rateDecimal = rateInfo.rate / 100;

    if (hasNet) {
      const netAmount = input.amountNet!;
      const vatAmount = Math.round(netAmount * rateDecimal);
      const grossAmount = netAmount + vatAmount;

      return {
        countryCode: rateInfo.countryCode,
        rate: rateInfo.rate,
        exempted: rateInfo.exempted,
        exemptionType: rateInfo.exemptionType,
        netAmount,
        vatAmount,
        grossAmount,
      };
    }

    const grossAmount = input.amountGross!;
    const netAmount = Math.round(grossAmount / (1 + rateDecimal));
    const vatAmount = grossAmount - netAmount;

    return {
      countryCode: rateInfo.countryCode,
      rate: rateInfo.rate,
      exempted: rateInfo.exempted,
      exemptionType: rateInfo.exemptionType,
      netAmount,
      vatAmount,
      grossAmount,
    };
  }

  async listCountryRates(countryCode: string) {
    return this.repository.listRatesForCountry(countryCode);
  }

  async grantExemption(input: {
    countryCode: string;
    exemptionType: VatExemptionType;
    documentReference?: string;
    expiresAt?: Date;
  }) {
    if (!hasPermission('update:settings')) {
      throw new ForbiddenError('No permission to manage VAT exemptions');
    }

    const context = getTenantContext();

    const exemption = await this.repository.upsertExemption({
      ...input,
      approvedBy: context.userId || 'system',
      approvedAt: new Date(),
    });

    await auditFromContext('vat:exemption_granted', {
      resourceType: 'vat_exemption',
      resourceId: exemption.id,
      reason: `${input.exemptionType} exemption for ${input.countryCode.toUpperCase()}`,
      complianceRelevant: true,
    });

    return exemption;
  }

  async revokeExemption(countryCode: string, exemptionType: VatExemptionType) {
    if (!hasPermission('update:settings')) {
      throw new ForbiddenError('No permission to manage VAT exemptions');
    }

    await this.repository.removeExemption(countryCode, exemptionType);

    await auditFromContext('vat:exemption_revoked', {
      resourceType: 'vat_exemption',
      reason: `${exemptionType} exemption revoked for ${countryCode.toUpperCase()}`,
      complianceRelevant: true,
    });
  }
}
