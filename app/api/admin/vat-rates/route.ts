import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = session?.user && (adminEmails.includes(session.user.email!) || (session.user as any).adminRole);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const rates = await prisma.vatRate.findMany({
    orderBy: [{ countryCode: 'asc' }, { rateType: 'asc' }, { effectiveFrom: 'desc' }],
  });

  return NextResponse.json({ rates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = session?.user && (adminEmails.includes(session.user.email!) || (session.user as any).adminRole);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { countryCode, rate, rateType, effectiveFrom, effectiveUntil, isActive } = body;

  if (!countryCode || rate == null || !rateType || !effectiveFrom) {
    return NextResponse.json(
      { error: 'countryCode, rate, rateType, and effectiveFrom are required' },
      { status: 400 }
    );
  }

  const validRateTypes = ['standard', 'reduced', 'super_reduced', 'zero'];
  if (!validRateTypes.includes(rateType)) {
    return NextResponse.json(
      { error: `rateType must be one of: ${validRateTypes.join(', ')}` },
      { status: 400 }
    );
  }

  if (typeof rate !== 'number' || rate < 0 || rate > 100) {
    return NextResponse.json(
      { error: 'rate must be a number between 0 and 100' },
      { status: 400 }
    );
  }

  const code = countryCode.toUpperCase();

  // Check for duplicate
  const existing = await prisma.vatRate.findFirst({
    where: {
      countryCode: code,
      rateType,
      effectiveFrom: new Date(effectiveFrom),
    },
  });

  if (existing) {
    // Update existing rate
    const updated = await prisma.vatRate.update({
      where: { id: existing.id },
      data: {
        rate,
        effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json({ rate: updated });
  }

  const created = await prisma.vatRate.create({
    data: {
      countryCode: code,
      rate,
      rateType,
      effectiveFrom: new Date(effectiveFrom),
      effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ rate: created }, { status: 201 });
}
