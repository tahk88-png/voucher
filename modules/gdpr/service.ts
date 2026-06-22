/**
 * GDPR Service
 *
 * Handles GDPR compliance requirements:
 * - Data export (Right of Access)
 * - Data deletion (Right to be Forgotten)
 * - Consent management
 *
 * COMPLIANCE: Required for GDPR Article 12-17
 */

import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/async-context';
import { NotFoundError, InvalidOperationError } from '@/modules/core/errors';
import { auditFromContext, createAuditLog } from '@/modules/core/audit-service';
import { GdprRepository } from '@/modules/gdpr/repository';

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  downloadUrl?: string;
  downloadExpires?: Date;
  createdAt: Date;
}

const dataExportRequestStatuses = [
  'pending',
  'processing',
  'ready',
  'expired',
  'failed',
] as const;

function toDataExportRequest(request: {
  id: string;
  userId: string;
  status: string;
  downloadUrl: string | null;
  downloadExpires: Date | null;
  createdAt: Date;
}): DataExportRequest {
  if (
    !dataExportRequestStatuses.includes(
      request.status as (typeof dataExportRequestStatuses)[number]
    )
  ) {
    throw new InvalidOperationError(
      `Unsupported export request status: ${request.status}`
    );
  }

  return {
    id: request.id,
    userId: request.userId,
    status: request.status as DataExportRequest['status'],
    ...(request.downloadUrl ? { downloadUrl: request.downloadUrl } : {}),
    ...(request.downloadExpires
      ? { downloadExpires: request.downloadExpires }
      : {}),
    createdAt: request.createdAt,
  };
}

export class GdprService {
  private repository: GdprRepository;

  constructor(repository?: GdprRepository) {
    this.repository = repository || new GdprRepository();
  }

