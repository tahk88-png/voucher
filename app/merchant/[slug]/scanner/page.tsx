'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { ScanLine, Gift, CreditCard, Ticket, CheckCircle, Camera, CameraOff, Keyboard } from 'lucide-react';

type ScanResult = {
  type: 'voucher' | 'gift_card' | 'ticket';
  data: Record<string, any>;
};

export default function ScannerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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
          showError(err.error || 'Not found');
          lastScannedRef.current = ''; // allow retry
        } else {
          const data = await res.json();
          setResult(data);
          stopCamera();
          setCameraMode(false);
        }
      } catch {
        showError('Scan failed');
        lastScannedRef.current = '';
      } finally {
        setScanning(false);
        return; // don't request another frame
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [slug, stopCamera]);

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
      setCameraError(err?.message === 'Permission denied' ? 'Camera access denied' : 'Camera not available');
      setCameraMode(false);
    }
  }, [scanFrame]);

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
      showError('Please enter a code');
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
        throw new Error(err.error || 'Not found');
      }
      const data = await res.json();
      setResult(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Scan failed');
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
        throw new Error(err.error || 'Redeem failed');
      }
      showSuccess(`${result.type === 'gift_card' ? 'Gift card' : result.type === 'ticket' ? 'Ticket' : 'Voucher'} redeemed successfully!`);
      setResult(null);
      setCode('');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Redeem failed');
    } finally {
      setRedeeming(false);
    }
  };

  const canRedeem = result && (
    (result.type === 'ticket' && result.data.status === 'sold') ||
    (result.type === 'gift_card' && result.data.status === 'active') ||
    (result.type === 'voucher' && result.data.status === 'published')
  );

  const TypeIcon = result?.type === 'ticket' ? Ticket : result?.type === 'gift_card' ? CreditCard : Gift;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Scanner</h1>
        <p className="text-sm text-[var(--text-muted)]">Scan vouchers, gift cards, and tickets</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <WarmButton
          variant={!cameraMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCameraMode(false); setResult(null); }}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual
        </WarmButton>
        <WarmButton
          variant={cameraMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCameraMode(true); setResult(null); setCode(''); }}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
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
                <p className="text-white font-medium">Scanning...</p>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                <CameraOff className="h-10 w-10 text-white/60" />
                <p className="text-white text-sm">{cameraError}</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-center text-[var(--text-muted)] p-3">
            Point at a QR code to scan automatically
          </p>
        </WarmCard>
      )}

      {/* Manual input */}
      {!cameraMode && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-4">
            <ScanLine className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text)]">Enter code</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="QR code, ticket number, or gift card code"
              className="border-[var(--border)]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
            />
            <WarmButton onClick={handleScan} disabled={scanning || !code.trim()}>
              {scanning ? 'Scanning...' : 'Scan'}
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {result && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-4">
            <TypeIcon className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text)] capitalize">{result.type.replace('_', ' ')} found</h2>
            <Badge variant={canRedeem ? 'default' : 'secondary'} className="ml-auto">
              {result.data.status}
            </Badge>
          </div>

          <div className="space-y-2 p-4 bg-[var(--surface-dim)] rounded-2xl">
            {result.type === 'ticket' && (
              <>
                <InfoRow label="Ticket #" value={result.data.ticketNumber} />
                <InfoRow label="Event" value={result.data.event?.name} />
                <InfoRow label="Type" value={result.data.ticketType || 'Standard'} />
                {result.data.purchase?.attendeeName && (
                  <InfoRow label="Attendee" value={result.data.purchase.attendeeName} />
                )}
              </>
            )}
            {result.type === 'gift_card' && (
              <>
                <InfoRow label="Code" value={result.data.code} />
                <InfoRow label="Amount" value={`${(result.data.amount / 100).toFixed(2)} ${result.data.currency}`} />
                {result.data.message && <InfoRow label="Message" value={result.data.message} />}
              </>
            )}
            {result.type === 'voucher' && (
              <>
                <InfoRow label="Campaign" value={result.data.campaign?.name || 'N/A'} />
                <InfoRow label="Type" value={result.data.type} />
                <InfoRow label="Value" value={
                  result.data.type === 'percentage'
                    ? `${result.data.value / 100}%`
                    : `${(result.data.value / 100).toFixed(2)} ${result.data.currency}`
                } />
                <InfoRow label="Valid until" value={new Date(result.data.validTo).toLocaleDateString()} />
              </>
            )}
          </div>

          {canRedeem && (
            <WarmButton onClick={handleRedeem} disabled={redeeming} className="w-full mt-4" size="lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              {redeeming ? 'Redeeming...' : 'Redeem'}
            </WarmButton>
          )}

          {!canRedeem && (
            <p className="text-sm text-[var(--text-muted)] mt-4 text-center">
              This item cannot be redeemed (status: {result.data.status})
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
