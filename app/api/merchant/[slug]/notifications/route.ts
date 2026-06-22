import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import {
  MERCHANT_NOTIFICATION_CATEGORIES,
  parsePrefs,
  resolvePrefs,
} from '@/lib/merchant-notifications';

/**
 * GET /api/merchant/:slug/notifications
 *
 * Returns the catalog of notification categories plus the current
 * member's resolved preferences (defaults applied, required forced
 * on). UI uses this to render the settings form without having to
 * duplicate the category list.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'merchant_not_found' }, { status: 404 });
  }

  // merchant_staff can also read/change their own prefs.
  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    select: { notificationPrefs: true },
  });

  return NextResponse.json({
    categories: MERCHANT_NOTIFICATION_CATEGORIES,
    preferences: resolvePrefs(member?.notificationPrefs),
  });
}

const patchSchema = z.object({
  preferences: z.record(z.string(), z.boolean()),
});

/**
 * PATCH /api/merchant/:slug/notifications
 *
 * Merges the supplied category -> boolean map into the member's
 * stored prefs. We intentionally merge (rather than replace) so
 * future-added categories don't disappear from the payload clients
 * send back.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'merchant_not_found' }, { status: 404 });
  }

  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Drop unknown keys + required-category overrides — callers can't
  // opt out of legally required notifications.
  const allowed = new Map(
    MERCHANT_NOTIFICATION_CATEGORIES.map((c) => [c.key, c]),
  );
  const sanitized: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(parsed.data.preferences)) {
    const cat = allowed.get(key);
    if (!cat || cat.required) continue;
    sanitized[key] = value;
  }

  const existing = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    select: { notificationPrefs: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'not_a_member' }, { status: 404 });
  }

  const merged = { ...parsePrefs(existing.notificationPrefs), ...sanitized };

  await prisma.merchantMember.update({
    where: { merchantId_userId: { merchantId: merchant.id, userId: session.user.id } },
    data: { notificationPrefs: merged },
  });

  return NextResponse.json({ preferences: resolvePrefs(merged) });
}