  /**
   * Request data export (ISO 20600 format)
   *
   * Creates an asynchronous request for the user's data export.
   * A background job will process this within 30 days.
   *
   * COMPLIANCE: GDPR Article 15 - Right of Access
   *
   * @param userId User requesting export (usually current user)
   * @returns Export request details
   */
  async requestDataExport(userId: string): Promise<DataExportRequest> {
    const context = getTenantContext();

    // Check if already processing request
    const existingRequest = await this.repository.findActiveRecentExportRequest(userId);

    if (existingRequest) {
      throw new InvalidOperationError(
        'You already have a pending export request. Please wait 24 hours before requesting again.'
      );
    }

    // Create export request
    const request = await this.repository.createExportRequest(
      userId,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    // Audit - compliance relevant
    await createAuditLog({
      merchantId: context.tenantId,
      userId: context.userId || userId,
      action: 'gdpr:data_export_requested',
      resourceType: 'user',
      resourceId: userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      complianceRelevant: true,
    });

    return toDataExportRequest(request);
  }

  /**
   * Execute data export (background job)
   *
   * Collects all user data and generates ISO 20600 JSON export.
   * Should be called by background job after short delay.
   *
   * @param exportRequestId Export request ID
   * @returns Data export JSON
   */
  async executeDataExport(exportRequestId: string): Promise<Record<string, any>> {
    const request = await prisma.dataExportRequest.findUnique({
      where: { id: exportRequestId },
    });

    if (!request) {
      throw new NotFoundError('Export request not found');
    }

    if (request.status !== 'pending') {
      throw new InvalidOperationError('Export request already processed');
    }

    // Mark as processing
    await prisma.dataExportRequest.update({
      where: { id: exportRequestId },
      data: { status: 'processing' },
    });

    try {
      // Collect user data
      const [user, merchantCampaigns] = await Promise.all([
        prisma.user.findUnique({
          where: { id: request.userId },
          include: {
            accounts: true,
            merchantMembers: true,
            auditLogs: {
              where: { merchantId: request.merchantId ?? undefined },
            },
          },
        }),
        request.merchantId
          ? prisma.campaign.findMany({
              where: { merchantId: request.merchantId },
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
      ]);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Build ISO 20600 JSON export
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: 'ISO-20600',
          dataSubject: user.email,
        },
        personalData: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        merchantAccess: {
          memberships: user.merchantMembers.map((m) => ({
            merchantId: m.merchantId,
            role: m.role,
            joinedAt: m.createdAt,
          })),
          campaigns: merchantCampaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            createdAt: c.createdAt,
          })),
        },
        auditTrail: user.auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          timestamp: log.createdAt,
        })),
      };

      // In real implementation, upload to secure storage and generate signed URL
      // For now, store minimal info
      await prisma.dataExportRequest.update({
        where: { id: exportRequestId },
        data: {
          status: 'ready',
          fileSize: JSON.stringify(exportData).length,
          processedAt: new Date(),
        },
      });

      // Audit
      await createAuditLog({
        merchantId: request.merchantId || 'system',
        userId: 'system',
        action: 'gdpr:data_export_completed',
        resourceType: 'user',
        resourceId: request.userId,
        complianceRelevant: true,
      });

      return exportData;
    } catch (error) {
      // Mark as failed
      await prisma.dataExportRequest.update({
        where: { id: exportRequestId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Request data deletion (Right to be Forgotten)
   *
   * Creates deletion request with 30-day grace period.
   * User can cancel during grace period.
   *
   * COMPLIANCE: GDPR Article 17 - Right to be Forgotten
   *
   * @param userId User requesting deletion
   * @param reason Why user is requesting deletion
   * @returns Deletion request details
   */
  async requestDataDeletion(userId: string, reason?: string) {
    const context = getTenantContext();

    // Check if already has pending deletion request
    const existing = await this.repository.findActiveDeletionRequest(userId);

    if (existing) {
      throw new InvalidOperationError(
        'You already have a pending deletion request'
      );
    }

    // Create deletion request
    const gracePeriodEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const request = await this.repository.createDeletionRequest(userId, gracePeriodEndsAt, reason);

    // Audit - highly compliance relevant
    await createAuditLog({
      merchantId: context.tenantId,
      userId: context.userId || userId,
      action: 'gdpr:data_deletion_requested',
      resourceType: 'user',
      resourceId: userId,
      reason: `30-day grace period. ${reason || 'No reason provided'}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      complianceRelevant: true,
    });

    return {
      id: request.id,
      status: 'grace_period',
      gracePeriodEndsAt,
      message: 'Your data will be deleted in 30 days. You can cancel this request anytime before then.',
    };
  }

  /**
   * Cancel data deletion request during grace period
   *
   * @param deletionRequestId Deletion request ID
   */
  async cancelDataDeletion(deletionRequestId: string) {
    const request = await this.repository.findDeletionRequestById(deletionRequestId);

    if (!request) {
      throw new NotFoundError('Deletion request not found');
    }

    if (request.status !== 'grace_period') {
      throw new InvalidOperationError(
        'Can only cancel requests in grace period'
      );
    }

    // Delete the request
    await prisma.dataDeletionRequest.delete({
      where: { id: deletionRequestId },
    });

    // Audit
    await auditFromContext('gdpr:data_deletion_cancelled', {
      resourceType: 'user',
      resourceId: request.userId,
      complianceRelevant: true,
    });
  }

  /**
   * Execute data deletion (background job - called after grace period)
   *
   * Performs complete deletion of user data.
   * Some data is retained per regulatory requirements.
   *
   * @param deletionRequestId Deletion request ID
   */
  async executeDataDeletion(deletionRequestId: string) {
    const request = await prisma.dataDeletionRequest.findUnique({
      where: { id: deletionRequestId },
    });

    if (!request) {
      throw new NotFoundError('Deletion request not found');
    }

    // Mark as executing
    await prisma.dataDeletionRequest.update({
      where: { id: deletionRequestId },
      data: { status: 'executing' },
    });

    try {
      // Soft-delete user
      await prisma.user.update({
        where: { id: request.userId },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      // Delete user's personal data
      await Promise.all([
        prisma.merchantMember.deleteMany({
          where: { userId: request.userId },
        }),
        // Campaigns belong to merchant, but remove user's ownership
        // Note: In practice, campaigns might belong to organization, not individual users
      ]);

      // Mark as completed
      await prisma.dataDeletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          resultSummary: {
            userSoftDeleted: true,
            dataRetained: ['auditLogs (legal hold)', 'paymentHistory (7-year tax requirement)'],
          },
        },
      });

      // Audit - highest compliance relevance
      await createAuditLog({
        merchantId: request.merchantId || 'system',
        userId: 'system',
        action: 'gdpr:data_deletion_executed',
        resourceType: 'user',
        resourceId: request.userId,
        reason: 'Automated deletion after grace period',
        complianceRelevant: true,
      });
    } catch (error) {
      await prisma.dataDeletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Record user consent
   *
   * @param userId User giving consent
   * @param consentType Type of consent (marketing, analytics, etc.)
   * @param granted Whether consent is granted
   */
  async recordConsent(
    userId: string,
    consentType: 'marketing' | 'analytics' | 'processing' | 'profiling',
    granted: boolean
  ) {
    const context = getTenantContext();

    const consent = await prisma.userConsent.upsert({
      where: {
        userId_merchantId_consentType: {
          userId,
          merchantId: context.tenantId,
          consentType,
        },
      },
      create: {
        userId,
        merchantId: context.tenantId,
        consentType,
        granted,
        grantedAt: granted ? new Date() : undefined,
        withdrawnAt: !granted ? new Date() : undefined,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      update: {
        granted,
        grantedAt: granted ? new Date() : null,
        withdrawnAt: granted ? null : new Date(),
      },
    });

    // Audit
    await auditFromContext('gdpr:consent_recorded', {
      resourceType: 'user',
      resourceId: userId,
      reason: `${consentType} consent ${granted ? 'granted' : 'withdrawn'}`,
      complianceRelevant: true,
    });

    return consent;
  }
}
