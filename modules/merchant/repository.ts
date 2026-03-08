/**
 * Merchant Repository
 *
 * Handles all database operations for merchants with tenant scoping.
 * EVERY query includes WHERE merchantId = tenantId defensive check.
 */

import { BaseRepository } from '@/modules/core/base-repository';
import { NotFoundError } from '@/modules/core/errors';

export interface CreateMerchantInput {
  name: string;
  slug: string;
  country: string;
  registryCode?: string;
  vatNumber?: string;
  defaultCurrency?: string;
}

export interface UpdateMerchantInput {
  name?: string;
  country?: string;
  brandLogoUrl?: string;
  supportEmail?: string;
  featureFlags?: Record<string, any>;
}

export class MerchantRepository extends BaseRepository {
  /**
   * Find merchant by ID (with tenant scoping)
   *
   * @param id Merchant ID
   * @returns Merchant or null
   */
  async findById(id: string) {
    const tenantId = this.requireTenantId();

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });

    // Defensive: Verify merchant belongs to current tenant
    // In single-tenant context, this is semantic but good for safety
    return this.validateTenantOwnership(merchant);
  }

  /**
   * Get current tenant's merchant details
   *
   * @returns Current merchant or throws NotFoundError
   */
  async getCurrentMerchant() {
    const id = this.requireTenantId();

    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        subscription: true,
      },
    });

    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    return merchant;
  }

  /**
   * Update merchant settings
   *
   * @param input Updates to apply
   * @returns Updated merchant
   */
  async update(input: UpdateMerchantInput) {
    const tenantId = this.requireTenantId();

    const merchant = await this.prisma.merchant.update({
      where: { id: tenantId },
      data: input,
    });

    return merchant;
  }

  /**
   * Check if merchant is active
   *
   * @returns Boolean
   */
  async isActive(): Promise<boolean> {
    const tenantId = this.requireTenantId();

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: tenantId },
      select: { isActive: true },
    });

    return merchant?.isActive ?? false;
  }

  /**
   * Get merchant's current usage/entitlements
   *
   * @returns Usage stats
   */
  async getUsageStats() {
    const tenantId = this.requireTenantId();

    const [campaignCount, voucherCount, userCount] = await Promise.all([
      this.prisma.campaign.count({ where: { merchantId: tenantId } }),
      this.prisma.voucher.count({ where: { merchantId: tenantId } }),
      this.prisma.user.count({
        where: {
          merchantMembers: {
            some: { merchantId: tenantId },
          },
        },
      }),
    ]);

    return {
      campaigns: campaignCount,
      vouchers: voucherCount,
      users: userCount,
    };
  }
}
