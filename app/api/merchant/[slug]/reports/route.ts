import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

/**
 * GET /api/merchant/[slug]/reports — list scheduled reports
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    // Use system settings or a metadata field to store report schedules
    let schedules: Array<{
      id: string;
      period: string;
      recipients: string[];
      enabled: boolean;
      lastSentAt: string | null;
      nextRunAt: string | null;
      createdAt: string;
    }> = [];

    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `report_schedules_${merchant.id}` },
      });
      if (setting?.value) {
        schedules = JSON.parse(setting.value as string);
      }
    } catch {
      // Table/setting may not exist
    }

    return NextResponse.json({ schedules });
  });
}

/**
 * POST /api/merchant/[slug]/reports — create/update a scheduled report
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const { period, recipients, enabled } = body as {
      period: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      enabled?: boolean;
    };

    if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'period must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients must be a non-empty array of email addresses' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((e) => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate next run
    const now = new Date();
    let nextRunAt: Date;
    switch (period) {
      case 'daily':
        nextRunAt = new Date(now);
        nextRunAt.setDate(nextRunAt.getDate() + 1);
        nextRunAt.setHours(8, 0, 0, 0);
        break;
      case 'weekly':
        nextRunAt = new Date(now);
        nextRunAt.setDate(nextRunAt.getDate() + (7 - nextRunAt.getDay() + 1) % 7 || 7);
        nextRunAt.setHours(8, 0, 0, 0);
        break;
      case 'monthly':
        nextRunAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
        break;
    }

    // Load existing schedules
    let schedules: any[] = [];
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `report_schedules_${merchant.id}` },
      });
      if (setting?.value) {
        schedules = JSON.parse(setting.value as string);
      }
    } catch {
      // ignore
    }

    // Upsert schedule for this period
    const existingIdx = schedules.findIndex((s: any) => s.period === period);
    const schedule = {
      id: existingIdx >= 0 ? schedules[existingIdx].id : crypto.randomUUID(),
      period,
      recipients,
      enabled: enabled !== false,
      lastSentAt: existingIdx >= 0 ? schedules[existingIdx].lastSentAt : null,
      nextRunAt: nextRunAt.toISOString(),
      createdAt: existingIdx >= 0 ? schedules[existingIdx].createdAt : now.toISOString(),
    };

    if (existingIdx >= 0) {
      schedules[existingIdx] = schedule;
    } else {
      schedules.push(schedule);
    }

    try {
      await prisma.systemSetting.upsert({
        where: { key: `report_schedules_${merchant.id}` },
        update: { value: JSON.stringify(schedules) },
        create: {
          key: `report_schedules_${merchant.id}`,
          value: JSON.stringify(schedules),
        },
      });
    } catch {
      // ignore if table doesn't exist
    }

    return NextResponse.json({ schedule });
  });
}
