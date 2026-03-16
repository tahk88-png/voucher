import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMerchantReport, formatReportAsHtml } from '@/lib/report-generator';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/scheduled-reports — cron endpoint that finds due reports,
 * generates data, and sends via Resend.
 *
 * Secured via CRON_SECRET header to prevent unauthorized invocation.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results: Array<{ merchantId: string; period: string; status: string; error?: string }> = [];

  try {
    // Find all report schedule settings
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'report_schedules_' } },
    });

    const resendKey = process.env.RESEND_API_KEY;
    const resend = resendKey ? new Resend(resendKey) : null;
    const fromEmail = process.env.EMAIL_FROM ?? 'reports@gifthub.ee';

    for (const setting of settings) {
      const merchantId = setting.key.replace('report_schedules_', '');
      let schedules: any[];

      try {
        schedules = JSON.parse(setting.value as string);
      } catch {
        continue;
      }

      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        // Check if due
        const nextRun = schedule.nextRunAt ? new Date(schedule.nextRunAt) : null;
        if (!nextRun || nextRun > now) continue;

        try {
          // Generate report
          const reportData = await generateMerchantReport(merchantId, schedule.period);
          const html = formatReportAsHtml(reportData);

          // Send via Resend
          if (resend && schedule.recipients?.length > 0) {
            await resend.emails.send({
              from: fromEmail,
              to: schedule.recipients,
              subject: `${reportData.merchantName} — ${schedule.period} report (${reportData.period.label})`,
              html,
            });
          }

          // Update schedule timestamps
          schedule.lastSentAt = now.toISOString();

          // Calculate next run
          const next = new Date(now);
          switch (schedule.period) {
            case 'daily':
              next.setDate(next.getDate() + 1);
              next.setHours(8, 0, 0, 0);
              break;
            case 'weekly':
              next.setDate(next.getDate() + 7);
              next.setHours(8, 0, 0, 0);
              break;
            case 'monthly':
              next.setMonth(next.getMonth() + 1);
              next.setDate(1);
              next.setHours(8, 0, 0, 0);
              break;
          }
          schedule.nextRunAt = next.toISOString();

          results.push({ merchantId, period: schedule.period, status: 'sent' });
        } catch (err) {
          results.push({
            merchantId,
            period: schedule.period,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      // Save updated schedules
      try {
        await prisma.systemSetting.update({
          where: { key: setting.key },
          data: { value: JSON.stringify(schedules) },
        });
      } catch {
        // ignore
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process scheduled reports', details: err instanceof Error ? err.message : undefined },
      { status: 500 }
    );
  }

  return NextResponse.json({
    processed: results.length,
    results,
    timestamp: now.toISOString(),
  });
}
