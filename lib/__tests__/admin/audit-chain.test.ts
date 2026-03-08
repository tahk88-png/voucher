import { describe, it, expect } from "vitest";
import { computeEntryHash, GENESIS_HASH } from "@/lib/admin/audit";

describe("Admin Audit Chain", () => {
  // ---- Genesis hash -------------------------------------------------------

  it("GENESIS_HASH should be 64 zeroes", () => {
    expect(GENESIS_HASH).toBe("0".repeat(64));
    expect(GENESIS_HASH.length).toBe(64);
  });

  // ---- Hash computation ---------------------------------------------------

  it("computeEntryHash should return a 64-char hex string", () => {
    const hash = computeEntryHash({
      actorUserId: "user-1",
      action: "user.ban",
      targetType: "User",
      targetId: "user-2",
      reason: "Spam",
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it("same inputs should produce the same hash (deterministic)", () => {
    const params = {
      actorUserId: "user-1",
      action: "user.ban",
      targetType: "User",
      targetId: "user-2",
      reason: "Spam",
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    };

    const hash1 = computeEntryHash(params);
    const hash2 = computeEntryHash(params);

    expect(hash1).toBe(hash2);
  });

  it("different action should produce a different hash", () => {
    const base = {
      actorUserId: "user-1",
      action: "user.ban",
      targetType: "User",
      targetId: "user-2",
      reason: "Spam",
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    };

    const hash1 = computeEntryHash(base);
    const hash2 = computeEntryHash({ ...base, action: "user.unban" });

    expect(hash1).not.toBe(hash2);
  });

  it("different hashPrev should produce a different hash", () => {
    const base = {
      actorUserId: "user-1",
      action: "user.ban",
      targetType: "User",
      targetId: "user-2",
      reason: null,
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    };

    const hash1 = computeEntryHash(base);
    const hash2 = computeEntryHash({
      ...base,
      hashPrev: "a".repeat(64),
    });

    expect(hash1).not.toBe(hash2);
  });

  // ---- Chain integrity simulation -----------------------------------------

  it("should simulate a valid 3-entry chain", () => {
    const entries = [];

    // Entry 1 (genesis)
    const entry1 = {
      actorUserId: "admin-1",
      action: "user.ban",
      targetType: "User" as string | null,
      targetId: "user-1" as string | null,
      reason: "Spam" as string | null,
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    };
    const hash1 = computeEntryHash(entry1);
    entries.push({ ...entry1, hashSelf: hash1 });

    // Entry 2
    const entry2 = {
      actorUserId: "admin-1",
      action: "merchant.deactivate",
      targetType: "Merchant" as string | null,
      targetId: "merchant-1" as string | null,
      reason: "Policy violation" as string | null,
      metadata: null,
      hashPrev: hash1,
      createdAt: new Date("2025-01-01T00:01:00Z"),
    };
    const hash2 = computeEntryHash(entry2);
    entries.push({ ...entry2, hashSelf: hash2 });

    // Entry 3
    const entry3 = {
      actorUserId: "admin-2",
      action: "user.unban",
      targetType: "User" as string | null,
      targetId: "user-1" as string | null,
      reason: "Appeal approved" as string | null,
      metadata: null,
      hashPrev: hash2,
      createdAt: new Date("2025-01-01T00:02:00Z"),
    };
    const hash3 = computeEntryHash(entry3);
    entries.push({ ...entry3, hashSelf: hash3 });

    // Verify chain
    let prevHash = GENESIS_HASH;
    for (const entry of entries) {
      // Verify hashPrev link
      expect(entry.hashPrev).toBe(prevHash);

      // Recompute and verify hashSelf
      const recomputed = computeEntryHash(entry);
      expect(recomputed).toBe(entry.hashSelf);

      prevHash = entry.hashSelf;
    }
  });

  it("should detect a tampered entry in the chain", () => {
    // Build a 2-entry chain
    const entry1 = {
      actorUserId: "admin-1",
      action: "user.ban",
      targetType: "User" as string | null,
      targetId: "user-1" as string | null,
      reason: "Spam" as string | null,
      metadata: null,
      hashPrev: GENESIS_HASH,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    };
    const hash1 = computeEntryHash(entry1);

    const entry2 = {
      actorUserId: "admin-1",
      action: "refund.issue",
      targetType: "Payment" as string | null,
      targetId: "pay-1" as string | null,
      reason: "Duplicate charge" as string | null,
      metadata: null,
      hashPrev: hash1,
      createdAt: new Date("2025-01-01T00:01:00Z"),
    };
    const hash2 = computeEntryHash(entry2);

    // Tamper with entry1's action
    const tampered1 = { ...entry1, action: "user.unban", hashSelf: hash1 };

    // Recompute should NOT match the stored hash
    const recomputed = computeEntryHash(tampered1);
    expect(recomputed).not.toBe(hash1);
  });
});
