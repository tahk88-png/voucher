import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';
import { sendMemberInviteEmail } from '@/lib/emails';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { requireTeamInviteAccess } from '@/lib/billing';
import { withErrorHandler } from '@/lib/error-handler';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['merchant_admin', 'merchant_staff']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    await requireTeamInviteAccess(merchant.id);

    const body = await req.json();
    const data = inviteSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. The user must create an account first before they can be invited.' },
        { status: 404 }
      );
    }

    // Check if member already exists
    const existingMember = await prisma.merchantMember.findUnique({
      where: {
        merchantId_userId: {
          merchantId: merchant.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of your team.' },
        { status: 400 }
      );
    }

    // Create merchant member
    const member = await prisma.merchantMember.create({
      data: {
        merchantId: merchant.id,
        userId: user.id,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'member.invited',
        resourceType: 'member',
        resourceId: member.id,
        payloadJson: JSON.stringify({
          memberId: member.id,
          userId: user.id,
          email: user.email,
          role: data.role,
        }),
      },
    });

    // Send invite email
    try {
      await sendMemberInviteEmail({
        to: user.email,
        merchantName: merchant.name,
        role: data.role,
        inviterName: profile.email || 'Admin',
      });
    } catch (emailError) {
      if (emailError instanceof Error) {
        captureException(emailError, {
          context: 'member_invite_email',
          merchantId: merchant.id,
          userId: user.id,
        });
      }
    }

    return NextResponse.json(member);
  });
}
