/**
 * Higher-order wrapper for admin API routes that automatically records an
 * audit trail entry before delegating to the real handler.
 *
 * Usage:
 * ```ts
 * export const POST = withAdminAudit({
 *   permission: "admin.users.ban",
 *   action: "user.ban",
 *   targetType: "user",
 *   reasonRequired: true,
 *   extractTargetId: (_req, params) => params?.id,
 * })((req, { profile, auditId }) => {
 *   // handler logic ...
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server"
import { getClientIp } from "@/lib/get-client-ip"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission, type AdminContext } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import type { AdminPermission } from "@/lib/admin/roles"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditWrappedContext = {
  profile: AdminContext
  auditId: string
  params?: Record<string, string>
}

export type AuditWrappedHandler = (
  req: NextRequest,
  ctx: AuditWrappedContext,
) => Promise<NextResponse>

export type WithAdminAuditConfig = {
  /** Permission required to call this endpoint. */
  permission: AdminPermission
  /** Audit action string, e.g. "user.ban" or "merchant.deactivate". */
  action: string
  /** Optional target entity type, e.g. "user", "merchant". */
  targetType?: string
  /** When true, the request body must include a `reason` field. */
  reasonRequired?: boolean
  /** Extracts targetId from request / route params. */
  extractTargetId?: (
    req: NextRequest,
    params?: Record<string, string>,
  ) => string | undefined
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

export function withAdminAudit(config: WithAdminAuditConfig) {
  return (handler: AuditWrappedHandler) => {
    return async (
      req: NextRequest,
      routeContext?: { params: Record<string, string> },
    ): Promise<NextResponse> => {
      return withErrorHandler(async () => {
        // 1. Auth + permission check
        const profile = await requireAdminPermission(config.permission)

        // 2. Parse body for reason (only for methods that carry a body)
        let reason: string | undefined
        let bodyJson: Record<string, unknown> | undefined

        if (
          req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "PATCH" ||
          req.method === "DELETE"
        ) {
          try {
            const cloned = req.clone()
            bodyJson = (await cloned.json()) as Record<string, unknown>
            reason = typeof bodyJson?.reason === "string" ? bodyJson.reason : undefined
          } catch {
            // Body may not be JSON or may be empty -- that's fine.
          }
        }

        if (config.reasonRequired && !reason) {
          return NextResponse.json(
            { error: "A reason is required for this action." },
            { status: 400 },
          )
        }

        // 3. Resolve params (may be a Promise in Next.js 14 app router)
        const params = routeContext?.params
          ? (typeof (routeContext.params as unknown as Promise<Record<string, string>>).then === "function"
              ? await (routeContext.params as unknown as Promise<Record<string, string>>)
              : routeContext.params)
          : undefined

        // 4. Extract targetId
        const targetId = config.extractTargetId
          ? config.extractTargetId(req, params as Record<string, string> | undefined)
          : undefined

        // 5. Actor metadata from headers (trusted-IP helper; keep undefined
        // when no IP header is present rather than storing the literal
        // 'unknown' in the audit record)
        const clientIp = getClientIp(req)
        const actorIp = clientIp === "unknown" ? undefined : clientIp
        const actorUserAgent = req.headers.get("user-agent") ?? undefined

        // 6. Record audit entry
        const auditId = await recordAdminAudit({
          actorUserId: profile.userId,
          actorIp,
          actorUserAgent,
          action: config.action,
          targetType: config.targetType,
          targetId,
          reason,
          metadata: bodyJson,
        })

        // 7. Delegate to actual handler
        return handler(req, {
          profile,
          auditId,
          params: params as Record<string, string> | undefined,
        })
      }) as Promise<NextResponse>
    }
  }
}
