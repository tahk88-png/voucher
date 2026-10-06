'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';

/** A read-only link in a small monospace field with a single copy button. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const t = useTranslations('referral');
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    if (!navigator?.clipboard) {
      showError(t('clipboardUnavailable'));
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showSuccess(t('linkCopied'));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
      showError(t('copyFailedNow'));
    }
  }

  return (
    <div className="flex gap-2 min-w-0">
      <input
        type="text"
        readOnly
        value={value}
        aria-label={label}
        onFocus={(event) => event.currentTarget.select()}
        className="flex-1 min-w-0 rounded-[var(--r-sm)] border border-[rgba(139,115,85,0.25)] bg-[#FFFBF5] px-3 py-2 font-mono text-xs sm:text-sm text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <WarmButton type="button" size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        <span className="ml-1.5">{copied ? t('copied') : t('copy')}</span>
      </WarmButton>
    </div>
  );
}
