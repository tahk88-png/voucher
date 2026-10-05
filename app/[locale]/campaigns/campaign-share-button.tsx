'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { Share2, Check } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

export default function CampaignShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const t = useTranslations('offers.campaignShare');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showSuccess(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError(t('copyFailed'));
    }
  };

  return (
    <WarmButton variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      {copied ? t('copied') : t('share')}
    </WarmButton>
  );
}
