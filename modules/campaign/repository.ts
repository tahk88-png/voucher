/**
 * Campaign Repository
 *
 * CRITICAL: All queries scoped by tenantId (merchantId in this case)
 */

import {
  BaseRepository,
  getPaginationSkipTake,
  buildPaginatedResult,
  PaginationParams,
} from '@/modules/core/base-repository';
import { NotFoundError } from '@/modules/core/errors';

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: 'weekly' | 'limited';
  startDate: Date;
  endDate: Date;
  price?: number;
  maxRedemptions?: number;
  maxPurchases?: number;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxRedemptions?: number;
  maxPurchases?: number;
}

export class CampaignRepository extends BaseRepository {
  /**
   * Create campaign for current merchant
   *
   * @param input Campaign data
   * @returns Created campaign
   */
  async create(input: CreateCampaignInput) {
    const tenantId = this.requireTenantId();

    const campaign = await this.prisma.campaign.create({
      data: {
        ...input,
        merchantId: tenantId, // ← MANDATORY: Attach to current tenant
      },
    });

    return campaign;
  }

  /**
   * Find campaign by ID (tenant-scoped)
   *
   * @param id Campaign ID
   * @returns Campaign or null
   */
  async findById(id: string) {
    const tenantId = this.requireTenantId();

    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    // Defensive: Verify belongs to current tenant
    return this.validateTenantOwnership(campaign);
  }

  /**
   * List campaigns for current merchant (with pagination)
   *
   * @param pagination Pagination params
   * @returns Paginated campaigns
   */
  async listPaginated(pagination: PaginationParams) {
    const tenantId = this.requireTenantId();
    const { skip, take, page, limit } = getPaginationSkipTake(pagination);

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { merchantId: tenantId }, // ← Scoped to tenant
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.count({
        where: { merchantId: tenantId },
      }),
    ]);

    return buildPaginatedResult(campaigns, total, page, limit);
  }

  /**
   * Update campaign
   *
   * @param id Campaign ID
   * @param input Updates
   * @returns Updated campaign
   */
  async update(id: string, input: UpdateCampaignInput) {
    const tenantId = this.requireTenantId();

    // Verify ownership
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: input,
    });

    return updated;
  }

  /**
   * Delete campaign
   *
   * @param id Campaign ID
   */
  async delete(id: string) {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    await this.prisma.campaign.delete({
      where: { id },
    });
  }

  /**
   * Get campaign statistics
   *
   * @param id Campaign ID
   * @returns Campaign stats
   */
  async getStats(id: string) {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const [voucherCount, redeemCount] = await Promise.all([
      this.prisma.voucher.count({
        where: { campaignId: id },
      }),
      this.prisma.voucher.count({
        where: {
          campaignId: id,
          status: 'redeemed',
        },
      }),
    ]);

    return {
      totalVouchers: voucherCount,
      redeemedVouchers: redeemCount,
      redeemRate: voucherCount > 0 ? (redeemCount / voucherCount) * 100 : 0,
    };
  }
}
