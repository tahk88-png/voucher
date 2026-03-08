'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import QRDownload from '@/components/qr-download';
import SocialShare from '@/components/social-share';
import { showSuccess, showInfo, showError } from '@/lib/toast-helpers';
import { sanitizeCssValue } from '@/lib/sanitize-css';
import { Copy, Share2, CreditCard, Gift, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VoucherClientProps {
  voucher: any;
  design: any;
  brandColors: any;
  voucherCode: string;
  qrCodeDataUrl: string;
  isAuthenticated: boolean;
  campaign?: any;
}

export default function VoucherClient({
  voucher,
  design,
  brandColors,
  voucherCode,
  qrCodeDataUrl,
  isAuthenticated,
  campaign,
}: VoucherClientProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [got, setGot] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const t = useTranslations('payment');
  const tVoucher = useTranslations('voucher');

  const brandBg = brandColors?.background || design?.backgroundColor || '#FFFBF5';
  const brandPrimary = brandColors?.primary || design?.primaryColor || '#2D2721';
  const brandText = brandColors?.text || '#FFFFFF';

  const hasPrice = campaign?.price !== null && campaign?.price !== undefined;
  const price = campaign?.price || 0;

  const handleGet = async () => {
    await navigator.clipboard.writeText(voucherCode);
    showSuccess(t('codeCopied'));
    setGot(true);
    setTimeout(() => setGot(false), 1500);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch(`/api/vouchers/${voucher.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t('purchaseFailed'));
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t('purchaseFailed'));
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : t('purchaseFailed'));
      setIsPurchasing(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    let url = window.location.href;
    if (isAuthenticated) {
      try {
        const res = await fetch('/api/referrals/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId: voucher.id }),
        });
        const data = await res.json();
        if (data.shareUrl) url = data.shareUrl;
      } catch {
        // fallback to public link
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: design?.headline || tVoucher('specialOffer'),
          text: `${tVoucher('checkOutVoucher')} ${voucher.merchant.name}`,
          url,
        });
        showSuccess(tVoucher('linkShared'));
      } catch {
        // ignored
      }
    } else {
      await navigator.clipboard.writeText(url);
      showInfo(tVoucher('linkCopied'));
    }
    setIsSharing(false);
  };

  const getVoucherValue = () => {
    if (voucher.type === 'percentage') return formatPercentage(voucher.value);
    return formatCurrency(voucher.value, voucher.currency);
  };

  const headline = design?.headline || tVoucher('specialOffer');
  const limitText = voucher.usageLimitTotal
    ? ` - ${tVoucher('firstUses', { count: voucher.usageLimitTotal })}`
    : '';

  const scope = `voucher-theme-${String(voucher.id).replace(/\\s/g, '')}`;

  return (
    <div
      className={`${scope} min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.${scope}{--brand-bg:${sanitizeCssValue(brandBg)};--brand-primary:${sanitizeCssValue(brandPrimary)};--brand-text:${sanitizeCssValue(brandText)}}`,
        }}
      />
      <WarmCard padding="none" className="w-full max-w-[420px] overflow-hidden bg-white">
        <div className="px-6 pt-6 pb-5" style={{ background: 'var(--brand-primary)' }}>
          {voucher.merchant.brandLogoUrl ? (
            <Image
              src={voucher.merchant.brandLogoUrl}
              alt={`${voucher.merchant.name} logo`}
              width={160}
              height={40}
              className="h-10 w-auto object-contain mb-4"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-[12px] bg-white/20 flex items-center justify-center mb-4">
              <Gift className="h-5 w-5 text-white" />
            </div>
          )}
          <p className="text-sm font-medium text-white/80">{voucher.merchant.name}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1 tracking-tight text-white">{headline}</h1>
          <p className="mt-3 text-3xl sm:text-4xl font-semibold tabular-nums text-white">{getVoucherValue()}</p>
        </div>

        <div className="p-6 pt-5 space-y-5">
          <p className="text-sm text-[#6B5744]">
            {tVoucher('validUntil')} {new Date(voucher.validTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            {limitText}
          </p>

          <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.15)]">
            <span className="font-mono text-lg font-semibold tracking-wide text-[#2D2721]">{voucherCode}</span>
            <WarmButton
              size="sm"
              variant="ghost"
              onClick={handleGet}
              className="shrink-0 h-9"
              aria-label="Copy voucher code"
            >
              {got ? <span className="text-[#9DB5A5] text-sm font-medium">{t('codeCopied')}</span> : <Copy className="h-4 w-4 text-[#8B7355]" />}
            </WarmButton>
          </div>

          {qrCodeDataUrl && (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[14px] border border-[rgba(139,115,85,0.15)] bg-white p-3 shadow-warm-sm">
                <Image
                  src={qrCodeDataUrl}
                  alt={`QR code for voucher ${voucherCode}`}
                  width={152}
                  height={152}
                  className="rounded-md"
                />
              </div>
              <QRDownload qrCodeDataUrl={qrCodeDataUrl} filename={`voucher-${voucher.id}`} />
            </div>
          )}

          {design?.finePrint && <p className="text-xs text-[#8B7355]">{design.finePrint}</p>}

          <div className="flex flex-col gap-2 pt-1">
            {hasPrice ? (
              <WarmButton
                className="w-full h-12 text-base font-medium"
                style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-text)' }}
                onClick={handlePurchase}
                disabled={isPurchasing}
                aria-label={isPurchasing ? t('processing') : t('purchaseFor', { amount: formatCurrency(price, voucher.currency) })}
              >
                <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                {isPurchasing ? t('processing') : t('purchaseFor', { amount: formatCurrency(price, voucher.currency) })}
              </WarmButton>
            ) : (
              <WarmButton
                className="w-full h-12 text-base font-medium"
                style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-text)' }}
                onClick={handleGet}
                aria-label={got ? t('codeCopied') : t('getVoucher')}
              >
                {got ? t('codeCopied') : t('getVoucher')}
              </WarmButton>
            )}
            {isAuthenticated && (
              <WarmButton
                variant="outline"
                className="w-full h-12"
                onClick={handleShare}
                disabled={isSharing}
                aria-label={isSharing ? t('preparing') : tVoucher('shareAndEarn')}
              >
                <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                {isSharing ? t('preparing') : tVoucher('shareAndEarn')}
              </WarmButton>
            )}
          </div>

          <div className="pt-4 border-t border-[rgba(139,115,85,0.15)]">
            <p className="text-sm font-medium mb-3 text-center text-[#6B5744]">Share on social media</p>
            <SocialShare
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={headline}
              description={`${getVoucherValue()} off at ${voucher.merchant.name}`}
              variant="outline"
              size="sm"
              className="justify-center"
            />
          </div>

          <p className="text-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-sm text-[#8B7355] hover:text-[#2D2721] underline-offset-2 hover:underline"
            >
              Print voucher
            </button>
          </p>
        </div>
      </WarmCard>
    </div>
  );
}
