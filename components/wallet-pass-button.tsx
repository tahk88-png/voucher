'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WalletPassButtonProps {
  type: 'voucher' | 'ticket' | 'gift_card';
  id: string;
  className?: string;
}

type Platform = 'apple' | 'google' | 'both';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'both';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua) && 'ontouchend' in document) return 'apple';
  if (/Android/i.test(ua)) return 'google';
  return 'both';
}

export function WalletPassButton({ type, id, className }: WalletPassButtonProps) {
  const [platform, setPlatform] = useState<Platform>('both');
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [success, setSuccess] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  async function addToWallet(target: 'apple' | 'google') {
    setLoading(target);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/wallet-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, platform: target }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate pass');
      }

      const data = await res.json();
      setSuccess(target);

      // In production:
      // Apple: download .pkpass file → triggers native "Add to Wallet" dialog
      // Google: redirect to https://pay.google.com/gp/v/save/{jwt}
      console.log(`[WalletPass] ${target} pass generated:`, data.walletPassId);

      // For now, show success and log the pass data
      if (data.alreadyExists) {
        console.log('[WalletPass] Pass already exists in wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  const showApple = platform === 'apple' || platform === 'both';
  const showGoogle = platform === 'google' || platform === 'both';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {showApple && (
        <button
          onClick={() => addToWallet('apple')}
          disabled={loading !== null}
          className={cn(
            'relative inline-flex items-center justify-center h-12 px-5 rounded-lg transition-all duration-200',
            'bg-black text-white hover:bg-gray-900 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            success === 'apple' && 'ring-2 ring-green-500'
          )}
          aria-label="Add to Apple Wallet"
        >
          {loading === 'apple' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : success === 'apple' ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added to Wallet
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {/* Apple Wallet icon */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-normal">Add to</span>
                <span className="text-sm font-semibold -mt-0.5">Apple Wallet</span>
              </span>
            </span>
          )}
        </button>
      )}

      {showGoogle && (
        <button
          onClick={() => addToWallet('google')}
          disabled={loading !== null}
          className={cn(
            'relative inline-flex items-center justify-center h-12 px-5 rounded-lg transition-all duration-200',
            'bg-[#1a73e8] text-white hover:bg-[#1557b0] active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            success === 'google' && 'ring-2 ring-green-500'
          )}
          aria-label="Add to Google Wallet"
        >
          {loading === 'google' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : success === 'google' ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added to Wallet
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {/* Google Wallet icon */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1h-9.18v2.73h5.51c-.24 1.27-1.33 3.71-5.51 3.71-3.31 0-6.01-2.75-6.01-6.12s2.7-6.12 6.01-6.12c1.87 0 3.13.8 3.85 1.48l2.84-2.76C16.99 2.41 14.76 1.5 12.17 1.5 6.62 1.5 2.17 5.95 2.17 11.5s4.45 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.07-1.16-.17-1.63z" />
              </svg>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-normal">Add to</span>
                <span className="text-sm font-semibold -mt-0.5">Google Wallet</span>
              </span>
            </span>
          )}
        </button>
      )}
    </div>
  );
}
