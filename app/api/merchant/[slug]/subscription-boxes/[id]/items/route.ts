import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

type Params = Promise<{ slug: string; id: string }>;

const addItemSchema = z.object({
  voucherId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
});

async function requireBoxAdmin(slug: string, boxId: string, userId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) return { error: NextResponse.json({ error: 'Merchant not found' }, { status: 404 }) };

  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId: merchant.id, userId } },
  });
  if (!member || member.role !== 'merchant_admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const box = await prisma.subscriptionBox.findFirst({ where: { id: boxId, merchantId: merchant.id } });
  if (!box) return { error: NextResponse.json({ error: 'Box not found' }, { status: 404 }) };

  return { merchant, box };
}

// GET — list items in the box (merchant-admin)
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;
    const ctx = await requireBoxAdmin(slug, id, session.user.id);
    if ('error' in ctx) return ctx.error;

    const items = await prisma.boxItem.findMany({
      where: { boxId: id },
      include: { voucher: { select: { id: true, type: true, value: true, currency: true } } },
      orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ items });
  });
}

// POST — add a voucher to the box for a given delivery month (merchant-admin)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;
    const ctx = await requireBoxAdmin(slug, id, session.user.id);
    if ('error' in ctx) return ctx.error;
    const { merchant, box } = ctx;

    const parsed = addItemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { voucherId, month } = parsed.data;

    // The voucher must belong to this merchant.
    const voucher = await prisma.voucher.findFirst({
      where: { id: voucherId, merchantId: merchant.id },
      select: { id: true },
    });
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found for this merchant' }, { status: 404 });
    }

    // Respect the box's per-month capacity (maxItems).
    const monthCount = await prisma.boxItem.count({ where: { boxId: id, month } });
    if (monthCount >= box.maxItems) {
      return NextResponse.json(
        { error: `This box allows at most ${box.maxItems} item(s) per month.` },
        { status: 400 },
      );
    }

    // Avoid duplicate (same voucher, same month).
    const existing = await prisma.boxItem.findFirst({ where: { boxId: id, voucherId, month } });
    if (existing) {
      return NextResponse.json({ error: 'This voucher is already in the box for that month.' }, { status: 409 });
    }

    const item = await prisma.boxItem.create({
      data: { boxId: id, voucherId, month },
      include: { voucher: { select: { id: true, type: true, value: true, currency: true } } },
    });
    return NextResponse.json({ item }, { status: 201 });
  });
}

// DELETE — remove an item from the box by ?itemId= (merchant-admin)
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;
    const ctx = await requireBoxAdmin(slug, id, session.user.id);
    if ('error' in ctx) return ctx.error;

    const itemId = new URL(req.url).searchParams.get('itemId');
    if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

    // Scope the delete to this box so a member can't delete another box's item.
    const result = await prisma.boxItem.deleteMany({ where: { id: itemId, boxId: id } });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  });
}
