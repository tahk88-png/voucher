/**
 * GDPR Repository
 *
 * Data access layer for GDPR compliance operations.
 * Handles queries for data export/deletion requests.
 *
 * SECURITY: All queries scoped to tenantId (merchant isolation)
 */

import {
  BaseRepository,
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
  getPaginationSkipTake,
} from '@/modules/core/base-repository';

export class GdprRepository extends BaseRepository {
  /**
   * Find data export request by ID
   * Only returns if owned by current tenant
   *
   * @param id Export request ID
   * @returns Export request or null
   */
  async findExportRequestById(id: string) {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id },
    });

    return this.validateTenantOwnership(request, 'merchantId');
  }

  async findActiveRecentExportRequest(userId: string, withinMs = 24 * 60 * 60 * 1000) {
    const tenantId = this.requireTenantId();

    return this.prisma.dataExportRequest.findFirst({
      where: {
        userId,
        merchantId: tenantId,
        status: { in: ['pending', 'processing'] },
        createdAt: {
          gte: new Date(Date.now() - withinMs),
        },
      },
    });
  }

  async createExportRequest(userId: string, expiresAt: Date) {
    const tenantId = this.requireTenantId();

    return this.prisma.dataExportRequest.create({
      data: {
        userId,
        merchantId: tenantId,
        status: 'pending',
        expiresAt,
      },
    });
  }

  /**
   * Find all export requests for a user (paginated)
   *
   * @param userId User ID
   * @param pagination Pagination params
   */
  async listExportRequests(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const tenantId = this.requireTenantId();
    const { skip, take, page, limit } = getPaginationSkipTake(pagination);

    const [items, total] = await Promise.all([
      this.prisma.dataExportRequest.findMany({
        where: {
          userId,
          merchantId: tenantId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.dataExportRequest.count({
        where: {
          userId,
          merchantId: tenantId,
        },
      }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  /**
   * Find data deletion request by ID
   * Only returns if owned by current tenant
   *
   * @param id Deletion request ID
   * @returns Deletion request or null
   */
  async findDeletionRequestById(id: string) {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: { id },
    });

    return this.validateTenantOwnership(request, 'merchantId');
  }

  async findActiveDeletionRequest(userId: string) {
    const tenantId = this.requireTenantId();

    return this.prisma.dataDeletionRequest.findFirst({
      where: {
        userId,
        merchantId: tenantId,
        status: { in: ['pending', 'grace_period'] },
      },
    });
  }

  async createDeletionRequest(userId: string, gracePeriodEndsAt: Date, reason?: string) {
    const tenantId = this.requireTenantId();

    return this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        merchantId: tenantId,
        status: 'grace_period',
        reason,
        gracePeriodEndsAt,
      },
    });
  }

  /**
   * Find all deletion requests for a user (paginated)
   *
   * @param userId User ID
   * @param pagination Pagination params
   */
  async listDeletionRequests(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const tenantId = this.requireTenantId();
    const { skip, take, page, limit } = getPaginationSkipTake(pagination);

    const [items, total] = await Promise.all([
      this.prisma.dataDeletionRequest.findMany({
        where: {
          userId,
          merchantId: tenantId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.dataDeletionRequest.count({
        where: {
          userId,
          merchantId: tenantId,
        },
      }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  /**
   * Find pending deletion requests (grace period active)
   * Used for cleanup tasks
   *
   * @returns All pending deletion requests across all tenants (system-level)
   */
  async findPendingDeletionRequests() {
    return this.prisma.dataDeletionRequest.findMany({
      where: {
        status: { in: ['grace_period', 'executing'] },
        gracePeriodEndsAt: {
          lte: new Date(),
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find pending export requests (processing)
   * Used for background job
   *
   * @returns All pending export requests across all tenants (system-level)
   */
  async findPendingExportRequests() {
    return this.prisma.dataExportRequest.findMany({
      where: {
        status: { in: ['pending', 'processing'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 10, // Process in batches
    });
  }

  /**
   * Find user consents
   * Only returns if owned by current tenant
   *
   * @param userId User ID
   * @returns User's consents
   */
  async findUserConsents(userId: string) {
    const tenantId = this.requireTenantId();

    return this.prisma.userConsent.findMany({
      where: {
        userId,
        merchantId: tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get export requests expiring soon (cleanup)
   * @returns Records expiring in next 7 days
   */
  async findExpiringExportRequests() {
    const soonEventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.dataExportRequest.findMany({
      where: {
        status: 'ready',
        downloadExpires: {
          lte: soonEventDate,
          gte: new Date(),
        },
      },
      orderBy: { downloadExpires: 'asc' },
    });
  }

  /**
   * Check if user has active deletion request in grace period
   *
   * @param userId User ID
   * @returns True if deletion is pending
   */
  async hasActiveDeletionRequest(userId: string): Promise<boolean> {
    const tenantId = this.requireTenantId();

    const count = await this.prisma.dataDeletionRequest.count({
      where: {
        userId,
        merchantId: tenantId,
        status: { in: ['grace_period', 'executing'] },
      },
    });

    return count > 0;
  }

  /**
   * Get user's audit logs for export (subject access request)
   *
   * @param userId User ID
   * @param limit Max records
   */
  async getUserAuditLogs(userId: string, limit: number = 1000) {
    const tenantId = this.requireTenantId();

    return this.prisma.auditLog.findMany({
      where: {
        merchantId: tenantId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        createdAt: true,
        ipAddress: true,
        resourceType: true,
        resourceId: true,
      },
    });
  }

  /**
   * Count user's data volume for export stats
   *
   * @param userId User ID
   */
  async estimateUserDataVolume(userId: string) {
    const tenantId = this.requireTenantId();

    const [auditLogs, membershipCount, consentCount] = await Promise.all([
      this.prisma.auditLog.count({
        where: { userId, merchantId: tenantId },
      }),
      this.prisma.merchantMember.count({
        where: { userId },
      }),
      this.prisma.userConsent.count({
        where: { userId, merchantId: tenantId },
      }),
    ]);

    return {
      auditLogEntries: auditLogs,
      merchantMemberships: membershipCount,
      consentRecords: consentCount,
    };
  }
}
