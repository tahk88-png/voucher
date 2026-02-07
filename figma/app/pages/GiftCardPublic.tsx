import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Gift, QrCode, Share2, Copy, Check, ArrowRight, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/figma/app/components/CurrencyDisplay';
import { copyToClipboard } from '@/figma/app/utils/clipboard';

type Transaction = {
  id: string;
  date: string;
  amount: number;
  location: string;
  balanceAfter: number;
};

export function GiftCardPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Mock gift card data
  const giftCard = {
    id: id || 'GC-2024-001',
    name: 'Holiday Gift Card',
    code: 'GIFT-XMAS-2024-A3F9',
    initialValue: 100,
    currentBalance: 72.50,
    currency: 'EUR' as const,
    validUntil: '2024-12-31',
    recipientName: 'Anna Andersson',
    message: 'Happy Holidays! Enjoy your shopping!',
    design: 'warm' as const,
    status: 'active' as const,
  };

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      date: '2024-01-20',
      amount: 15.50,
      location: 'Main Store - Stockholm',
      balanceAfter: 84.50,
    },
    {
      id: 'TXN-002',
      date: '2024-01-18',
      amount: 12.00,
      location: 'Online Shop',
      balanceAfter: 88.00,
    },
  ];

  const handleCopyCode = async () => {
    const success = await copyToClipboard(giftCard.code);
    if (success) {
      setCopied(true);
      toast.success('Gift card code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: giftCard.name,
          text: `I have a gift card with ${giftCard.currentBalance} ${giftCard.currency} balance!`,
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (error: any) {
        // User cancelled or permission denied
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          const success = await copyToClipboard(window.location.href);
          if (success) {
            toast.success('Link copied to clipboard!');
          }
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const success = await copyToClipboard(window.location.href);
      if (success) {
        toast.success('Link copied to clipboard!');
      }
    }
  };

  const getDesignGradient = () => {
    switch (giftCard.design) {
      case 'warm':
        return 'from-[#FFF9ED] to-[#FFE5B4]';
      case 'minimal':
        return 'from-white to-[#F2EDE3]';
      case 'festive':
        return 'from-[#FFC857] to-[#E17B5C]';
    }
  };

  const balancePercentage = (giftCard.currentBalance / giftCard.initialValue) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] to-[#FFF9ED] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-4 shadow-warm-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D2721] mb-2">Your Gift Card</h1>
          <p className="text-[#6B5744]">You've received a special gift</p>
        </div>

        {/* Gift Card Display */}
        <WarmCard padding="none" className="overflow-hidden">
          <div className={`bg-gradient-to-br ${getDesignGradient()} p-8`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-6">
              {/* Recipient & Message */}
              {giftCard.recipientName && (
                <div className="pb-4 border-b border-[rgba(139,115,85,0.1)]">
                  <div className="text-sm text-[#8B7355] mb-1">To</div>
                  <div className="text-lg font-semibold text-[#2D2721]">{giftCard.recipientName}</div>
                  {giftCard.message && (
                    <div className="mt-3 text-sm text-[#6B5744] italic">"{giftCard.message}"</div>
                  )}
                </div>
              )}

              {/* Balance */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-[#FFC857]" />
                  <span className="text-sm text-[#8B7355]">Current Balance</span>
                </div>
                <div className="text-4xl font-bold text-[#2D2721] mb-2">
                  <CurrencyDisplay amount={giftCard.currentBalance} currency={giftCard.currency} />
                </div>
                <div className="text-sm text-[#6B5744] mb-3">
                  of <CurrencyDisplay amount={giftCard.initialValue} currency={giftCard.currency} /> initial value
                </div>
                <div className="w-full h-3 bg-[#F2EDE3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] rounded-full transition-all"
                    style={{ width: `${balancePercentage}%` }}
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm text-[#8B7355]">Gift Card Code</div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono bg-[#FFF9ED] px-4 py-3 rounded-lg text-[#2D2721] font-semibold">
                    {giftCard.code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 bg-[#FFF9ED] hover:bg-[#FFE5B4] rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-[#9DB5A5]" />
                    ) : (
                      <Copy className="h-5 w-5 text-[#6B5744]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Valid Until */}
              <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                <Calendar className="h-4 w-4" />
                <span>Valid until {giftCard.validUntil}</span>
              </div>
            </div>
          </div>
        </WarmCard>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <WarmButton
            variant="outline"
            onClick={() => setShowQR(!showQR)}
            className="w-full"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Show QR
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={handleShare}
            className="w-full"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </WarmButton>
        </div>

        {/* QR Code Display */}
        {showQR && (
          <WarmCard padding="lg" className="text-center">
            <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Scan to Redeem</h3>
            <div className="w-64 h-64 mx-auto bg-white rounded-xl p-4 shadow-warm flex items-center justify-center border border-[rgba(139,115,85,0.1)]">
              <div className="text-center">
                <QrCode className="h-32 w-32 text-[#FFC857] mx-auto mb-2" />
                <p className="text-sm text-[#8B7355]">QR Code</p>
                <p className="text-xs text-[#8B7355] mt-1">{giftCard.code}</p>
              </div>
            </div>
            <p className="text-sm text-[#6B5744] mt-4">
              Show this QR code at checkout to redeem your gift card
            </p>
          </WarmCard>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <WarmCard padding="lg">
            <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Transaction History</h3>
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-[#FFF9ED] rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-[#2D2721] mb-1">{txn.location}</div>
                    <div className="text-sm text-[#8B7355]">{txn.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#E17B5C]">
                      -<CurrencyDisplay amount={txn.amount} currency={giftCard.currency} />
                    </div>
                    <div className="text-sm text-[#8B7355]">
                      Balance: <CurrencyDisplay amount={txn.balanceAfter} currency={giftCard.currency} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WarmCard>
        )}

        {/* How to Use */}
        <WarmCard padding="lg" className="bg-[#FFF9ED]">
          <h3 className="text-lg font-semibold text-[#2D2721] mb-3">How to Use Your Gift Card</h3>
          <ul className="space-y-2 text-sm text-[#6B5744]">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-[#FFC857] mt-0.5 flex-shrink-0" />
              <span>Show the QR code or provide the code at checkout</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-[#FFC857] mt-0.5 flex-shrink-0" />
              <span>Your balance will be deducted from the purchase amount</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-[#FFC857] mt-0.5 flex-shrink-0" />
              <span>Any remaining balance stays on the card for future use</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-[#FFC857] mt-0.5 flex-shrink-0" />
              <span>Valid until {giftCard.validUntil}</span>
            </li>
          </ul>
        </WarmCard>
      </div>
    </div>
  );
}