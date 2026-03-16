import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const updateMemberSchema = z.object({
  role: z.enum(['merchant_admin', 'merchant_staff']),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, memberId } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    const member = await prisma.merchantMember.findFirst({
      where: { id: memberId, merchantId: merchant.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent changing own role
    if (member.userId === profile.userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role.' },
        { status: 400 }
      );
    }

    const updated = await prisma.merchantMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'member.role_changed',
        resourceType: 'member',
        resourceId: memberId,
        payloadJson: JSON.stringify({
          memberId,
          userId: member.userId,
          email: member.user.email,
          oldRole: member.role,
          newRole: data.role,
        }),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, memberId } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const member = await prisma.merchantMember.findFirst({
      where: { id: memberId, merchantId: merchant.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent removing yourself
    if (member.userId === profile.userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the team.' },
        { status: 400 }
      );
    }

    await prisma.merchantMember.delete({ where: { id: memberId } });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'member.removed',
        resourceType: 'member',
        resourceId: memberId,
        payloadJson: JSON.stringify({
          memberId,
          userId: member.userId,
          email: member.user.email,
          role: member.role,
        }),
      },
    });

    return NextResponse.json({ success: true });
  });
}
