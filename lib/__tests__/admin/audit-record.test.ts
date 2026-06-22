/**
 * Unit tests for recordAdminAudit() in lib/admin/audit.ts.
 *
 * Hash-chain math and chain-integrity simulation are already covered by
 * audit-chain.test.ts. These tests exercise the DB-integration logic:
 * - reason-required guard for sensitive actions
 * - idempotency short-circuit on `idempotencyKey`
 * - chain linkage: first entry uses GENESIS_HASH, subsequent entries link
 *   to the previous row's `hashSelf`
 * - transaction-client passthrough
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { findUnique, findFirst, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminAuditLog: { findUnique, findFirst, create },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { recordAdminAudit, GENESIS_HASH } from '@/lib/admin/audit';

beforeEach(() => {
  vi.clearAllMocks();
  findUnique.mockResolvedValue(null);
  findFirst.mockResolvedValue(null);
  create.mockImplementation(async ({ data }: any) => ({ id: 'entry-new', ...data }));
});

describe('recordAdminAudit — reason guard', () => {
  it('throws when a reason-required action is recorded without a reason', async () => {
    await expect(
      recordAdminAudit({
        actorUserId: 'admin-1',
        action: 'user.ban',
      }),
    ).rejects.toThrow(/Reason required/);
    expect(create).not.toHaveBeenCalled();
  });

  it('records a reason-required action when reason is provided', async () => {
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'user.ban',
      reason: 'Repeated abuse reports',
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('allows non-sensitive actions without a reason', async () => {
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
    });
    expect(create).toHaveBeenCalled();
  });
});

describe('recordAdminAudit — idempotency', () => {
  it('short-circuits when an entry with the same idempotencyKey already exists', async () => {
    findUnique.mockResolvedValue({ id: 'existing-entry' });

    const id = await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.update',
      idempotencyKey: 'op-123',
    });

    expect(id).toBe('existing-entry');
    expect(findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'op-123' },
      select: { id: true },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a new entry when idempotencyKey is unseen', async () => {
    findUnique.mockResolvedValue(null);
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.update',
      idempotencyKey: 'op-new',
    });
    expect(create).toHaveBeenCalled();
    const data = create.mock.calls[0][0].data;
    expect(data.idempotencyKey).toBe('op-new');
  });
});

describe('recordAdminAudit — chain linkage', () => {
  it('uses GENESIS_HASH for the first entry in an empty chain', async () => {
    findFirst.mockResolvedValue(null);
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
    });
    const data = create.mock.calls[0][0].data;
    expect(data.hashPrev).toBe(GENESIS_HASH);
  });

  it("links new entries to the most recent entry's hashSelf", async () => {
    const prevHash = 'f'.repeat(64);
    findFirst.mockResolvedValue({ hashSelf: prevHash });
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
    });
    const data = create.mock.calls[0][0].data;
    expect(data.hashPrev).toBe(prevHash);
    // hashSelf is computed fresh and must differ from hashPrev
    expect(data.hashSelf).not.toBe(prevHash);
    expect(data.hashSelf).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a deterministic hashSelf given the same input + prev hash', async () => {
    const prevHash = 'a'.repeat(64);
    const fixedDate = new Date('2026-01-01T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
    findFirst.mockResolvedValue({ hashSelf: prevHash });

    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
      targetType: 'Settings',
      targetId: 's-1',
    });
    const first = create.mock.calls[0][0].data.hashSelf;

    create.mockClear();
    // Run again with same input + same clock
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
      targetType: 'Settings',
      targetId: 's-1',
    });
    const second = create.mock.calls[0][0].data.hashSelf;

    expect(first).toBe(second);
    vi.useRealTimers();
  });
});

describe('recordAdminAudit — transaction client', () => {
  it('uses the provided transaction client when passed', async () => {
    const txFindUnique = vi.fn().mockResolvedValue(null);
    const txFindFirst = vi.fn().mockResolvedValue(null);
    const txCreate = vi.fn().mockResolvedValue({ id: 'tx-entry' });

    const tx = {
      adminAuditLog: {
        findUnique: txFindUnique,
        findFirst: txFindFirst,
        create: txCreate,
      },
    };

    const id = await recordAdminAudit(
      {
        actorUserId: 'admin-1',
        action: 'settings.view',
        idempotencyKey: 'tx-op',
      },
      tx as any,
    );

    expect(id).toBe('tx-entry');
    // All DB calls went through the transaction, not the default prisma mock
    expect(txFindUnique).toHaveBeenCalledTimes(1);
    expect(txFindFirst).toHaveBeenCalledTimes(1);
    expect(txCreate).toHaveBeenCalledTimes(1);
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('recordAdminAudit — persisted fields', () => {
  it('persists actorIp, actorUserAgent, targetType, targetId, metadata', async () => {
    await recordAdminAudit({
      actorUserId: 'admin-1',
      actorIp: '192.0.2.42',
      actorUserAgent: 'Mozilla/5.0',
      action: 'settings.view',
      targetType: 'Merchant',
      targetId: 'm-1',
      metadata: { previousValue: 'x', newValue: 'y' },
    });
    const data = create.mock.calls[0][0].data;
    expect(data.actorIp).toBe('192.0.2.42');
    expect(data.actorUserAgent).toBe('Mozilla/5.0');
    expect(data.targetType).toBe('Merchant');
    expect(data.targetId).toBe('m-1');
    expect(data.metadata).toEqual({ previousValue: 'x', newValue: 'y' });
  });

  it('normalizes missing optional fields to null / JsonNull', async () => {
    await recordAdminAudit({
      actorUserId: 'admin-1',
      action: 'settings.view',
    });
    const data = create.mock.calls[0][0].data;
    expect(data.actorIp).toBeNull();
    expect(data.actorUserAgent).toBeNull();
    expect(data.targetType).toBeNull();
    expect(data.targetId).toBeNull();
    expect(data.reason).toBeNull();
    expect(data.idempotencyKey).toBeNull();
  });
});
