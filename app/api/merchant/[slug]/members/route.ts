import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { captureException } from '@/lib/error-tracking';
import { z } from 'zod';
import { sendMemberInviteEmail } from '@/lib/emails';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['merchant_admin', 'merchant_staff']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Only merchant_admin can invite members
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

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
        actorUserId: session.user.id,
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
        inviterName: session.user.name || session.user.email || 'Admin',
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
    if (error instanceof Error) {
      captureException(error, {
        context: 'member_invite',
        merchantSlug: params.slug,
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
