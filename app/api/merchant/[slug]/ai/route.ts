import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { generateAiJson, isAiConfigured } from '@/lib/ai';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const aiRequestSchema = z.object({
  purpose: z.enum([
    'campaign_copy',
    'voucher_copy',
    'gift_card_copy',
    'newsletter_draft',
    'builder_layout',
    'ops_assistant',
  ]),
  language: z.string().min(2).max(8).optional(),
  tone: z.string().max(80).optional(),
  brandName: z.string().max(120).optional(),
  campaignName: z.string().max(120).optional(),
  offer: z.string().max(200).optional(),
  audience: z.string().max(200).optional(),
  description: z.string().max(800).optional(),
  callToAction: z.string().max(120).optional(),
  points: z.array(z.string().max(140)).max(6).optional(),
  pageType: z.enum(['store', 'rental']).optional(),
  availableSections: z.array(z.string().max(40)).max(30).optional(),
  availableAddons: z.array(z.string().max(40)).max(30).optional(),
  goal: z.string().max(400).optional(),
});

const responseSchemas = {
  campaign_copy: z.object({
    headline: z.string().min(2).max(120),
    subheadline: z.string().min(2).max(160),
    description: z.string().min(2).max(600),
    terms: z.string().min(2).max(400),
  }),
  voucher_copy: z.object({
    headline: z.string().min(2).max(120),
    finePrint: z.string().min(2).max(240),
    cta: z.string().min(2).max(80),
  }),
  gift_card_copy: z.object({
    headline: z.string().min(2).max(120),
    message: z.string().min(2).max(280),
    terms: z.string().min(2).max(240),
  }),
  newsletter_draft: z.object({
    subject: z.string().min(2).max(120),
    preview: z.string().min(2).max(160),
    body: z.string().min(2).max(1500),
  }),
  builder_layout: z.object({
    title: z.string().min(2).max(80),
    subtitle: z.string().min(2).max(160),
    sections: z.array(z.string().min(2).max(40)).min(4).max(16),
    addons: z.array(z.string().min(2).max(40)).max(12),
  }),
  ops_assistant: z.object({
    title: z.string().min(2).max(120),
    steps: z.array(
      z.object({
        task: z.string().min(2).max(160),
        outcome: z.string().min(2).max(160).optional(),
      })
    ).min(3).max(12),
  }),
};

function buildPrompt(data: z.infer<typeof aiRequestSchema>) {
  const language = data.language || 'en';
  const tone = data.tone || 'warm, confident, concise';
  const brandName = data.brandName || 'the merchant';
  const campaignName = data.campaignName || 'campaign';
  const offer = data.offer || 'a special offer';
  const audience = data.audience || 'local customers';
  const description = data.description || '';
  const points = data.points?.length ? `Key points: ${data.points.join('; ')}.` : '';
  const cta = data.callToAction || 'Claim offer';
  const pageType = data.pageType || 'store';
  const availableSections = data.availableSections?.length
    ? `Available sections: ${data.availableSections.join(', ')}.`
    : '';
  const availableAddons = data.availableAddons?.length
    ? `Available add-ons: ${data.availableAddons.join(', ')}.`
    : '';
  const goal = data.goal || 'Launch the page efficiently.';

  let system = `You write short marketing copy for a voucher platform. Output valid JSON only.`;
  let user = '';

  if (data.purpose === 'campaign_copy') {
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Campaign: ${campaignName}. Offer: ${offer}. Audience: ${audience}. ${points} ${description}`;
  }
  if (data.purpose === 'voucher_copy') {
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Offer: ${offer}. Audience: ${audience}. CTA: ${cta}. ${points} ${description}`;
  }
  if (data.purpose === 'gift_card_copy') {
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Gift card for ${audience}. Offer: ${offer}. ${points} ${description}`;
  }
  if (data.purpose === 'newsletter_draft') {
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Campaign: ${campaignName}. Offer: ${offer}. Audience: ${audience}. CTA: ${cta}. ${points} ${description}`;
  }
  if (data.purpose === 'builder_layout') {
    system = `You are a product designer generating a page layout plan. Output valid JSON only with: title, subtitle, sections (array of IDs), addons (array of IDs). Use only IDs from the provided lists.`;
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Page type: ${pageType}. ${availableSections} ${availableAddons} Provide 6-10 sections and 3-6 add-ons.`;
  }
  if (data.purpose === 'ops_assistant') {
    system = `You are an operations assistant. Output valid JSON only with: title, steps (array of {task, outcome}). Keep it concise and actionable.`;
    user = `Language: ${language}. Tone: ${tone}. Brand: ${brandName}. Goal: ${goal}.`;
  }

  return { system, user };
}

async function enforceUsageLimit(params: {
  userId: string;
  merchantId: string;
  purpose: string;
}) {
  const limitByPurpose: Record<
    string,
    { action: string; limit: number; windowHours: number }
  > = {
    builder_layout: {
      action: 'ai.vibe_builder',
      limit: Number(process.env.AI_VIBE_LIMIT || 5),
      windowHours: Number(process.env.AI_VIBE_WINDOW_HOURS || 24),
    },
    ops_assistant: {
      action: 'ai.ops_assistant',
      limit: Number(process.env.AI_AGENT_LIMIT || 20),
      windowHours: Number(process.env.AI_AGENT_WINDOW_HOURS || 24),
    },
  };

  const config = limitByPurpose[params.purpose];
  if (!config) return { allowed: true } as const;

  const windowStart = new Date(Date.now() - config.windowHours * 60 * 60 * 1000);
  const used = await prisma.auditLog.count({
    where: {
      merchantId: params.merchantId,
      actorUserId: params.userId,
      action: config.action,
      createdAt: { gte: windowStart },
    },
  });

  const remaining = Math.max(0, config.limit - used);
  const resetAt = new Date(windowStart.getTime() + config.windowHours * 60 * 60 * 1000);
  return {
    allowed: used < config.limit,
    remaining,
    limit: config.limit,
    resetAt: resetAt.toISOString(),
    action: config.action,
  } as const;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandler(async () => {
    if (!isAiConfigured()) {
      return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });
    }

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

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const body = await req.json();
    const data = aiRequestSchema.parse(body);
    if (data.purpose === 'builder_layout' && (!data.availableSections || !data.availableAddons)) {
      return NextResponse.json({ error: 'Available sections and add-ons are required' }, { status: 400 });
    }
    if (data.purpose === 'ops_assistant' && !data.goal) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    const usage = await enforceUsageLimit({
      userId: session.user.id,
      merchantId: merchant.id,
      purpose: data.purpose,
    });
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'AI usage limit reached', usage: { remaining: usage.remaining, limit: usage.limit, resetAt: usage.resetAt } },
        { status: 429 }
      );
    }

    const prompt = buildPrompt(data);

    const aiJson = await generateAiJson(prompt);
    const parsed = JSON.parse(aiJson);
    const schema = responseSchemas[data.purpose];
    const content = schema.parse(parsed);

    const action =
      data.purpose === 'builder_layout'
        ? 'ai.vibe_builder'
        : data.purpose === 'ops_assistant'
        ? 'ai.ops_assistant'
        : 'ai.copy_generated';

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: session.user.id,
        action,
        payloadJson: {
          purpose: data.purpose,
          language: data.language || 'en',
          pageType: data.pageType,
        },
      },
    });

    return NextResponse.json({
      content,
      usage:
        usage && 'remaining' in usage
          ? { remaining: usage.remaining, limit: usage.limit, resetAt: usage.resetAt }
          : null,
    });
  });
}
