import { describe, it, expect } from "vitest";
import { redact, computeDiff } from "@/lib/admin/audit-diff";

describe("Audit Diff & Redaction", () => {
  // ---- Redaction -----------------------------------------------------------

  describe("redact", () => {
    it("should redact default sensitive fields", () => {
      const obj = {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hashed-secret",
        token: "jwt-token-123",
        name: "Alice",
      };

      const result = redact(obj);

      expect(result.id).toBe("user-1");
      expect(result.email).toBe("alice@example.com");
      expect(result.name).toBe("Alice");
      expect(result.passwordHash).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
    });

    it("should redact additional custom fields", () => {
      const obj = { id: "1", email: "alice@example.com", ssn: "123-45-6789" };

      const result = redact(obj, ["email"]);

      expect(result.id).toBe("1");
      expect(result.email).toBe("[REDACTED]");
      expect(result.ssn).toBe("[REDACTED]"); // ssn is in defaults
    });

    it("should handle nested objects", () => {
      const obj = {
        user: { name: "Bob", secret: "top-secret" },
        metadata: { count: 42 },
      };

      const result = redact(obj);
      const user = result.user as Record<string, unknown>;

      expect(user.name).toBe("Bob");
      expect(user.secret).toBe("[REDACTED]");
    });

    it("should handle null and undefined values", () => {
      const obj = { name: null, value: undefined, token: "abc" };
      const result = redact(obj as any);

      expect(result.name).toBeNull();
      expect(result.value).toBeUndefined();
      expect(result.token).toBe("[REDACTED]");
    });

    it("should handle arrays", () => {
      const obj = { items: [{ token: "abc" }, { name: "Bob" }] };
      const result = redact(obj);
      const items = result.items as any[];

      expect(items[0].token).toBe("[REDACTED]");
      expect(items[1].name).toBe("Bob");
    });

    it("should convert Date values to ISO strings", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const obj = { createdAt: date };
      const result = redact(obj as any);

      expect(result.createdAt).toBe("2025-06-15T12:00:00.000Z");
    });
  });

  // ---- Diff ---------------------------------------------------------------

  describe("computeDiff", () => {
    it("should return empty array for identical objects", () => {
      const obj = { name: "Alice", status: "active" };
      const diff = computeDiff(obj, { ...obj });

      expect(diff).toHaveLength(0);
    });

    it("should detect changed fields", () => {
      const before = { name: "Alice", status: "active", email: "a@b.com" };
      const after = { name: "Alice", status: "disabled", email: "a@b.com" };

      const diff = computeDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        field: "status",
        before: "active",
        after: "disabled",
      });
    });

    it("should detect added fields", () => {
      const before = { name: "Alice" };
      const after = { name: "Alice", role: "admin" };

      const diff = computeDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0].field).toBe("role");
      expect(diff[0].before).toBeUndefined();
      expect(diff[0].after).toBe("admin");
    });

    it("should detect removed fields", () => {
      const before = { name: "Alice", image: "photo.jpg" };
      const after = { name: "Alice" };

      const diff = computeDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0].field).toBe("image");
      expect(diff[0].before).toBe("photo.jpg");
      expect(diff[0].after).toBeUndefined();
    });

    it("should redact sensitive fields in diff output", () => {
      const before = { passwordHash: "old-hash", status: "active" };
      const after = { passwordHash: "new-hash", status: "disabled" };

      const diff = computeDiff(before, after);

      expect(diff).toHaveLength(2);

      const pwDiff = diff.find((d) => d.field === "passwordHash")!;
      expect(pwDiff.before).toBe("[REDACTED]");
      expect(pwDiff.after).toBe("[REDACTED]");

      const statusDiff = diff.find((d) => d.field === "status")!;
      expect(statusDiff.before).toBe("active");
      expect(statusDiff.after).toBe("disabled");
    });

    it("should handle JSON object field changes", () => {
      const before = { meta: { a: 1, b: 2 } };
      const after = { meta: { a: 1, b: 3 } };

      const diff = computeDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0].field).toBe("meta");
    });

    it("should not diff identical JSON objects", () => {
      const before = { meta: { a: 1 } };
      const after = { meta: { a: 1 } };

      const diff = computeDiff(before, after);
      expect(diff).toHaveLength(0);
    });
  });
});
