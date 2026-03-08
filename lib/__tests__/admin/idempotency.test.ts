import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Redis before imports
const mockCache = new Map<string, string>();

vi.mock("@/lib/redis", () => ({
  cacheGet: vi.fn(async (key: string) => mockCache.get(key) ?? null),
  cacheSet: vi.fn(async (key: string, value: string) => {
    mockCache.set(key, value);
    return true;
  }),
  cacheDelete: vi.fn(async (key: string) => {
    mockCache.delete(key);
    return true;
  }),
}));

import { NextResponse } from "next/server";
import { withIdempotency } from "@/lib/admin/idempotency";

function makeRequest(body: unknown, idempotencyKey?: string): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (idempotencyKey) {
    headers["idempotency-key"] = idempotencyKey;
  }

  return new Request("http://localhost/api/admin/test", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("Idempotency Middleware", () => {
  beforeEach(() => {
    mockCache.clear();
  });

  it("should reject requests without Idempotency-Key header", async () => {
    const req = makeRequest({ action: "test" });
    const handler = vi.fn();

    const res = await withIdempotency(
      req,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("IDEMPOTENCY_KEY_MISSING");
    expect(handler).not.toHaveBeenCalled();
  });

  it("should execute handler on first request with a key", async () => {
    const req = makeRequest({ action: "create" }, "key-1");
    const handler = vi.fn(async () =>
      NextResponse.json({ id: "new-1" }, { status: 201 }),
    );

    const res = await withIdempotency(
      req,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("new-1");
  });

  it("should return cached response for same key + same body", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ id: "new-1" }, { status: 201 }),
    );

    // First request
    const req1 = makeRequest({ action: "create" }, "key-2");
    await withIdempotency(
      req1,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(1);

    // Second request with same key and body
    const req2 = makeRequest({ action: "create" }, "key-2");
    const res2 = await withIdempotency(
      req2,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    // Handler should NOT be called again
    expect(handler).toHaveBeenCalledTimes(1);
    expect(res2.status).toBe(201);
    expect(res2.headers.get("X-Idempotency-Replayed")).toBe("true");

    const data = await res2.json();
    expect(data.id).toBe("new-1");
  });

  it("should return 409 CONFLICT for same key + different body", async () => {
    const handler = vi.fn(async () =>
      NextResponse.json({ id: "new-1" }, { status: 201 }),
    );

    // First request
    const req1 = makeRequest({ action: "create", value: 1 }, "key-3");
    await withIdempotency(
      req1,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    // Second request with same key but DIFFERENT body
    const req2 = makeRequest({ action: "create", value: 2 }, "key-3");
    const res2 = await withIdempotency(
      req2,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(1); // not called again
    expect(res2.status).toBe(409);
    const data = await res2.json();
    expect(data.code).toBe("CONFLICT");
  });

  it("should scope keys per admin — different admins can use same key", async () => {
    const handler = vi.fn(async (body: unknown) =>
      NextResponse.json({ body }, { status: 200 }),
    );

    // Admin 1 uses key-4
    const req1 = makeRequest({ x: 1 }, "key-4");
    await withIdempotency(
      req1,
      { adminId: "admin-1", route: "test" },
      handler,
    );

    // Admin 2 uses same key-4 — should work independently
    const req2 = makeRequest({ x: 2 }, "key-4");
    const res2 = await withIdempotency(
      req2,
      { adminId: "admin-2", route: "test" },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(2);
    expect(res2.status).toBe(200);
  });
});
