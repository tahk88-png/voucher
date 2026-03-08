import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.ops.read");

    const migrations = await prisma.$queryRaw<
      {
        migration_name: string;
        started_at: Date;
        finished_at: Date | null;
      }[]
    >`SELECT migration_name, started_at, finished_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 50`;

    return NextResponse.json({ migrations });
  });
}
