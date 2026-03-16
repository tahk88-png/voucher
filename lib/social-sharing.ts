/**
 * Social sharing utilities — share URLs, OG metadata, share targets
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type ShareItemType = 'voucher' | 'campaign' | 'merchant';

export interface ShareTarget {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  color: string;
  getUrl: (shareUrl: string, text: string) => string;
}

/**
 * Generate a shareable URL that routes through the tracking redirect.
 */
export function generateShareUrl(
  type: ShareItemType,
  id: string,
  referralCode?: string
): string {
  const base = `${BASE_URL}/api/share/${type}-${id}`;
  if (referralCode) {
    return `${base}?ref=${encodeURIComponent(referralCode)}`;
  }
  return base;
}

/**
 * Build OG metadata for a shared item.
 */
export function getOgMetadata(
  type: ShareItemType,
  item: {
    title: string;
    description?: string;
    imageUrl?: string;
    merchantName?: string;
  }
) {
  const typeLabel =
    type === 'voucher'
      ? 'Voucher'
      : type === 'campaign'
        ? 'Campaign'
        : 'Merchant';

  return {
    title: item.title,
    description:
      item.description ||
      `Check out this ${typeLabel.toLowerCase()}${item.merchantName ? ` from ${item.merchantName}` : ''}!`,
    image: item.imageUrl || `${BASE_URL}/og-default.png`,
    url: BASE_URL,
    type: 'website' as const,
    siteName: 'Voucher Platform',
  };
}

/**
 * Available share targets with URL generators.
 */
export const shareTargets: ShareTarget[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'MessageCircle',
    color: '#25D366',
    getUrl: (shareUrl, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    getUrl: (shareUrl) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: 'x',
    name: 'X',
    icon: 'Twitter',
    color: '#000000',
    getUrl: (shareUrl, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'Send',
    color: '#0088CC',
    getUrl: (shareUrl, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'Mail',
    color: '#6B7280',
    getUrl: (shareUrl, text) =>
      `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: 'Link',
    color: '#8B7355',
    getUrl: (shareUrl) => shareUrl, // handled by clipboard
  },
];
