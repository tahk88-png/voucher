import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const acceptSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/orgs/invitations/accept — Accept an invitation via token
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Must be signed in to accept invitation' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const invitation = await prisma.orgInvitation.findUnique({
    where: { token: parsed.data.token },
    include: { org: true },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.acceptedAt) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  // Verify email matches
  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invitation was sent to a different email address' },
      { status: 403 }
    );
  }

  // Check not already a member
  const existing = await prisma.orgMembership.findUnique({
    where: { orgId_userId: { orgId: invitation.orgId, userId: session.user.id } },
  });
  if (existing) {
    // Mark invitation as accepted anyway
    await prisma.orgInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({ message: 'Already a member', orgId: invitation.orgId });
  }

  // Create membership + mark invitation accepted in a transaction
  await prisma.$transaction([
    prisma.orgMembership.create({
      data: {
        orgId: invitation.orgId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    prisma.orgInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    message: 'Invitation accepted',
    orgId: invitation.orgId,
    orgName: invitation.org.name,
    role: invitation.role,
  });
}
