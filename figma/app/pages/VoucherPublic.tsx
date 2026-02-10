import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useParams, useNavigate } from '@/lib/router-shim';
import { Gift, Share2, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@app/utils/clipboard';
import { useLanguage } from '@app/contexts/LanguageContext';

export function VoucherPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const copy =
    language === 'et'
      ? {
          merchantName: 'Moepood',
          headline: '25% allahindlus suvekollektsioonilt',
          description:
            '<p>Kehtib koikidele suvekollektsiooni toodetele.</p><ul><li>Ei kombineeru teiste pakkumistega</li><li>Uks kasutus kliendi kohta</li></ul>',
          validUntil: '31.08.2024',
          voucherClaimedTitle: 'Vautser lunastatud!',
          voucherClaimedBody: 'Sinu sooduskood kopeeriti loikelauale',
          yourCode: 'SINU KOOD',
          useCodeHint: 'Kasuta seda koodi ostukorvis soodustuse saamiseks',
          shareWithFriends: 'Jaga sopradega',
          voucherCode: 'VAUTSERI KOOD',
          validUntilLabel: 'Kehtib kuni',
          claimVoucher: 'Lunasta vautser',
          share: 'Jaga',
          visitStore: 'Kulasta meie poodi',
          shareSuccess: 'Jagamine onnestus!',
          copyLinkSuccess: 'Link kopeeriti loikelauale!',
          shareText: 'Vaata seda pakkumist:',
        }
      : {
          merchantName: 'Fashion Store',
          headline: '25% Off Summer Collection',
          description:
            '<p>Valid on all summer items.</p><ul><li>Cannot be combined with other offers</li><li>One use per customer</li></ul>',
          validUntil: '2024-08-31',
          voucherClaimedTitle: 'Voucher Claimed!',
          voucherClaimedBody: 'Your discount code has been copied to your clipboard',
          yourCode: 'YOUR CODE',
          useCodeHint: 'Use this code at checkout to get your discount',
          shareWithFriends: 'Share with Friends',
          voucherCode: 'VOUCHER CODE',
          validUntilLabel: 'Valid until',
          claimVoucher: 'Claim Voucher',
          share: 'Share',
          visitStore: 'Visit our store',
          shareSuccess: 'Shared successfully!',
          copyLinkSuccess: 'Link copied to clipboard!',
          shareText: 'Check out this offer:',
        };

  // Mock voucher data
  const voucher = {
    headline: copy.headline,
    description: copy.description,
    code: 'SUMMER25',
    discount: '25%',
    validUntil: copy.validUntil,
    merchantName: copy.merchantName,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(voucher.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeem = () => {
    setRedeemed(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: voucher.headline,
          text: `${copy.shareText} ${voucher.discount} off!`,
          url: window.location.href,
        });
        toast.success(copy.shareSuccess);
      } catch (error: any) {
        // User cancelled or permission denied
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          const success = await copyToClipboard(window.location.href);
          if (success) {
            toast.success(copy.copyLinkSuccess);
          }
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const success = await copyToClipboard(window.location.href);
      if (success) {
        toast.success(copy.copyLinkSuccess);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Gift className="h-6 w-6 text-[#2D2721]" />
            </div>
            <span className="text-lg font-bold text-[#2D2721]">{voucher.merchantName}</span>
          </div>
        </div>

        {redeemed ? (
          <WarmCard padding="lg" className="text-center">
            <div className="py-8">
              <div className="w-20 h-20 rounded-full bg-[#9DB5A5] flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-3">{copy.voucherClaimedTitle}</h2>
              <p className="text-[#6B5744] mb-8">
                {copy.voucherClaimedBody}
              </p>
              <div className="bg-[#FFF9ED] rounded-[16px] px-6 py-4 border-2 border-[#FFC857] mb-6">
                <div className="text-sm text-[#8B7355] mb-2">{copy.yourCode}</div>
                <div className="text-3xl font-mono font-bold text-[#2D2721] tracking-wider">
                  {voucher.code}
                </div>
              </div>
              <p className="text-sm text-[#8B7355] mb-6">
                {copy.useCodeHint}
              </p>
              <WarmButton variant="outline" fullWidth onClick={handleShare}>
                <Share2 className="h-5 w-5 mr-2" />
                {copy.shareWithFriends}
              </WarmButton>
            </div>
          </WarmCard>
        ) : (
          <WarmCard padding="none" className="overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-[#FFC857] to-[#FFB627] px-8 py-12 text-center">
              <div className="text-5xl font-bold text-[#2D2721] mb-4">{voucher.discount}</div>
              <h1 className="text-2xl font-bold text-[#2D2721]">{voucher.headline}</h1>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Image */}
              {voucher.image && (
                <div className="rounded-[12px] overflow-hidden shadow-sm mb-4">
                  <img src={voucher.image} alt={voucher.headline} className="w-full h-48 object-cover" />
                </div>
              )}

              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-[16px] bg-[#F8F6F1] flex items-center justify-center border-2 border-[rgba(139,115,85,0.1)]">
                  <QrCode className="h-20 w-20 text-[#8B7355]" />
                </div>
              </div>

              {/* Code Display */}
              <div className="bg-[#FFF9ED] rounded-[16px] px-6 py-4 border border-[rgba(139,115,85,0.1)]">
                <div className="text-xs text-[#8B7355] mb-2 text-center">{copy.voucherCode}</div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl font-mono font-bold text-[#2D2721] tracking-wider flex-1 text-center">
                    {voucher.code}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="w-10 h-10 rounded-[10px] bg-white border border-[rgba(139,115,85,0.15)] flex items-center justify-center hover:border-[rgba(139,115,85,0.3)] transition-all"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-[#9DB5A5]" />
                    ) : (
                      <Copy className="h-5 w-5 text-[#8B7355]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div 
                className="text-sm text-[#6B5744] leading-relaxed prose prose-sm prose-warm max-w-none text-left"
                dangerouslySetInnerHTML={{ __html: voucher.description }}
              />

              {/* Valid Until */}
              <div className="flex items-center justify-center gap-2 text-sm text-[#8B7355]">
                <span>{copy.validUntilLabel}</span>
                <span className="font-semibold text-[#2D2721]">{voucher.validUntil}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <WarmButton size="lg" fullWidth onClick={handleRedeem}>
                  {copy.claimVoucher}
                </WarmButton>
                <WarmButton variant="outline" fullWidth onClick={handleShare}>
                  <Share2 className="h-5 w-5 mr-2" />
                  {copy.share}
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#6B5744] hover:text-[#2D2721] transition-colors"
          >
            {copy.visitStore}
          </button>
        </div>
      </div>
    </div>
  );
}
