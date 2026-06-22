import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireOrgMembership } from '@/lib/b2b/auth';
import { sendOrgInvitation } from '@/lib/emails';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'finance', 'marketing', 'support', 'partner_cashier', 'auditor']),
});

const INVITATION_EXPIRY_HOURS = 72;

/**
 * POST /api/orgs/[orgId]/invitations — Create a token-based invitation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await requireOrgMembership(session.user.id, orgId, ['owner', 'admin']);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, role } = parsed.data;

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId, userId: existingUser.id } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId, email } },
  });
  if (existingInvitation && !existingInvitation.acceptedAt && existingInvitation.expiresAt > new Date()) {
    return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 });
  }

  // Delete expired/accepted invitation if exists
  if (existingInvitation) {
    await prisma.orgInvitation.delete({ where: { id: existingInvitation.id } });
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);

  const invitation = await prisma.orgInvitation.create({
    data: {
      orgId,
      email,
      role,
      invitedBy: session.user.id,
      expiresAt,
    },
  });

  // Send the invitation email (non-blocking — the invite is created either way).
  try {
    const [org, inviter] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
    ]);
    await sendOrgInvitation({
      to: email,
      orgName: org?.name ?? 'an organization',
      role,
      inviterName: inviter?.name || inviter?.email || 'A teammate',
      token: invitation.token,
    });
  } catch (err) {
    logger.error('Failed to send org invitation email', {
      orgId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  }, { status: 201 });
}

/**
 * GET /api/orgs/[orgId]/invitations — List pending invitations
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await requireOrgMembership(session.user.id, orgId, ['owner', 'admin']);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const invitations = await prisma.orgInvitation.findMany({
    where: {
      orgId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invitations });
}
