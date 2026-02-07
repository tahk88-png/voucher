import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

export const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  name?: string;
}

export interface TestMerchant {
  id: string;
  slug: string;
  name: string;
}

export async function createTestUser(email: string = 'test@example.com'): Promise<TestUser> {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Test User',
    },
  });
  return {
    ...user,
    name: user.name || undefined,
  };
}

export async function createTestMerchant(slug: string = 'test-merchant'): Promise<TestMerchant> {
  const merchant = await prisma.merchant.upsert({
    where: { slug },
    update: {},
    create: {
      name: 'Test Merchant',
      slug,
      country: 'US',
      defaultCurrency: 'USD',
      isActive: true,
    },
  });
  return merchant;
}

export async function createMerchantMember(
  userId: string,
  merchantId: string,
  role: 'merchant_admin' | 'merchant_staff' = 'merchant_admin'
) {
  await prisma.merchantMember.upsert({
    where: {
      merchantId_userId: {
        merchantId,
        userId,
      },
    },
    update: { role },
    create: {
      merchantId,
      userId,
      role,
    },
  });
}

export function createMockRequest(body?: any, headers?: Record<string, string>): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const request = new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return request;
}

export async function cleanupTestData(merchantId: string, userId?: string) {
  await prisma.creditUsage.deleteMany({ where: { merchantId } });
  await prisma.creditLedger.deleteMany({ where: { merchantId } });
  await prisma.redemption.deleteMany({ where: { merchantId } });
  await prisma.referral.deleteMany({ where: { merchantId } });
  await prisma.voucherPurchase.deleteMany({ where: { merchantId } });
  await prisma.voucher.deleteMany({ where: { merchantId } });
  await prisma.campaign.deleteMany({ where: { merchantId } });
  await prisma.merchantMember.deleteMany({ where: { merchantId } });
  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.merchant.deleteMany({ where: { id: merchantId } });
}
