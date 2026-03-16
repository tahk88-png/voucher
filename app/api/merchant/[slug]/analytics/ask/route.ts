import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { interpretQuery, SUGGESTED_QUESTIONS } from '@/lib/ai-analytics';

export const dynamic = 'force-dynamic';

/**
 * POST /api/merchant/[slug]/analytics/ask
 *
 * AI-powered analytics: interpret natural language question and return answer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const body = await req.json();
    const { question } = body as { question: string };

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a question (minimum 3 characters)' },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const result = await interpretQuery(question.trim(), merchant.id);

    return NextResponse.json({
      question: question.trim(),
      ...result,
      suggestedQuestions: SUGGESTED_QUESTIONS,
    });
  });
}
