import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { QrCode, Check, X, ArrowLeft, AlertCircle, Scan, CreditCard, Gift, Ticket, Smartphone } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { CurrencyDisplay } from '@/app/components/CurrencyDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'already-used';
type RedemptionType = 'voucher' | 'gift-card' | 'event-ticket';

export function StaffRedeem() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [manualCode, setManualCode] = useState('');
  const [voucherData, setVoucherData] = useState<any>(null);
  const [redemptionType, setRedemptionType] = useState<RedemptionType>('voucher');
  const [redeemAmount, setRedeemAmount] = useState('');

  const handleScan = () => {
    setScanState('scanning');
    
    // Simulate scanning
    setTimeout(() => {
      // Randomly simulate different outcomes
      const random = Math.random();
      if (random > 0.7) {
        setScanState('already-used');
      } else if (random > 0.3) {
        // Randomly determine if it's a voucher, gift card, or event ticket
        const type = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'gift-card' : 'event-ticket') : 'voucher';
        setScanState('success');
        
        if (type === 'gift-card') {
          setRedemptionType('gift-card');
          setVoucherData({
            code: 'GIFT-XMAS-2024-A3F9',
            name: 'Holiday Gift Card',
            currentBalance: 72.50,
            currency: 'EUR',
            recipient: 'Anna Andersson',
          });
        } else if (type === 'event-ticket') {
          setRedemptionType('event-ticket');
          setVoucherData({
            code: 'EVENT-CONF-2024-B4G7',
            name: 'Conference Ticket',
            currentBalance: 50.00,
            currency: 'EUR',
            recipient: 'John Doe',
          });
        } else {
          setRedemptionType('voucher');
          setVoucherData({
            code: 'SUMMER25',
            headline: '25% Off Summer Collection',
            discount: '25%',
            customer: 'John Doe',
          });
        }
      } else {
        setScanState('error');
      }
    }, 2000);
  };

  const handleManualRedeem = () => {
    if (!manualCode) return;
    
    setScanState('scanning');
    setTimeout(() => {
      setScanState('success');
      
      // Check if code looks like a gift card (starts with GIFT-)
      const isGiftCard = manualCode.toUpperCase().startsWith('GIFT-');
      
      if (isGiftCard) {
        setRedemptionType('gift-card');
        setVoucherData({
          code: manualCode.toUpperCase(),
          name: 'Holiday Gift Card',
          currentBalance: 72.50,
          currency: 'EUR',
          recipient: 'Manual Entry',
        });
      } else {
        setRedemptionType('voucher');
        setVoucherData({
          code: manualCode.toUpperCase(),
          headline: '25% Off Summer Collection',
          discount: '25%',
          customer: 'Manual Entry',
        });
      }
    }, 1000);
  };

  const handleRedeemGiftCard = () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      return;
    }
    
    const amount = parseFloat(redeemAmount);
    if (amount > voucherData.currentBalance) {
      return;
    }
    
    // Process redemption
    setScanState('idle');
    setManualCode('');
    setVoucherData(null);
    setRedeemAmount('');
  };

  const handleReset = () => {
    setScanState('idle');
    setManualCode('');
    setVoucherData(null);
    setRedeemAmount('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Scan className="h-7 w-7 text-[#2D2721]" />
            </div>
            <span className="text-2xl font-bold text-[#2D2721]">Staff Redeem</span>
          </div>
          <p className="text-[#6B5744]">Scan or enter code to redeem</p>
        </div>

        <WarmCard padding="lg">
          {scanState === 'idle' && (
            <div className="space-y-6">
              {/* Tabs for Voucher/Gift Card */}
              <Tabs defaultValue="voucher" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="voucher" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Voucher
                  </TabsTrigger>
                  <TabsTrigger value="gift-card" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Gift Card
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="voucher" className="space-y-6">
                  {/* QR Scanner */}
                  <div
                    onClick={handleScan}
                    className="aspect-square rounded-[20px] bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border-4 border-dashed border-[rgba(139,115,85,0.2)] flex flex-col items-center justify-center cursor-pointer hover:border-[rgba(139,115,85,0.4)] transition-all"
                  >
                    <QrCode className="h-24 w-24 text-[#8B7355] mb-4" />
                    <p className="font-semibold text-[#2D2721]">Tap to Scan QR Code</p>
                    <p className="text-sm text-[#8B7355] mt-1">Position code within frame</p>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(139,115,85,0.1)]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-4 text-[#8B7355]">OR ENTER MANUALLY</span>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-[#2D2721] font-medium">
                        Voucher Code
                      </Label>
                      <Input
                        id="code"
                        placeholder="e.g., SUMMER25"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono text-center text-lg"
                      />
                    </div>
                    <WarmButton
                      size="lg"
                      fullWidth
                      onClick={handleManualRedeem}
                      disabled={!manualCode}
                    >
                      Validate Code
                    </WarmButton>
                  </div>
                </TabsContent>
                
                <TabsContent value="gift-card" className="space-y-6">
                  {/* QR Scanner */}
                  <div
                    onClick={handleScan}
                    className="aspect-square rounded-[20px] bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border-4 border-dashed border-[rgba(139,115,85,0.2)] flex flex-col items-center justify-center cursor-pointer hover:border-[rgba(139,115,85,0.4)] transition-all"
                  >
                    <Gift className="h-24 w-24 text-[#8B7355] mb-4" />
                    <p className="font-semibold text-[#2D2721]">Tap to Scan Gift Card</p>
                    <p className="text-sm text-[#8B7355] mt-1">Position code within frame</p>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(139,115,85,0.1)]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-4 text-[#8B7355]">OR ENTER MANUALLY</span>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gift-code" className="text-[#2D2721] font-medium">
                        Gift Card Code
                      </Label>
                      <Input
                        id="gift-code"
                        placeholder="e.g., GIFT-XMAS-2024-A3F9"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono text-center text-sm"
                      />
                    </div>
                    <WarmButton
                      size="lg"
                      fullWidth
                      onClick={handleManualRedeem}
                      disabled={!manualCode}
                    >
                      Validate Gift Card
                    </WarmButton>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <QrCode className="h-10 w-10 text-[#2D2721]" />
              </div>
              <h2 className="text-xl font-semibold text-[#2D2721] mb-2">Scanning...</h2>
              <p className="text-[#6B5744]">Please wait</p>
            </div>
          )}

          {scanState === 'success' && voucherData && redemptionType === 'voucher' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#9DB5A5] flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Valid Voucher!</h2>
              <p className="text-[#6B5744] mb-6">Redemption successful</p>

              <WarmCard gradient padding="lg" className="mb-6 text-left">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Code</span>
                    <span className="font-mono font-bold text-[#2D2721]">{voucherData.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Offer</span>
                    <span className="font-semibold text-[#2D2721]">{voucherData.headline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Discount</span>
                    <span className="text-2xl font-bold text-[#FFC857]">{voucherData.discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Customer</span>
                    <span className="font-medium text-[#2D2721]">{voucherData.customer}</span>
                  </div>
                </div>
              </WarmCard>

              <WarmButton size="lg" fullWidth onClick={handleReset}>
                Scan Another
              </WarmButton>
            </div>
          )}

          {scanState === 'success' && voucherData && redemptionType === 'gift-card' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#9DB5A5] flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Valid Gift Card!</h2>
              <p className="text-[#6B5744] mb-6">{voucherData.recipient}</p>

              <WarmCard gradient padding="lg" className="mb-6 text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[#6B5744]">Code</span>
                    <span className="font-mono text-sm font-bold text-[#2D2721] text-right break-all">{voucherData.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5744]">Gift Card</span>
                    <span className="font-semibold text-[#2D2721]">{voucherData.name}</span>
                  </div>
                  <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                    <div className="text-sm text-[#8B7355] mb-1">Available Balance</div>
                    <div className="text-3xl font-bold text-[#FFC857]">
                      <CurrencyDisplay amount={voucherData.currentBalance} currency={voucherData.currency} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redeem-amount" className="text-[#2D2721] font-medium">
                      Amount to Redeem
                    </Label>
                    <Input
                      id="redeem-amount"
                      type="number"
                      placeholder="0.00"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      max={voucherData.currentBalance}
                      step="0.01"
                      className="rounded-[12px] h-12 text-lg text-center"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRedeemAmount((voucherData.currentBalance / 2).toFixed(2))}
                        className="flex-1 px-3 py-2 text-sm bg-[#FFF9ED] hover:bg-[#FFE5B4] rounded-lg transition-colors text-[#6B5744]"
                      >
                        Half
                      </button>
                      <button
                        onClick={() => setRedeemAmount(voucherData.currentBalance.toFixed(2))}
                        className="flex-1 px-3 py-2 text-sm bg-[#FFF9ED] hover:bg-[#FFE5B4] rounded-lg transition-colors text-[#6B5744]"
                      >
                        Full Amount
                      </button>
                    </div>
                  </div>
                </div>
              </WarmCard>

              <div className="space-y-3">
                <WarmButton 
                  size="lg" 
                  fullWidth 
                  onClick={handleRedeemGiftCard}
                  disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > voucherData.currentBalance}
                >
                  Redeem {redeemAmount ? <CurrencyDisplay amount={parseFloat(redeemAmount)} currency={voucherData.currency} /> : ''}
                </WarmButton>
                <WarmButton size="lg" fullWidth variant="outline" onClick={handleReset}>
                  Cancel
                </WarmButton>
              </div>
            </div>
          )}

          {scanState === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-6">
                <X className="h-10 w-10 text-[#DC2626]" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Invalid Code</h2>
              <p className="text-[#6B5744] mb-6">
                This voucher code could not be found
              </p>
              <WarmButton size="lg" fullWidth onClick={handleReset}>
                Try Again
              </WarmButton>
            </div>
          )}

          {scanState === 'already-used' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#FFF9ED] flex items-center justify-center mx-auto mb-6 border-2 border-[#FFB627]">
                <AlertCircle className="h-10 w-10 text-[#FFB627]" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Already Redeemed</h2>
              <p className="text-[#6B5744] mb-2">
                This voucher has already been used
              </p>
              <p className="text-sm text-[#8B7355] mb-6">
                Redeemed on: Jan 20, 2024 at 14:30
              </p>
              <WarmButton size="lg" fullWidth onClick={handleReset}>
                Scan Another
              </WarmButton>
            </div>
          )}
        </WarmCard>

        {/* Back Link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mx-auto mt-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>
      </div>
    </div>
  );
}