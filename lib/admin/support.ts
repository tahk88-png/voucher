import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type SupportCasePriority = "low" | "normal" | "high" | "urgent";
type SupportCaseStatus =
  | "open"
  | "in_progress"
  | "waiting_on_user"
  | "resolved"
  | "closed";

/**
 * Generate a unique case number in format SUP-YYYYMMDD-XXXX.
 */
export function generateCaseNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `SUP-${y}${m}${d}-${rand}`;
}

/**
 * Create a new support case.
 */
export async function createSupportCase(input: {
  userId: string;
  subject: string;
  description: string;
  priority?: SupportCasePriority;
  category?: string;
  metadata?: Record<string, unknown>;
}): Promise<any> {
  const caseNumber = generateCaseNumber();

  const supportCase = await prisma.supportCase.create({
    data: {
      caseNumber,
      userId: input.userId,
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "normal",
      status: "open",
      category: input.category ?? null,
      metadata: input.metadata ? (input.metadata as any) : undefined,
    },
  });

  logger.info("Support case created", {
    caseId: supportCase.id,
    caseNumber,
    userId: input.userId,
  });

  return supportCase;
}

/**
 * List support cases with filters and pagination.
 */
export async function getSupportCases(filters: {
  userId?: string;
  assignedAdminId?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<{ cases: any[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.assignedAdminId) {
    where.assignedAdminId = filters.assignedAdminId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }

  const [cases, total] = await Promise.all([
    prisma.supportCase.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedAdmin: { select: { id: true, email: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.supportCase.count({ where }),
  ]);

  return { cases, total };
}

/**
 * Update a support case (status, assignment, priority).
 */
export async function updateSupportCase(
  caseId: string,
  update: {
    status?: SupportCaseStatus;
    assignedAdminId?: string;
    priority?: SupportCasePriority;
  }
): Promise<any> {
  const data: any = {};

  if (update.status) {
    data.status = update.status;
    if (update.status === "resolved") {
      data.resolvedAt = new Date();
    }
    if (update.status === "closed") {
      data.closedAt = new Date();
    }
  }

  if (update.assignedAdminId !== undefined) {
    data.assignedAdminId = update.assignedAdminId;
  }

  if (update.priority) {
    data.priority = update.priority;
  }

  const updated = await prisma.supportCase.update({
    where: { id: caseId },
    data,
    include: {
      user: { select: { id: true, email: true, name: true } },
      assignedAdmin: { select: { id: true, email: true, name: true } },
    },
  });

  logger.info("Support case updated", { caseId, update });
  return updated;
}

/**
 * Add a note to a support case.
 */
export async function addSupportNote(input: {
  caseId: string;
  authorUserId: string;
  body: string;
  isInternal?: boolean;
}): Promise<any> {
  const note = await prisma.supportNote.create({
    data: {
      caseId: input.caseId,
      authorUserId: input.authorUserId,
      body: input.body,
      isInternal: input.isInternal ?? false,
    },
  });

  logger.info("Support note added", {
    noteId: note.id,
    caseId: input.caseId,
    isInternal: input.isInternal ?? false,
  });

  return note;
}

/**
 * Get full details of a support case including notes.
 */
export async function getSupportCaseDetail(caseId: string): Promise<any> {
  const supportCase = await prisma.supportCase.findUnique({
    where: { id: caseId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      assignedAdmin: { select: { id: true, email: true, name: true } },
      notes: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  return supportCase;
}
