import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

/**
 * Public gift-hub taxonomy: the categories, occasions and personas used to
 * build the filter controls on /gifts.
 *
 * This exists so public pages don't have to call the /api/admin/gifts/*
 * endpoints (which are admin-guarded). It returns only active rows and only
 * the display fields the filter UI needs — no product counts, no admin
 * metadata.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return withErrorHandler(async () => {
    const [categories, occasions, personas] = await Promise.all([
      prisma.giftCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true, color: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.giftOccasion.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.giftPersona.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ categories, occasions, personas });
  });
}
