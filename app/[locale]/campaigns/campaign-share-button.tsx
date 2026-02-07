'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { Share2, Check } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast-helpers';

export default function CampaignShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
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
      showSuccess('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Copy failed');
    }
  };

  return (
    <WarmButton variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      {copied ? 'Copied' : 'Share'}
    </WarmButton>
  );
}
