/**
 * AI-powered analytics: "Ask your data"
 *
 * Interprets natural language questions about merchant data,
 * builds Prisma queries, executes them, and formats results.
 *
 * Uses OpenAI GPT-4o-mini when available, falls back to keyword matching.
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChartType = 'number' | 'table' | 'bar' | 'line' | 'pie';

export interface AskResult {
  answer: string;
  data: unknown;
  chartType: ChartType;
  query?: string;
}

// ---------------------------------------------------------------------------
// Keyword-based fallback interpreter
// ---------------------------------------------------------------------------

interface ParsedIntent {
  metric: 'revenue' | 'redemptions' | 'vouchers' | 'customers' | 'referrals' | 'purchases';
  timeframe: { from: Date; to: Date; label: string };
  aggregation: 'total' | 'daily' | 'top';
}

function parseTimeframe(q: string): { from: Date; to: Date; label: string } {
  const now = new Date();
  const lower = q.toLowerCase();

  if (lower.includes('today')) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now, label: 'today' };
  }
  if (lower.includes('yesterday')) {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from, to, label: 'yesterday' };
  }
  if (lower.includes('last week') || lower.includes('past week')) {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now, label: 'last 7 days' };
  }
  if (lower.includes('last month') || lower.includes('past month')) {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 1);
    return { from, to: now, label: 'last 30 days' };
  }
  if (lower.includes('last quarter') || lower.includes('past quarter')) {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 3);
    return { from, to: now, label: 'last quarter' };
  }
  if (lower.includes('last year') || lower.includes('past year') || lower.includes('this year')) {
    const from = new Date(now);
    from.setFullYear(from.getFullYear() - 1);
    return { from, to: now, label: 'last year' };
  }

  // Default: last 30 days
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  return { from, to: now, label: 'last 30 days' };
}

function parseMetric(q: string): ParsedIntent['metric'] {
  const lower = q.toLowerCase();
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income') || lower.includes('money') || lower.includes('earned')) return 'revenue';
  if (lower.includes('redemption') || lower.includes('redeem')) return 'redemptions';
  if (lower.includes('voucher') || lower.includes('coupon')) return 'vouchers';
  if (lower.includes('customer') || lower.includes('user') || lower.includes('buyer')) return 'customers';
  if (lower.includes('referral') || lower.includes('refer')) return 'referrals';
  if (lower.includes('purchase') || lower.includes('order') || lower.includes('transaction')) return 'purchases';
  return 'revenue';
}

function parseAggregation(q: string): ParsedIntent['aggregation'] {
  const lower = q.toLowerCase();
  if (lower.includes('top') || lower.includes('best') || lower.includes('most popular')) return 'top';
  if (lower.includes('daily') || lower.includes('per day') || lower.includes('each day') || lower.includes('trend') || lower.includes('over time')) return 'daily';
  return 'total';
}

function parseKeywordIntent(question: string): ParsedIntent {
  return {
    metric: parseMetric(question),
    timeframe: parseTimeframe(question),
    aggregation: parseAggregation(question),
  };
}

// ---------------------------------------------------------------------------
// Query executor (keyword-based)
// ---------------------------------------------------------------------------

async function executeKeywordQuery(merchantId: string, intent: ParsedIntent): Promise<AskResult> {
  const { metric, timeframe, aggregation } = intent;
  const dateFilter = { gte: timeframe.from, lte: timeframe.to };

  switch (metric) {
    case 'revenue': {
      if (aggregation === 'daily') {
        const purchases = await prisma.voucherPurchase.findMany({
          where: { merchantId, status: 'paid', createdAt: dateFilter },
          select: { amount: true, createdAt: true, currency: true },
          orderBy: { createdAt: 'asc' },
        });

        const dailyMap = new Map<string, number>();
        for (const p of purchases) {
          const key = p.createdAt.toISOString().split('T')[0];
          dailyMap.set(key, (dailyMap.get(key) ?? 0) + p.amount);
        }

        const data = [...dailyMap.entries()].map(([date, amount]) => ({ date, amount: amount / 100 }));
        const total = purchases.reduce((s, p) => s + p.amount, 0) / 100;

        return {
          answer: `Daily revenue for ${timeframe.label}: total ${total.toFixed(2)}`,
          data,
          chartType: 'line',
        };
      }

      if (aggregation === 'top') {
        const vouchers = await prisma.voucher.findMany({
          where: { merchantId },
          include: {
            voucherPurchases: {
              where: { status: 'paid', createdAt: dateFilter },
              select: { amount: true },
            },
          },
          take: 10,
        });

        const data = vouchers
          .map((v) => ({
            name: v.type ?? v.id.slice(0, 8),
            revenue: v.voucherPurchases.reduce((s, p) => s + p.amount, 0) / 100,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return {
          answer: `Top vouchers by revenue (${timeframe.label})`,
          data,
          chartType: 'bar',
        };
      }

      // Total
      const result = await prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: dateFilter },
        _sum: { amount: true },
        _count: true,
      });

      const total = (result._sum.amount ?? 0) / 100;
      return {
        answer: `Total revenue for ${timeframe.label}: ${total.toFixed(2)} (${result._count} transactions)`,
        data: { total, transactions: result._count },
        chartType: 'number',
      };
    }

    case 'redemptions': {
      if (aggregation === 'daily') {
        const redemptions = await prisma.redemption.findMany({
          where: { merchantId, confirmedAt: { not: null, ...dateFilter } },
          select: { confirmedAt: true },
          orderBy: { confirmedAt: 'asc' },
        });

        const dailyMap = new Map<string, number>();
        for (const r of redemptions) {
          if (r.confirmedAt) {
            const key = r.confirmedAt.toISOString().split('T')[0];
            dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
          }
        }

        const data = [...dailyMap.entries()].map(([date, count]) => ({ date, count }));
        return {
          answer: `Daily redemptions for ${timeframe.label}: ${redemptions.length} total`,
          data,
          chartType: 'line',
        };
      }

      const count = await prisma.redemption.count({
        where: { merchantId, confirmedAt: { not: null, ...dateFilter } },
      });

      return {
        answer: `Total confirmed redemptions for ${timeframe.label}: ${count}`,
        data: { count },
        chartType: 'number',
      };
    }

    case 'vouchers': {
      const vouchers = await prisma.voucher.findMany({
        where: { merchantId, createdAt: dateFilter },
        include: { _count: { select: { redemptions: true } } },
        orderBy: { redemptions: { _count: 'desc' } },
        take: 10,
      });

      const data = vouchers.map((v) => ({
        id: v.id.slice(0, 8),
        type: v.type,
        redemptions: v._count.redemptions,
        status: v.status,
      }));

      return {
        answer: `Found ${vouchers.length} vouchers created in ${timeframe.label}`,
        data,
        chartType: 'table',
      };
    }

    case 'customers': {
      const purchases = await prisma.voucherPurchase.findMany({
        where: { merchantId, status: 'paid', createdAt: dateFilter },
        select: { userId: true },
        distinct: ['userId'],
      });

      return {
        answer: `${purchases.length} unique customers made purchases in ${timeframe.label}`,
        data: { uniqueCustomers: purchases.length },
        chartType: 'number',
      };
    }

    case 'referrals': {
      const [total, redeemed] = await Promise.all([
        prisma.referral.count({ where: { merchantId, createdAt: dateFilter } }),
        prisma.referral.count({ where: { merchantId, status: 'redeemed', createdAt: dateFilter } }),
      ]);

      const conversionRate = total > 0 ? Math.round((redeemed / total) * 100) : 0;
      return {
        answer: `Referrals in ${timeframe.label}: ${total} total, ${redeemed} redeemed (${conversionRate}% conversion)`,
        data: { total, redeemed, conversionRate },
        chartType: 'number',
      };
    }

    case 'purchases': {
      const result = await prisma.voucherPurchase.aggregate({
        where: { merchantId, createdAt: dateFilter },
        _count: true,
        _sum: { amount: true },
      });

      const paidResult = await prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: dateFilter },
        _count: true,
      });

      return {
        answer: `Purchases in ${timeframe.label}: ${result._count} total, ${paidResult._count} paid`,
        data: {
          total: result._count,
          paid: paidResult._count,
          totalAmount: (result._sum.amount ?? 0) / 100,
        },
        chartType: 'number',
      };
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI-based interpreter (enhanced)
// ---------------------------------------------------------------------------

async function interpretWithOpenAI(
  question: string,
  merchantId: string
): Promise<AskResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a data analyst for a voucher/gift card platform. The user asks questions about their merchant data.
Parse the question and return a JSON object with:
- metric: one of "revenue", "redemptions", "vouchers", "customers", "referrals", "purchases"
- timeframe: "today", "yesterday", "last_week", "last_month", "last_quarter", "last_year"
- aggregation: "total", "daily", "top"

Only return valid JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      max_tokens: 200,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content);

    const timeframeMap: Record<string, string> = {
      today: 'today',
      yesterday: 'yesterday',
      last_week: 'last week',
      last_month: 'last month',
      last_quarter: 'last quarter',
      last_year: 'last year',
    };

    const syntheticQuestion = `${parsed.aggregation ?? 'total'} ${parsed.metric ?? 'revenue'} ${timeframeMap[parsed.timeframe] ?? 'last month'}`;
    const intent = parseKeywordIntent(syntheticQuestion);

    return executeKeywordQuery(merchantId, intent);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function interpretQuery(
  question: string,
  merchantId: string
): Promise<AskResult> {
  // Try OpenAI first
  const aiResult = await interpretWithOpenAI(question, merchantId);
  if (aiResult) return aiResult;

  // Fallback to keyword matching
  const intent = parseKeywordIntent(question);
  return executeKeywordQuery(merchantId, intent);
}

export const SUGGESTED_QUESTIONS = [
  'What was my revenue last week?',
  'Show daily redemptions this month',
  'Top vouchers by revenue last month',
  'How many customers purchased last week?',
  'What is my referral conversion rate?',
  'Show daily revenue trend this month',
  'How many purchases were made yesterday?',
  'What are my best performing vouchers?',
];
