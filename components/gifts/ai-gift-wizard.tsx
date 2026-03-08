'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Gift, ArrowRight } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import Link from 'next/link';

interface Suggestion {
  productId: string;
  title: string;
  priceCents: number;
  reason: string;
  score: number;
}

export function AIGiftWizard() {
  const [step, setStep] = useState(0);
  const [recipientType, setRecipientType] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState(5000); // cents
  const [tone, setTone] = useState<'playful' | 'premium' | 'corporate'>('playful');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState('');

  const recipients = ['Partner', 'Friend', 'Parent', 'Colleague', 'Child', 'Teacher'];
  const occasions = ['Birthday', 'Christmas', 'Anniversary', 'Thank You', 'Just Because', 'Graduation'];
  const budgets = [
    { label: '€25', value: 2500 },
    { label: '€50', value: 5000 },
    { label: '€100', value: 10000 },
    { label: '€200', value: 20000 },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gifts/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientType, occasion, budget, tone, limit: 6 }),
      });
      if (!res.ok) {
        throw new Error('Failed to get recommendations');
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setStep(4);
    } catch {
      setError('Could not generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WarmCard padding="lg" className="bg-gradient-to-br from-[var(--accent)] to-[var(--surface)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-[var(--primary-foreground)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--text)]">AI Gift Finder</h2>
          <p className="text-xs text-[var(--text-muted)]">Tell us about the recipient and we&apos;ll find the perfect gift</p>
        </div>
      </div>

      {/* Step 1: Who */}
      {step === 0 && (
        <div>
          <p className="text-sm font-medium text-[var(--text)] mb-3">Who is the gift for?</p>
          <div className="flex flex-wrap gap-2">
            {recipients.map((r) => (
              <button
                key={r}
                onClick={() => { setRecipientType(r); setStep(1); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Occasion */}
      {step === 1 && (
        <div>
          <p className="text-sm font-medium text-[var(--text)] mb-3">What&apos;s the occasion?</p>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => (
              <button
                key={o}
                onClick={() => { setOccasion(o); setStep(2); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Budget */}
      {step === 2 && (
        <div>
          <p className="text-sm font-medium text-[var(--text)] mb-3">What&apos;s your budget?</p>
          <div className="flex flex-wrap gap-2">
            {budgets.map((b) => (
              <button
                key={b.value}
                onClick={() => { setBudget(b.value); setStep(3); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Generate */}
      {step === 3 && (
        <div>
          <div className="flex flex-wrap gap-2 text-sm text-[var(--text-muted)] mb-4">
            <span className="px-2 py-1 rounded-lg bg-[var(--surface)]">For: {recipientType}</span>
            <span className="px-2 py-1 rounded-lg bg-[var(--surface)]">{occasion}</span>
            <span className="px-2 py-1 rounded-lg bg-[var(--surface)]">Budget: €{(budget / 100).toFixed(0)}</span>
          </div>
          <WarmButton onClick={handleSubmit} isLoading={loading} fullWidth>
            <Sparkles className="h-4 w-4 mr-2" />
            Find Perfect Gifts
          </WarmButton>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {/* Step 5: Results */}
      {step === 4 && (
        <div>
          <p className="text-sm font-medium text-[var(--text)] mb-3">
            We found {suggestions.length} gift{suggestions.length !== 1 ? 's' : ''} for you:
          </p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No matching products found. Try adjusting your criteria.</p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <Link key={s.productId} href={`/gifts/${s.productId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition-all group">
                    <Gift className="h-5 w-5 text-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{s.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{s.reason}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--primary)]">€{(s.priceCents / 100).toFixed(2)}</span>
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <WarmButton variant="outline" size="sm" onClick={() => setStep(0)} className="mt-3">
            Start over
          </WarmButton>
        </div>
      )}
    </WarmCard>
  );
}
