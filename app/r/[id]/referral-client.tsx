'use client';

import { useState, useRef } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { showSuccess } from '@/lib/toast-helpers';
import { Smartphone } from 'lucide-react';
import SocialShare from '@/components/social-share';
import { useTranslations } from 'next-intl';

interface ReferralClientProps {
  referral: any;
  voucher: any;
  design: any;
  brandColors: any;
  voucherCode: string;
  qrCodeDataUrl: string;
  isAuthenticated: boolean;
  isSelfReferral: boolean;
}

export default function ReferralClient({
  referral,
  voucher,
  design,
  brandColors,
  voucherCode,
  qrCodeDataUrl,
  isSelfReferral,
}: ReferralClientProps) {
  const tPlaceholder = useTranslations('placeholders');
  const tReferral = useTranslations('referral');
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);
  const [orderAmount, setOrderAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [qrImage, setQrImage] = useState(qrCodeDataUrl || '');

  const brandBg = brandColors?.background || design?.backgroundColor || '#FFFBF5';
  const brandPrimary = brandColors?.primary || design?.primaryColor || '#2D2721';

  const getVoucherValue = () => {
    if (voucher.type === 'percentage') return formatPercentage(voucher.value);
    return formatCurrency(voucher.value, voucher.currency);
  };

  const calculateDiscount = (amount: number) => {
    if (voucher.type === 'percentage') {
      return Math.floor((amount * voucher.value) / 10000);
    }
    return Math.min(voucher.value, amount);
  };

  const handleRedeem = async (method: 'online' | 'in_store') => {
    if (isSelfReferral) {
      setError(tReferral('cannotRedeemOwn'));
      return;
    }
    setIsRedeeming(true);
    setError('');
    try {
      const amount = method === 'online' ? parseInt(orderAmount, 10) * 100 : 10000;
      const discount = calculateDiscount(amount);
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: voucher.id,
          referralId: referral.id,
          method,
          amountBeforeDiscount: amount,
          discountApplied: discount,
          currency: voucher.currency,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tReferral('redemptionFailed'));
      if (method === 'in_store') {
        showSuccess(tReferral('showQrToStaff'));
        if (data.qrUrl) {
          const qrRes = await fetch(`/api/qr?text=${encodeURIComponent(data.qrUrl)}`);
          const qrData = await qrRes.json();
          if (qrRes.ok && qrData.dataUrl) {
            setQrImage(qrData.dataUrl);
          }
        }
        qrRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        showSuccess(
          tReferral('discountApplied', { amount: formatCurrency(discount, voucher.currency) })
        );
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tReferral('redemptionFailed'));
    } finally {
      setIsRedeeming(false);
    }
  };

  const headline = design?.headline || tReferral('specialOffer');
  const fromName = referral.referrer?.name || tReferral('aFriend');
  const scope = `ref-${String(referral.id).replace(/\s/g, '')}`;

  return (
    <div
      className={`${scope} min-h-screen flex flex-col items-center p-4 sm:p-6 pb-10 bg-[var(--brand-bg)]`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.${scope}{--brand-bg:${brandBg};--brand-primary:${brandPrimary}}`,
        }}
      />
      <p className="text-sm text-[#6B5744] mt-2 mb-4 text-center">
        {tReferral('voucherFrom')} <span className="font-medium text-[#2D2721]">{fromName}</span>
      </p>

      <WarmCard padding="none" className="w-full max-w-[400px] shadow-warm bg-white overflow-hidden">
        <div className="rounded-t-[20px] px-6 pt-6 pb-5" style={{ background: 'var(--brand-primary)' }}>
          {voucher.merchant.brandLogoUrl && (
            <Image
              src={voucher.merchant.brandLogoUrl}
              alt={`${voucher.merchant.name} logo`}
              width={160}
              height={40}
              className="h-10 w-auto object-contain mb-4"
              unoptimized
            />
          )}
          <p className="text-sm font-medium text-white/80">{voucher.merchant.name}</p>
          <h1 className="text-2xl font-semibold mt-1 tracking-tight text-white">{headline}</h1>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-white">{getVoucherValue()}</p>
        </div>

        <div className="p-6 pt-5 space-y-5">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.15)]">
            <span className="font-mono text-base font-semibold tracking-wide text-[#2D2721]">
              {voucherCode}
            </span>
          </div>

          <p className="text-xs text-[#6B5744] flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            {tReferral('noAppRequired')}
          </p>

          {error && (
            <div className="bg-[#FCE8DD] text-[#8B4B39] text-sm p-3 rounded-lg" role="alert">
              {error}
            </div>
          )}

          {isSelfReferral ? (
            <p className="text-sm text-[#6B5744] text-center py-2">
              {tReferral('cannotRedeemOwn')}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderAmount" className="text-sm font-medium">
                  {tReferral('orderAmountLabel')}
                </Label>
                <Input
                  id="orderAmount"
                  type="number"
                  placeholder={tPlaceholder('orderAmount')}
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  disabled={isRedeeming}
                  className="mt-2 h-11 border-[rgba(139,115,85,0.15)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <WarmButton
                  className="w-full h-12 text-base font-medium"
                  onClick={() => handleRedeem('online')}
                  disabled={!orderAmount || isRedeeming}
                  aria-label={isRedeeming ? tReferral('processing') : tReferral('useOnline')}
                  style={{ backgroundColor: 'var(--brand-primary)', color: '#ffffff' }}
                >
                  {isRedeeming ? tReferral('processing') : tReferral('useOnline')}
                </WarmButton>
                <WarmButton
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => handleRedeem('in_store')}
                  disabled={isRedeeming}
                  aria-label={isRedeeming ? tReferral('processing') : tReferral('showQrInStore')}
                >
                  {isRedeeming ? tReferral('processing') : tReferral('showQrInStore')}
                </WarmButton>
              </div>
            </div>
          )}

          <div ref={qrRef} className="flex flex-col items-center gap-2 pt-2">
            {qrImage && (
              <>
                <p className="text-sm text-[#6B5744]">{tReferral('showQrAtRegister')}</p>
                <Image
                  src={qrImage}
                  alt={`Redemption QR code for voucher ${voucherCode}`}
                  width={200}
                  height={200}
                  className="rounded-lg border border-[rgba(139,115,85,0.15)]"
                />
              </>
            )}
          </div>

          <div className="pt-4 border-t border-[rgba(139,115,85,0.15)]">
            <p className="text-sm font-medium mb-3 text-center text-[#6B5744]">
              Share on social media
            </p>
            <SocialShare
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={headline}
              description={`${getVoucherValue()} off at ${voucher.merchant.name}${referral ? ' - Shared by a friend!' : ''}`}
              variant="outline"
              size="sm"
              className="justify-center"
            />
          </div>

          <p className="text-sm text-[#6B5744]">
            {tReferral('validUntil')}{' '}
            {new Date(voucher.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
          {design?.finePrint && <p className="text-xs text-[#8B7355]">{design.finePrint}</p>}
        </div>
      </WarmCard>
    </div>
  );
}
