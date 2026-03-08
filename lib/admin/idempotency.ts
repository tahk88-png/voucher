/**
 * Idempotency middleware for admin mutations.
 *
 * Uses Redis to store POST/PATCH outcomes keyed by `Idempotency-Key` header.
 * - Same key + same request hash → returns cached response.
 * - Same key + different body hash → 409 CONFLICT.
 * - No key on a mutation → 400 error.
 * - Entries expire after 24 hours.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";
import { logger } from "@/lib/logger";

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const IDEMPOTENCY_PREFIX = "admin:idempotency:";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StoredOutcome = {
  requestHash: string;
  statusCode: number;
  body: unknown;
  adminId: string;
  route: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashBody(body: unknown): string {
  const payload = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Wrap a mutation handler with idempotency semantics.
 *
 * Usage:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   return withIdempotency(req, {
 *     adminId: admin.userId,
 *     route: 'admin.billing.refund',
 *   }, async (parsedBody) => {
 *     // mutation logic — parsedBody is the already-parsed request body
 *     return NextResponse.json({ success: true }, { status: 201 });
 *   });
 * }
 * ```
 */
export async function withIdempotency(
  req: Request,
  context: { adminId: string; route: string },
  handler: (body: unknown) => Promise<NextResponse>,
): Promise<NextResponse> {
  const idempotencyKey = req.headers.get("idempotency-key");

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key header is required for mutations", code: "IDEMPOTENCY_KEY_MISSING" },
      { status: 400 },
    );
  }

  if (idempotencyKey.length > 256) {
    return NextResponse.json(
      { error: "Idempotency-Key too long (max 256 chars)", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const cacheKey = `${IDEMPOTENCY_PREFIX}${context.adminId}:${idempotencyKey}`;

  // Parse the body once
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const reqHash = hashBody(body);

  // ---- Check for existing outcome ----------------------------------------
  const cached = await cacheGet(cacheKey);

  if (cached) {
    let outcome: StoredOutcome;
    try {
      outcome = JSON.parse(cached);
    } catch {
      // Corrupted cache entry — proceed as fresh
      logger.warn("Corrupted idempotency cache entry", { cacheKey });
      return executeAndStore(cacheKey, reqHash, body, context, handler);
    }

    // Same key, same body → replay stored response
    if (outcome.requestHash === reqHash) {
      logger.info("Idempotency cache hit — replaying response", {
        idempotencyKey,
        route: context.route,
        adminId: context.adminId,
      });

      return NextResponse.json(outcome.body, {
        status: outcome.statusCode,
        headers: { "X-Idempotency-Replayed": "true" },
      });
    }

    // Same key, different body → conflict
    logger.warn("Idempotency conflict — same key, different body", {
      idempotencyKey,
      route: context.route,
      adminId: context.adminId,
    });

    return NextResponse.json(
      {
        error: "Idempotency conflict: this key was already used with a different request body",
        code: "CONFLICT",
      },
      { status: 409 },
    );
  }

  return executeAndStore(cacheKey, reqHash, body, context, handler);
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function executeAndStore(
  cacheKey: string,
  reqHash: string,
  body: unknown,
  context: { adminId: string; route: string },
  handler: (body: unknown) => Promise<NextResponse>,
): Promise<NextResponse> {
  const response = await handler(body);

  // Store the outcome (best-effort — if Redis is down we still return)
  try {
    const responseBody = await response.clone().json().catch(() => null);

    const outcome: StoredOutcome = {
      requestHash: reqHash,
      statusCode: response.status,
      body: responseBody,
      adminId: context.adminId,
      route: context.route,
      createdAt: new Date().toISOString(),
    };

    await cacheSet(cacheKey, JSON.stringify(outcome), IDEMPOTENCY_TTL_SECONDS);
  } catch (err) {
    logger.warn("Failed to store idempotency outcome", {
      cacheKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return response;
}
