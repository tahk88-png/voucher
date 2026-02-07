'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast-helpers';
import { useTranslations } from 'next-intl';

interface SocialShareProps {
  url: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function SocialShare({
  url,
  title,
  description,
  className,
  variant = 'outline',
  size = 'default',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('share');
  const warmVariant = variant === 'default' ? 'primary' : variant;
  const warmSize = size === 'default' ? 'md' : size === 'icon' ? 'sm' : size;
  const iconClass = size === 'icon' ? 'h-10 w-10 p-0' : '';

  const shareText = title || description || '';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || '');
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
  };

  const handleShare = async (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform];
    
    if (platform === 'email') {
      window.location.href = shareUrl;
      return;
    }

    if (navigator.share && (platform === 'whatsapp' || platform === 'facebook')) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        return;
      } catch {
        // Fallback to URL
      }
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
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
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={() => handleShare('facebook')}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('shareOnFacebook')}
      >
        <Facebook className="h-4 w-4" />
        <span className="hidden sm:inline">{t('facebook')}</span>
      </WarmButton>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={() => handleShare('twitter')}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('shareOnTwitter')}
      >
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">{t('twitter')}</span>
      </WarmButton>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={() => handleShare('linkedin')}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('shareOnLinkedIn')}
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline">{t('linkedin')}</span>
      </WarmButton>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={() => handleShare('whatsapp')}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('shareOnWhatsApp')}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{t('whatsapp')}</span>
      </WarmButton>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={() => handleShare('email')}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('shareViaEmail')}
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">{t('email')}</span>
      </WarmButton>
      <WarmButton
        variant={warmVariant}
        size={warmSize}
        onClick={handleCopyLink}
        className={`flex items-center gap-2 ${iconClass}`}
        aria-label={t('copyLink')}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">{t('copied')}</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('copyLink')}</span>
          </>
        )}
      </WarmButton>
    </div>
  );
}
