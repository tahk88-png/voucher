import { NextRequest } from 'next/server';
import { auth } from './auth';
import { prisma } from './prisma';
import { UnauthorizedError, ForbiddenError, NotFoundError } from './error-handler';
import { checkIPRateLimit } from './fraud';

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Verify user has access to merchant
 * Returns merchant and user's role
 */
export async function verifyMerchantAccess(
  merchantId: string,
  userId: string,
  requiredRole?: 'admin' | 'staff'
) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, name: true, slug: true },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  const membership = await prisma.merchantMember.findUnique({
    where: {
      merchantId_userId: {
        merchantId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new ForbiddenError('Access to this merchant not allowed');
  }

  // Check role requirement
  if (requiredRole === 'admin' && membership.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return {
    merchant,
    role: membership.role,
  };
}

/**
 * Verify user owns a resource or is merchant admin
 */
export async function verifyResourceOwnership(
  resourceUserId: string,
  currentUserId: string,
  merchantId?: string
) {
  // User owns the resource
  if (resourceUserId === currentUserId) {
    return true;
  }

  // If merchantId provided, check if user is merchant admin
  if (merchantId) {
    const membership = await prisma.merchantMember.findUnique({
      where: {
        merchantId_userId: {
          merchantId,
          userId: currentUserId,
        },
      },
      select: { role: true },
    });

    if (membership && membership.role === 'admin') {
      return true;
    }
  }

  throw new ForbiddenError('You do not have permission to access this resource');
}

/**
 * Verify user is platform admin
 */
export async function verifyPlatformAdmin(userId: string) {
  const adminEmails = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user || !user.email || !adminEmails.includes(user.email)) {
    throw new ForbiddenError('Platform admin access required');
  }

  return true;
}

/**
 * Apply IP-based rate limiting
 */
export async function applyIPRateLimit(
  req: NextRequest,
  maxAttempts: number = 100,
  windowMinutes: number = 60
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';

  const { allowed, remaining } = await checkIPRateLimit(ip, windowMinutes, maxAttempts);

  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  return { ip, remaining };
}

/**
 * Get merchant from slug or ID
 */
export async function getMerchantBySlugOrId(slugOrId: string) {
  const merchant = await prisma.merchant.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId },
      ],
    },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found');
  }

  return merchant;
}

/**
 * Verify voucher ownership by merchant
 */
export async function verifyVoucherOwnership(voucherId: string, merchantId: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    select: { id: true, merchantId: true },
  });

  if (!voucher) {
    throw new NotFoundError('Voucher not found');
  }

  if (voucher.merchantId !== merchantId) {
    throw new ForbiddenError('You do not have permission to access this voucher');
  }

  return voucher;
}

/**
 * Verify campaign ownership by merchant
 */
export async function verifyCampaignOwnership(campaignId: string, merchantId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, merchantId: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  if (campaign.merchantId !== merchantId) {
    throw new ForbiddenError('You do not have permission to access this campaign');
  }

  return campaign;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse sort parameters
 */
export function parseSortParams(searchParams: URLSearchParams, allowedFields: string[]) {
  const sortBy = searchParams.get('sortBy') || allowedFields[0];
  const sortOrder = searchParams.get('sortOrder')?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  if (!allowedFields.includes(sortBy)) {
    return { [allowedFields[0]]: sortOrder };
  }

  return { [sortBy]: sortOrder };
}
