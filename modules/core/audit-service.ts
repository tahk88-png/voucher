/**
 * Audit Service: Hash-Chain Tamper Detection
 *
 * Implements immutable audit logging with SHA256 hash chain.
 * Each audit log entry includes:
 * - hashSelf: SHA256(all fields + previous hash)
 * - hashPrev: SHA256 of previous entry
 *
 * This creates a chain where tampering with any entry is immediately detectable
 * because all subsequent hashes would be invalid.
 *
 * COMPLIANCE: Required for regulatory audit trails (SOC 2, ISO 27001, GDPR).
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getTenantContext, getTenantContextOrUndefined } from '@/lib/async-context';

const GENESIS_HASH = '0'.repeat(64); // All-zeros hash for first entry

/**
 * Audit log payload (what gets hashed)
 */
export interface AuditLogPayload {
  merchantId: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  dataClassification?: string;
  complianceRelevant?: boolean;
}

/**
 * Stored audit log entry (with hash chain)
 */
export interface AuditLogEntry {
  id: string;
  merchantId: string | null;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  dataClassification: string | null;
  complianceRelevant: boolean;
  hashSelf: string | null;
  hashPrev: string | null;
  deleted: boolean;
  createdAt: Date;
}

/**
 * Calculate SHA256 hash of input data
 *
 * @param data Object to hash
 * @returns Hex-encoded SHA256 hash
 */
