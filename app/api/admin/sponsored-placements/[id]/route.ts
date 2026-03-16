import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = adminEmails.includes(session.user.email!) || (session.user as any).adminRole;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const placement = await prisma.sponsoredGiftPlacement.findUnique({
    where: { id },
    include: {
      merchant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!placement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = new Date();
  const ctr = placement.impressionCount > 0
    ? (placement.clickCount / placement.impressionCount) * 100
    : 0;
  const spendRate = placement.budgetCents > 0
    ? (placement.spentCents / placement.budgetCents) * 100
    : 0;
  const isLive = placement.isActive && placement.startAt <= now && placement.endAt >= now;

  return NextResponse.json({
    placement: {
      ...placement,
      ctr: Math.round(ctr * 100) / 100,
      spendRate: Math.round(spendRate * 100) / 100,
      isLive,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.sponsoredGiftPlacement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: any = {};
  if (body.sponsorName !== undefined) data.sponsorName = body.sponsorName.trim();
  if (body.merchantId !== undefined) data.merchantId = body.merchantId || null;
  if (body.targetCategories !== undefined) data.targetCategories = body.targetCategories;
  if (body.targetOccasions !== undefined) data.targetOccasions = body.targetOccasions;
  if (body.budgetCents !== undefined) data.budgetCents = body.budgetCents;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.startAt !== undefined) data.startAt = new Date(body.startAt);
  if (body.endAt !== undefined) data.endAt = new Date(body.endAt);
  if (body.clickLimit !== undefined) data.clickLimit = body.clickLimit;
  if (body.impressionsLimit !== undefined) data.impressionsLimit = body.impressionsLimit;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const placement = await prisma.sponsoredGiftPlacement.update({
    where: { id },
    data,
    include: {
      merchant: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ placement });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const existing = await prisma.sponsoredGiftPlacement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Soft-delete: deactivate instead of removing
  const placement = await prisma.sponsoredGiftPlacement.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ placement, message: 'Placement deactivated' });
}
