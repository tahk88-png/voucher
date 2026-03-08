/**
 * Merchant Service
 *
 * Business logic for merchant operations.
 * This service owns all merchant-related rules and workflows.
 *
 * Services are responsible for:
 * - Business rule validation
 * - Entitlement checks
 * - Audit logging
 * - Coordinating multiple repositories
 *
 * Services DO NOT handle HTTP concerns (status codes, response formats).
 * API routes handle that layer.
 */

import { MerchantRepository } from '@/modules/merchant/repository';
import { auditFromContext, createAuditLog } from '@/modules/core/audit-service';
import { getTenantContext, hasPermission } from '@/lib/async-context';
import { ForbiddenError, InvalidOperationError } from '@/modules/core/errors';
import { prisma } from '@/lib/prisma';

export class MerchantService {
  private repository: MerchantRepository;

  constructor(repository?: MerchantRepository) {
    this.repository = repository || new MerchantRepository();
  }

  /**
   * Get current merchant profile
   *
   * @returns Merchant details with stats
   */
  async getMerchantProfile() {
    const merchant = await this.repository.getCurrentMerchant();
    const stats = await this.repository.getUsageStats();

    return {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
      country: merchant.country,
      defaultCurrency: merchant.defaultCurrency,
      defaultLocale: merchant.defaultLocale,
      supportEmail: merchant.supportEmail,
      website: merchant.website,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
      stats,
      subscription: merchant.subscription,
    };
  }

  /**
   * Update merchant settings
   *
   * @param updates Settings to update
   * @returns Updated merchant profile
   */
  async updateSettings(updates: {
    name?: string;
    country?: string;
    supportEmail?: string;
    website?: string;
    brandLogoUrl?: string;
  }) {
    // Verify permission
    if (!hasPermission('update:settings')) {
      throw new ForbiddenError('No permission to update merchant settings');
    }

    const context = getTenantContext();

    // Record before state for audit
    const merchBefore = await this.repository.getCurrentMerchant();

    // Apply updates
    const merchant = await this.repository.update(updates);

    // Audit log
    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.userId || 'system',
      action: 'merchant:settings_updated',
      resourceType: 'merchant',
      resourceId: merchant.id,
      changes: {
        before: merchBefore,
        after: merchant,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      complianceRelevant: true,
    });

    return merchant;
  }

  /**
   * Get team members for this merchant
   *
   * @returns List of members with roles
   */
  async getTeamMembers() {
    const tenantId = getTenantContext().tenantId;

    const members = await prisma.merchantMember.findMany({
      where: { merchantId: tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Invite user to merchant team
   *
   * @param email User email
   * @param role Role to assign
   */
  async inviteTeamMember(email: string, role: 'merchant_admin' | 'merchant_staff') {
    // Permission check
    if (!hasPermission('invite:users')) {
      throw new ForbiddenError('No permission to invite users');
    }

    const context = getTenantContext();
    const tenantId = context.tenantId;

    // Check if user already member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.merchantMember.findUnique({
        where: {
          merchantId_userId: {
            merchantId: tenantId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        throw new InvalidOperationError('User is already a member of this merchant');
      }
    }

    // Audit log
    await auditFromContext('merchant:user_invited', {
      reason: `Invited ${email} as ${role}`,
      complianceRelevant: false,
    });

    // In real implementation, send email invitation
    return {
      email,
      role,
      status: 'invited',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  /**
   * Remove user from merchant team
   *
   * @param userId User to remove
   */
  async removeTeamMember(userId: string) {
    if (!hasPermission('remove:users')) {
      throw new ForbiddenError('No permission to remove users');
    }

    const context = getTenantContext();
    const tenantId = context.tenantId;

    // Can't remove yourself
    if (userId === context.userId) {
      throw new InvalidOperationError('Cannot remove yourself from the team');
    }

    // Delete membership
    await prisma.merchantMember.delete({
      where: {
        merchantId_userId: {
          merchantId: tenantId,
          userId,
        },
      },
    });

    // Audit log
    await auditFromContext('merchant:user_removed', {
      reason: `Removed user ${userId}`,
      complianceRelevant: false,
    });
  }

  /**
   * Check if merchant can create more resources (against plan limits)
   *
   * @param resourceType Type of resource (campaign, voucher, etc.)
   * @returns Boolean
   */
  async canCreateResource(resourceType: 'campaign' | 'voucher' | 'user'): Promise<boolean> {
    const merchant = await this.repository.getCurrentMerchant();

    // Free tier limits
    if (!merchant.subscription || merchant.subscription.status !== 'active') {
      const stats = await this.repository.getUsageStats();

      switch (resourceType) {
        case 'campaign':
          return stats.campaigns < 3; // Free: 3 campaigns
        case 'voucher':
          return stats.vouchers < 100; // Free: 100 vouchers
        case 'user':
          return stats.users < 3; // Free: 3 team members
        default:
          return true;
      }
    }

    // Paid tier: no limits for now
    return true;
  }
}
