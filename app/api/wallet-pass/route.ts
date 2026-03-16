import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPassData, generateApplePass, generateGooglePassJwt } from '@/lib/wallet-passes';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, platform } = body as {
      type?: 'voucher' | 'ticket' | 'gift_card';
      id?: string;
      platform?: 'apple' | 'google';
    };

    if (!type || !id || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, platform' },
        { status: 400 }
      );
    }

    if (!['voucher', 'ticket', 'gift_card'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!['apple', 'google'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Check for existing active pass
    const existingPass = await prisma.walletPass.findFirst({
      where: {
        userId: session.user.id,
        passType: platform,
        isActive: true,
        ...(type === 'voucher' ? { voucherId: id } : {}),
        ...(type === 'ticket' ? { ticketId: id } : {}),
        ...(type === 'gift_card' ? { giftCardId: id } : {}),
      },
    });

    if (existingPass) {
      return NextResponse.json({
        pass: existingPass.passData,
        walletPassId: existingPass.id,
        alreadyExists: true,
      });
    }

    // Fetch the item data
    const passData = await getPassData(type, id);

    // Generate platform-specific pass
    const generatedPass =
      platform === 'apple'
        ? generateApplePass(passData)
        : generateGooglePassJwt(passData);

    const serialNumber =
      platform === 'apple'
        ? (generatedPass as ReturnType<typeof generateApplePass>).serialNumber
        : `google-${type}-${id}-${Date.now()}`;

    // Create WalletPass record
    const walletPass = await prisma.walletPass.create({
      data: {
        userId: session.user.id,
        passType: platform,
        serialNumber,
        passData: generatedPass as object,
        ...(type === 'voucher' ? { voucherId: id } : {}),
        ...(type === 'ticket' ? { ticketId: id } : {}),
        ...(type === 'gift_card' ? { giftCardId: id } : {}),
      },
    });

    return NextResponse.json({
      pass: generatedPass,
      walletPassId: walletPass.id,
      // In production, this would return:
      // - Apple: .pkpass binary file (application/vnd.apple.pkpass)
      // - Google: save URL like https://pay.google.com/gp/v/save/{jwt}
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
