import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';
import { sendMemberInviteEmail } from '@/lib/emails';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { requireTeamInviteAccess } from '@/lib/billing';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['merchant_admin', 'merchant_staff']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(params.slug, 'merchant_admin');
    await requireTeamInviteAccess(merchant.id);

    const body = await req.json();
    const data = inviteMemberSchema.parse(body);

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
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: 'member.invited',
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
      // Don't fail the request if email fails
    }

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof AccessControlError) {
      return accessErrorResponse(error);
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'member_invite',
        merchantSlug: params.slug,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
