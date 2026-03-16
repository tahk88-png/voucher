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

  const exemptions = await prisma.vatExemption.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      merchant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ exemptions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = session?.user && (adminEmails.includes(session.user.email!) || (session.user as any).adminRole);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { merchantId, countryCode, exemptionType, documentReference, expiresAt } = body;

  if (!merchantId || !countryCode || !exemptionType) {
    return NextResponse.json(
      { error: 'merchantId, countryCode, and exemptionType are required' },
      { status: 400 }
    );
  }

  const validTypes = ['b2b', 'export', 'charity', 'public_body'];
  if (!validTypes.includes(exemptionType)) {
    return NextResponse.json(
      { error: `exemptionType must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  // Check merchant exists
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  const code = countryCode.toUpperCase();

  // Check for existing exemption
  const existing = await prisma.vatExemption.findFirst({
    where: { merchantId, countryCode: code, exemptionType },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'An exemption with this merchant, country, and type already exists' },
      { status: 409 }
    );
  }

  const exemption = await prisma.vatExemption.create({
    data: {
      merchantId,
      countryCode: code,
      exemptionType,
      documentReference: documentReference ?? null,
      approvedAt: new Date(),
      approvedBy: session!.user!.email,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: {
      merchant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ exemption }, { status: 201 });
}
