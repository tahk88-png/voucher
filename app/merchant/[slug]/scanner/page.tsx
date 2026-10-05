'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { ScanLine, Gift, CreditCard, Ticket, CheckCircle, Camera, CameraOff, Keyboard } from 'lucide-react';
import { formatPrice } from '@/lib/currency-constants';
import { formatDisplayDate, formatVoucherCode, formatVoucherValue, voucherHeadline } from '@/lib/voucher-display';

const VOUCHER_TYPES = ['percentage', 'fixed_amount', 'credit_amount'];
const VOUCHER_STATUSES = ['draft', 'published', 'paused', 'ended', 'expired'];
const GIFT_CARD_STATUSES = ['active', 'redeemed', 'expired', 'cancelled'];
const TICKET_STATUSES = ['available', 'sold', 'used', 'cancelled', 'refunded'];

type ScanResult = {
  type: 'voucher' | 'gift_card' | 'ticket';
  data: Record<string, any>;
};

export default function ScannerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('merchantStore.scanner');
  const tLabels = useTranslations('labels');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<'denied' | 'unavailable' | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScannedRef = useRef<string>('');

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    lastScannedRef.current = '';
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamic import so jsqr is only loaded on client when camera is used
    const jsQR = (await import('jsqr')).default;
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (qrCode && qrCode.data && qrCode.data !== lastScannedRef.current) {
      lastScannedRef.current = qrCode.data;
      setCode(qrCode.data);
      // Auto-trigger scan
      try {
        setScanning(true);
        const res = await fetch(`/api/merchant/${slug}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: qrCode.data }),
        });
        if (!res.ok) {
          const err = await res.json();
          showError(err.error || t('errors.notFound'));
          lastScannedRef.current = ''; // allow retry
        } else {
          const data = await res.json();
          setResult(data);
          stopCamera();
          setCameraMode(false);
        }
      } catch {
        showError(t('errors.scanFailed'));
        lastScannedRef.current = '';
      } finally {
        setScanning(false);
        return; // don't request another frame
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [slug, stopCamera, t]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.message === 'Permission denied';
      setCameraError(denied ? 'denied' : 'unavailable');
      setCameraMode(false);
    }
  }, [scanFrame]);

  // Phones at the till: open straight into camera mode when the device has a
  // camera. If permission is refused, startCamera falls back to manual entry.
  useEffect(() => {
    let cancelled = false;
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!md?.getUserMedia || !md.enumerateDevices) return;
    md.enumerateDevices()
      .then((devices) => {
        if (!cancelled && devices.some((d) => d.kind === 'videoinput')) setCameraMode(true);
      })
      .catch(() => {
        /* no camera info: stay in manual mode */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (cameraMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraMode, startCamera, stopCamera]);

  const handleScan = async () => {
    if (!code.trim()) {
      showError(t('errors.enterCode'));
      return;
    }
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/merchant/${slug}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('errors.notFound'));
      }
      const data = await res.json();
      setResult(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errors.scanFailed'));
    } finally {
      setScanning(false);
    }
  };

  const handleRedeem = async () => {
    if (!result) return;
    setRedeeming(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: result.type, id: result.data.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('errors.redeemFailed'));
      }
      showSuccess(t(`redeemed.${result.type === 'gift_card' ? 'gift_card' : result.type === 'ticket' ? 'ticket' : 'voucher'}`));
      setResult(null);
      setCode('');
    } catch (error) {
      showError(error instanceof Error ? error.message : t('errors.redeemFailed'));
    } finally {
      setRedeeming(false);
    }
  };

  const canRedeem = result && (
    (result.type === 'ticket' && result.data.status === 'sold') ||
    (result.type === 'gift_card' && result.data.status === 'active') ||
    (result.type === 'voucher' && result.data.status === 'published')
  );

  const cameraErrorText =
    cameraError === 'denied' ? t('cameraDenied') : cameraError === 'unavailable' ? t('cameraUnavailable') : null;

  const voucherStatusText = (status: string) =>
    VOUCHER_STATUSES.includes(status) ? tLabels(`voucherStatus.${status}`) : status;

  const statusText = result
    ? result.type === 'voucher'
      ? voucherStatusText(result.data.status)
      : result.type === 'gift_card' && GIFT_CARD_STATUSES.includes(result.data.status)
        ? t(`status.giftCard.${result.data.status}`)
        : result.type === 'ticket' && TICKET_STATUSES.includes(result.data.status)
          ? t(`status.ticket.${result.data.status}`)
          : result.data.status
    : '';

  const voucherName = (data: Record<string, any>) => {
    const headline = voucherHeadline(data as never);
    if (headline) return headline;
    const value = formatVoucherValue(data as never);
    return String(data.type).toLowerCase() === 'credit_amount'
      ? tLabels('valueCredit', { value })
      : tLabels('valueOff', { value });
  };

  const voucherTypeText = (type: string) =>
    VOUCHER_TYPES.includes(type.toLowerCase()) ? tLabels(`voucherType.${type.toLowerCase()}`) : type.replace(/_/g, ' ');

  const TypeIcon = result?.type === 'ticket' ? Ticket : result?.type === 'gift_card' ? CreditCard : Gift;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <WarmButton
          variant={!cameraMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCameraMode(false); setResult(null); }}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          {t('manual')}
        </WarmButton>
        <WarmButton
          variant={cameraMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCameraMode(true); setResult(null); setCode(''); }}
        >
          <Camera className="h-4 w-4 mr-2" />
          {t('camera')}
        </WarmButton>
      </div>

      {/* Camera view */}
      {cameraMode && (
        <WarmCard padding="none" className="bg-[var(--surface)] overflow-hidden">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Scanning overlay */}
            {cameraActive && !scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-[var(--primary)] rounded-2xl opacity-80">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--primary)] rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--primary)] rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--primary)] rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--primary)] rounded-br-xl" />
                </div>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <p className="text-white font-medium">{t('scanning')}</p>
              </div>
            )}
            {cameraErrorText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                <CameraOff className="h-10 w-10 text-white/60" />
                <p className="text-white text-sm">{cameraErrorText}</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-center text-[var(--text-muted)] p-3">
            {t('pointAtCode')}
          </p>
        </WarmCard>
      )}

      {/* Manual input */}
      {!cameraMode && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          {cameraErrorText && (
            <p className="mb-3 flex items-start gap-2 text-sm text-[var(--text-muted)]">
              <CameraOff className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {cameraErrorText}
            </p>
          )}
          <div className="flex items-center gap-2 mb-4">
            <ScanLine className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text)]">{t('enterCode')}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('codePlaceholder')}
              aria-label={t('codeAriaLabel')}
              autoCapitalize="characters"
              autoComplete="off"
              className="border-[var(--border)]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
            />
            <WarmButton onClick={handleScan} disabled={scanning || !code.trim()}>
              {scanning ? t('scanning') : t('scan')}
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {result && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-4">
            <TypeIcon className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text)]">{t(`found.${result.type}`)}</h2>
            <Badge variant={canRedeem ? 'default' : 'secondary'} className="ml-auto">
              {statusText}
            </Badge>
          </div>

          <div className="space-y-2 p-4 bg-[var(--surface-dim)] rounded-2xl">
            {result.type === 'ticket' && (
              <>
                <InfoRow label={t('info.ticketNumber')} value={result.data.ticketNumber} />
                <InfoRow label={t('info.event')} value={result.data.event?.name} />
                <InfoRow label={t('info.type')} value={result.data.ticketType || t('info.standard')} />
                {result.data.purchase?.attendeeName && (
                  <InfoRow label={t('info.attendee')} value={result.data.purchase.attendeeName} />
                )}
              </>
            )}
            {result.type === 'gift_card' && (
              <>
                <InfoRow label={t('info.code')} value={result.data.code} />
                <InfoRow label={t('info.amount')} value={formatPrice(result.data.amount, String(result.data.currency || 'EUR').toUpperCase(), 'en-GB')} />
                {result.data.message && <InfoRow label={t('info.message')} value={result.data.message} />}
              </>
            )}
            {result.type === 'voucher' && (
              <>
                <InfoRow label={t('info.voucher')} value={voucherName(result.data)} />
                <InfoRow label={t('info.code')} value={formatVoucherCode(result.data as never)} />
                <InfoRow label={t('info.campaign')} value={result.data.campaign?.name || t('info.none')} />
                <InfoRow label={t('info.type')} value={voucherTypeText(result.data.type)} />
                <InfoRow label={t('info.value')} value={formatVoucherValue(result.data as never)} />
                <InfoRow label={t('info.validUntil')} value={formatDisplayDate(result.data.validTo)} />
              </>
            )}
          </div>

          {canRedeem && (
            <WarmButton onClick={handleRedeem} disabled={redeeming} className="w-full mt-4" size="lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              {redeeming ? t('redeeming') : t('redeem')}
            </WarmButton>
          )}

          {!canRedeem && (
            <p className="text-sm text-[var(--text-muted)] mt-4 text-center">
              {t('cannotRedeem', { status: statusText })}
            </p>
          )}
        </WarmCard>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text)]">{label}:</span> {value}
    </p>
  );
}
