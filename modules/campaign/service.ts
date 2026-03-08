/**
 * Campaign Service
 *
 * Business logic for campaign management.
 */

import { CampaignRepository, CreateCampaignInput } from '@/modules/campaign/repository';
import { auditFromContext } from '@/modules/core/audit-service';
import { getTenantContext, hasPermission } from '@/lib/async-context';
import { ForbiddenError, InvalidOperationError, NotFoundError } from '@/modules/core/errors';
import { MerchantService } from '@/modules/merchant/service';
import { PaginationParams } from '@/modules/core/base-repository';

export class CampaignService {
  private repository: CampaignRepository;
  private merchantService: MerchantService;

  constructor(
    repository?: CampaignRepository,
    merchantService?: MerchantService
  ) {
    this.repository = repository || new CampaignRepository();
    this.merchantService = merchantService || new MerchantService();
  }

  /**
   * Create campaign
   *
   * @param input Campaign data
   * @returns Created campaign
   */
  async createCampaign(input: CreateCampaignInput) {
    // Permission check
    if (!hasPermission('create:campaigns')) {
      throw new ForbiddenError('No permission to create campaigns');
    }

    // Entitlement check
    const canCreate = await this.merchantService.canCreateResource('campaign');
    if (!canCreate) {
      throw new Error('Campaign limit reached for your plan. Upgrade to create more.');
    }

    // Validation
    if (input.startDate >= input.endDate) {
      throw new InvalidOperationError('Campaign end date must be after start date');
    }

    const context = getTenantContext();

    // Create
    const campaign = await this.repository.create(input);

    // Audit  
    await auditFromContext('campaign:created', {
      resourceType: 'campaign',
      resourceId: campaign.id,
      complianceRelevant: false,
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   *
   * @param id Campaign ID
   * @returns Campaign or throws NotFoundError
   */
  async getCampaign(id: string) {
    const campaign = await this.repository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Get stats
    const stats = await this.repository.getStats(id);

    return {
      ...campaign,
      stats,
    };
  }

  /**
   * List campaigns with pagination
   *
   * @param pagination Pagination params
   * @returns Paginated campaigns
   */
  async listCampaigns(pagination: PaginationParams) {
    // Permission check
    if (!hasPermission('read:campaigns')) {
      throw new ForbiddenError('No permission to view campaigns');
    }

    return this.repository.listPaginated(pagination);
  }

  /**
   * Update campaign
   *
   * @param id Campaign ID
   * @param updates Updates to apply
   * @returns Updated campaign
   */
  async updateCampaign(
    id: string,
    updates: {
      name?: string;
      description?: string;
      maxRedemptions?: number;
      maxPurchases?: number;
    }
  ) {
    if (!hasPermission('update:campaigns')) {
      throw new ForbiddenError('No permission to update campaigns');
    }

    const campaign = await this.repository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const updated = await this.repository.update(id, updates);

    // Audit
    await auditFromContext('campaign:updated', {
      resourceType: 'campaign',
      resourceId: id,
      changes: {
        before: campaign,
        after: updated,
      },
      complianceRelevant: false,
    });

    return updated;
  }

  /**
   * Delete campaign
   *
   * @param id Campaign ID
   */
  async deleteCampaign(id: string) {
    if (!hasPermission('delete:vouchers')) {
      throw new ForbiddenError('No permission to delete campaigns');
    }

    const campaign = await this.repository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    await this.repository.delete(id);

    // Audit
    await auditFromContext('campaign:deleted', {
      resourceType: 'campaign',
      resourceId: id,
      reason: 'Campaign deleted',
      complianceRelevant: false,
    });
  }

  /**
   * Get campaign statistics
   *
   * @param id Campaign ID
   * @returns Stats
   */
  async getCampaignStats(id: string) {
    const campaign = await this.repository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    return this.repository.getStats(id);
  }
}
