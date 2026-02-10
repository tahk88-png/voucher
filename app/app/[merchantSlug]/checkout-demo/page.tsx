'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutDemoPage() {
  const params = useParams();
  const merchantSlug = params.merchantSlug as string;
  const [orderAmount, setOrderAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [balance, setBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/wallet/${merchantSlug}`)
      .then((res) => res.json())
      .then((data) => {
        setBalance(data);
        if (data.available > 0) {
          setCreditAmount(String(data.available / 100));
        }
      })
      .catch((err) => {
        console.error('Error fetching balance:', err);
      });
  }, [merchantSlug]);

  const handleApplyCredit = async () => {
    if (!creditAmount || !orderAmount) {
      setError('Please enter both order amount and credit amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const creditAmountCents = parseInt(creditAmount) * 100;
      const response = await fetch('/api/credits/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          amount: creditAmountCents,
          orderReference: `DEMO-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply credit');
      }

      alert(
        `Credit applied successfully! Order total: ${formatCurrency(
          parseInt(orderAmount) * 100 - creditAmountCents,
          balance?.currency || 'USD'
        )}`
      );

      const balanceRes = await fetch(`/api/wallet/${merchantSlug}`);
      const balanceData = await balanceRes.json();
      setBalance(balanceData);
      setCreditAmount(String(balanceData.available / 100));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply credit';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const finalAmount = orderAmount && creditAmount
    ? Math.max(0, parseInt(orderAmount) - parseInt(creditAmount))
    : 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#2D2721] mb-6">Checkout demo</h1>

        <WarmCard padding="lg" className="mb-6 bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-lg font-semibold text-[#2D2721]">Credit balance</h2>
          <div className="mt-3">
            {balance ? (
              <div>
                <p className="text-2xl font-semibold text-[#2D2721]">
                  {formatCurrency(balance.available, balance.currency)} available
                </p>
                {balance.locked > 0 && (
                  <p className="text-sm text-[#6B5744] mt-1">
                    {formatCurrency(balance.locked, balance.currency)} locked
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6B5744]">Loading...</p>
            )}
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">Order summary</h2>
            <p className="text-sm text-[#6B5744]">Demo checkout page</p>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="orderAmount">Order amount</Label>
              <Input
                id="orderAmount"
                type="number"
                placeholder="100.00"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="mt-1 border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <div>
              <Label htmlFor="creditAmount">Credit to apply</Label>
              <Input
                id="creditAmount"
                type="number"
                placeholder="0.00"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                max={balance ? String(balance.available / 100) : undefined}
                className="mt-1 border-[rgba(139,115,85,0.15)]"
              />
              {balance && (
                <p className="text-sm text-[#6B5744] mt-1">
                  Max: {formatCurrency(balance.available, balance.currency)}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-[#FCE8DD] text-[#8B4B39] text-sm p-3 rounded-2xl border border-[#F7C6B0]">
                {error}
              </div>
            )}

            <div className="border-t border-[rgba(139,115,85,0.15)] pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B5744]">Subtotal</span>
                <span className="text-[#2D2721]">
                  {orderAmount
                    ? formatCurrency(parseInt(orderAmount) * 100, balance?.currency || 'USD')
                    : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between text-[#8B7355]">
                <span>Credit applied</span>
                <span>
                  -
                  {creditAmount
                    ? formatCurrency(parseInt(creditAmount) * 100, balance?.currency || 'USD')
                    : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t border-[rgba(139,115,85,0.15)] pt-2">
                <span className="text-[#2D2721]">Total</span>
                <span className="text-[#2D2721]">
                  {formatCurrency(finalAmount * 100, balance?.currency || 'USD')}
                </span>
              </div>
            </div>

            <WarmButton
              className="w-full"
              onClick={handleApplyCredit}
              disabled={!orderAmount || !creditAmount || isLoading || !balance || balance.available === 0}
            >
              {isLoading ? 'Processing...' : 'Apply credit and complete order'}
            </WarmButton>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