function sha256(data: unknown): string {
  const jsonStr = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

/**
 * Create audit log entry with hash chain
 *
 * CRITICAL: Call this for every mutation (create, update, delete).
 *
 * @param payload Audit event details
 * @returns Created audit log entry
 * @throws Error if database operations fail
 */
export async function createAuditLog(
  payload: AuditLogPayload
): Promise<AuditLogEntry> {
  // Get previous entry to link hash chain
  const previousEntry = await prisma.auditLog.findFirst({
    where: {
      merchantId: payload.merchantId,
      deleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      hashSelf: true,
    },
  });

  const hashPrev = previousEntry?.hashSelf ?? GENESIS_HASH;

  // Build hashable object (all fields in deterministic order)
  const hashableData = {
    merchantId: payload.merchantId,
    userId: payload.userId,
    action: payload.action,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    changes: payload.changes,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    reason: payload.reason,
    dataClassification: payload.dataClassification || 'standard',
    complianceRelevant: payload.complianceRelevant || false,
    hashPrev, // Include previous hash in this hash
  };

  // Calculate hashes
  const hashSelf = sha256(hashableData);

  // Persist to database
  const entry = await prisma.auditLog.create({
    data: {
      merchantId: payload.merchantId,
      actorUserId: payload.userId,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      changes: payload.changes,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      reason: payload.reason,
      dataClassification: payload.dataClassification || 'standard',
      complianceRelevant: payload.complianceRelevant || false,
      hashSelf,
      hashPrev,
    },
  });

  return {
    id: entry.id,
    merchantId: entry.merchantId ?? null,
    userId: entry.actorUserId,
    action: entry.action,
    resourceType: entry.resourceType || undefined,
    resourceId: entry.resourceId || undefined,
    changes: (entry.changes as Record<string, any>) || undefined,
    ipAddress: entry.ipAddress || undefined,
    userAgent: entry.userAgent || undefined,
    reason: entry.reason || undefined,
    dataClassification: entry.dataClassification ?? null,
    complianceRelevant: entry.complianceRelevant,
    hashSelf: entry.hashSelf ?? null,
    hashPrev: entry.hashPrev ?? null,
    deleted: entry.deleted,
    createdAt: entry.createdAt,
  };
}

/**
 * Verify audit log chain integrity
 *
 * Replays all audit logs and verifies each hash matches.
 * If any entry has been tampered with, this will detect it.
 *
 * COMPLIANCE: Run periodically or on-demand to prove audit immutability.
 *
 * @param merchantId Tenant to verify
 * @returns Array of any corrupt entries (empty if valid)
 */
export async function verifyAuditChain(merchantId: string): Promise<
  Array<{
    id: string;
    expected: string;
    actual: string;
  }>
> {
  const corrupEntries: Array<{ id: string; expected: string; actual: string }> = [];

  // Fetch all audit logs in order
  const entries = await prisma.auditLog.findMany({
    where: {
      merchantId,
      deleted: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let expectedHashPrev = GENESIS_HASH;

  for (const entry of entries) {
    const entryHashPrev = entry.hashPrev ?? GENESIS_HASH;
    const entryHashSelf = entry.hashSelf ?? '';

    // Verify hash chain link
    if (entryHashPrev !== expectedHashPrev) {
      corrupEntries.push({
        id: entry.id,
        expected: expectedHashPrev,
        actual: entryHashPrev,
      });
    }

    // Recalculate own hash
    const hashableData = {
      merchantId: entry.merchantId,
      userId: entry.actorUserId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      reason: entry.reason,
      dataClassification: entry.dataClassification,
      complianceRelevant: entry.complianceRelevant,
      hashPrev: entryHashPrev,
    };

    const calculatedHash = sha256(hashableData);
    if (calculatedHash !== entryHashSelf) {
      corrupEntries.push({
        id: entry.id,
        expected: calculatedHash,
        actual: entryHashSelf,
      });
    }

    // Update expected hash for next iteration
    expectedHashPrev = entryHashSelf;
  }

  return corrupEntries;
}

/**
 * Soft-delete audit log entry
 *
 * Marks entry as deleted without removing it (maintains chain integrity).
 * Deleted entries are excluded from normal queries.
 *
 * NOTE: This should only be used for GDPR deletions or legal holds.
 * Audit trails should generally be immutable.
 *
 * @param entryId ID of entry to delete
 */
export async function softDeleteAuditLog(entryId: string): Promise<void> {
  await prisma.auditLog.update({
    where: { id: entryId },
    data: { deleted: true },
  });
}

/**
 * Audit decorator for services
 *
 * Usage:
 * ```typescript
 * @audit({
 *   action: 'campaign:create',
 *   resourceType: 'campaign',
 *   complianceRelevant: false,
 * })
 * async create(input: CreateInput) {
 *   // Code here
 * }
 * ```
 *
 * Note: TypeScript decorators are experimental.
 * Consider using a middleware/wrapper approach instead.
 */
export function audit(config: {
  action: string;
  resourceType?: string;
  complianceRelevant?: boolean;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Try to get tenant context
        const context = getTenantContextOrUndefined();
        if (context) {
          // Call original method
          const result = await originalMethod.apply(this, args);

          // Log after successful execution
          await createAuditLog({
            merchantId: context.tenantId,
            userId: context.userId || 'system',
            action: config.action,
            resourceType: config.resourceType,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            complianceRelevant: config.complianceRelevant,
          });

          return result;
        } else {
          // No context, just call original
          return await originalMethod.apply(this, args);
        }
      } catch (error) {
        // Log failure for sensitive operations
        const context = getTenantContextOrUndefined();
        if (context && config.complianceRelevant) {
          await createAuditLog({
            merchantId: context.tenantId,
            userId: context.userId || 'system',
            action: `${config.action}:failed`,
            resourceType: config.resourceType,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            reason: error instanceof Error ? error.message : 'Unknown error',
            complianceRelevant: true,
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Create audit log from request context (convenience method)
 *
 * Automatically pulls context from AsyncLocalStorage
 *
 * @param action Action name (e.g., "campaign:created")
 * @param options Additional details
 * @returns Created audit entry
 */
export async function auditFromContext(
  action: string,
  options: Partial<AuditLogPayload> = {}
): Promise<AuditLogEntry> {
  const context = getTenantContext();

  return createAuditLog({
    merchantId: context.tenantId,
    userId: context.userId || 'system',
    action,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    ...options,
  });
}

/**
 * Audit log queryer for compliance reporting
 *
 * Usage:
 * ```typescript
 * const logs = await auditQuery()
 *   .since(new Date('2024-01-01'))
 *   .action('payment:*')
 *   .tenant(merchantId)
 *   .get();
 * ```
 */
export class AuditQuery {
  private query: any = {};

  since(date: Date): this {
    this.query.createdAt = { gte: date };
    return this;
  }

  until(date: Date): this {
    this.query.createdAt = { ...this.query.createdAt, lte: date };
    return this;
  }

  action(pattern: string): this {
    // Support wildcards (e.g., "payment:*")
    if (pattern.includes('*')) {
      const regex = pattern.replace(/\*/g, '.*');
      this.query.action = { contains: pattern.replace('*', '') };
    } else {
      this.query.action = pattern;
    }
    return this;
  }

  tenant(merchantId: string): this {
    this.query.merchantId = merchantId;
    return this;
  }

  actor(userId: string): this {
    this.query.actorUserId = userId;
    return this;
  }

  resource(resourceType: string, resourceId?: string): this {
    this.query.resourceType = resourceType;
    if (resourceId) {
      this.query.resourceId = resourceId;
    }
    return this;
  }

  async get() {
    this.query.deleted = false;

    return prisma.auditLog.findMany({
      where: this.query,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    this.query.deleted = false;
    return prisma.auditLog.count({ where: this.query });
  }
}

export function auditQuery(): AuditQuery {
  return new AuditQuery();
}
