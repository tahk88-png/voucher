import { prisma } from "@/lib/prisma"

export async function recordAuditEvent(params: {
  orgId: string
  actorUserId?: string | null
  actorType?: "system" | "user" | "partner_api"
  entityType: "voucher" | "campaign" | "order" | "invoice" | "org" | "user" | "redemption"
  entityId: string
  eventType:
    | "create"
    | "issue"
    | "activate"
    | "redeem"
    | "expire"
    | "void"
    | "refund"
    | "pause"
    | "resume"
    | "update"
  before?: unknown
  after?: unknown
}) {
  await prisma.auditEvent.create({
    data: {
      orgId: params.orgId,
      actorUserId: params.actorUserId ?? null,
      actorType: params.actorType ?? "user",
      entityType: params.entityType,
      entityId: params.entityId,
      eventType: params.eventType,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
    },
  })
}
