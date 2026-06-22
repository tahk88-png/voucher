import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest, { params }: { params: Promise<{id: string}> }) {
  return withErrorHandler(async () => {
  const { id } = await params
    const session = await auth();
    const body = await req.json();
    const { email } = joinSchema.parse(body);

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      select: { id: true, status: true, usageLimitTotal: true, merchantId: true },
    });
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

    const existing = await prisma.waitlistEntry.findUnique({
      where: { voucherId_email: { voucherId: id, email } },
    });
    if (existing) return NextResponse.json({ message: 'Already on waitlist', entry: existing });

    const entry = await prisma.waitlistEntry.create({
      data: {
        voucherId: id,
        userId: session?.user?.id || undefined,
        email,
      },
    });

    // Get position
    const position = await prisma.waitlistEntry.count({
      where: { voucherId: id, createdAt: { lte: entry.createdAt } },
    });

    return NextResponse.json({ entry, position }, { status: 201 });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{id: string}> }) {
  return withErrorHandler(async () => {
  const { id } = await params
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    // Require auth and only allow removing your OWN waitlist entry. Without
    // this, an anonymous caller could remove anyone from a waitlist (denying
    // them a drop slot) just by knowing their email + the voucher id.
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const caller = session.user.email?.toLowerCase();
    if (!caller || caller !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.waitlistEntry.deleteMany({
      where: { voucherId: id, email },
    });

    return NextResponse.json({ success: true });
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{id: string}> }) {
  return withErrorHandler(async () => {
  const { id } = await params
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const totalCount = await prisma.waitlistEntry.count({ where: { voucherId: id } });

    if (email) {
      const entry = await prisma.waitlistEntry.findUnique({
        where: { voucherId_email: { voucherId: id, email } },
      });
      if (!entry) return NextResponse.json({ onWaitlist: false, totalCount });

      const position = await prisma.waitlistEntry.count({
        where: { voucherId: id, createdAt: { lte: entry.createdAt } },
      });
      return NextResponse.json({ onWaitlist: true, position, totalCount, entry });
    }

    return NextResponse.json({ totalCount });
  });
}
