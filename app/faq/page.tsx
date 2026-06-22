'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    items: [
      {
        q: 'What is this platform?',
        a: 'We are a digital voucher, gift card, and event ticket marketplace that connects merchants with customers. Merchants can create and sell digital products, and customers can purchase, gift, and redeem them.',
      },
      {
        q: 'Is the platform free to use?',
        a: 'Browsing and creating an account is free. Merchants pay a small platform fee on sales. Customers pay only for the products they purchase.',
      },
      {
        q: 'Which countries are supported?',
        a: 'We support merchants and customers across the EU, with multi-currency support for 12 currencies and 25 language translations.',
      },
    ],
  },
  {
    category: 'Purchasing & Payments',
    items: [
      {
        q: 'How do I buy a voucher?',
        a: 'Browse available vouchers, click "Buy", and complete checkout via Stripe. Your voucher will appear in your wallet immediately after payment.',
      },
      {
        q: 'Can I pay in installments?',
        a: 'Yes! We offer Buy Now Pay Later (BNPL) with 3x (0% fee), 6x (2.5%), or 12x (5%) installment plans on eligible purchases.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and bank transfers through our Stripe integration.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Refund policies are set by individual merchants. Check the voucher details page for the specific refund policy before purchasing.',
      },
    ],
  },
  {
    category: 'Vouchers & Redemption',
    items: [
      {
        q: 'How do I redeem a voucher?',
        a: 'Open your wallet, select the voucher, and show the QR code to the merchant. They will scan it to confirm redemption. You can also redeem by entering a code manually.',
      },
      {
        q: 'Can I add vouchers to Apple/Google Wallet?',
        a: 'Yes! Each voucher has an "Add to Wallet" button that generates a pass for Apple Wallet or Google Wallet. You can then present it directly from your lock screen.',
      },
      {
        q: 'What happens when a voucher expires?',
        a: 'Expired vouchers cannot be redeemed. You will receive a notification before expiration. Check your wallet for expiry dates.',
      },
      {
        q: 'Can I gift a voucher to someone?',
        a: 'Yes! When purchasing, select "Send as gift" and enter the recipient\'s email. They will receive the voucher with a personalized message.',
      },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      {
        q: 'How do I enable two-factor authentication?',
        a: 'Go to Settings → Security → Two-Factor Authentication. You can set up TOTP (Google Authenticator) or use passkey (biometric) authentication.',
      },
      {
        q: 'Can I sign in with biometrics?',
        a: 'Yes! We support Passkey authentication — sign in with Face ID, fingerprint, or Windows Hello. Set it up in Settings → Security.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Privacy → Delete Account. All your data will be erased within 30 days per our GDPR compliance policy. You can export your data first.',
      },
    ],
  },
  {
    category: 'For Merchants',
    items: [
      {
        q: 'How do I start selling?',
        a: 'Register as a merchant, complete the onboarding process, and create your first voucher. You can start selling immediately after profile approval.',
      },
      {
        q: 'What are the platform fees?',
        a: 'Check the merchant billing section for current fee structures. Fees vary by plan and transaction volume.',
      },
      {
        q: 'Can I integrate with my existing systems?',
        a: 'Yes! We offer webhooks (for real-time event notifications), API keys (for programmatic access), and Zapier/Slack/Discord integrations.',
      },
      {
        q: 'How do I track my sales?',
        a: 'Your merchant dashboard shows real-time analytics including revenue, redemptions, customer insights, and AI-powered natural language queries ("show me last week\'s revenue").',
      },
    ],
  },
  {
    category: 'Loyalty & Rewards',
    items: [
      {
        q: 'How does the loyalty program work?',
        a: 'Earn points by making purchases, daily check-ins, referrals, and writing reviews. Points unlock tier levels (Bronze → Silver → Gold → Platinum → Diamond) with increasing benefits.',
      },
      {
        q: 'What are badges and streaks?',
        a: 'Badges are achievements earned for milestones (first purchase, 10 referrals, etc.). Streaks track consecutive days of activity and reward consistency.',
      },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
        Frequently Asked Questions
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
        Find answers to common questions about our platform.
      </p>

      <div className="space-y-8">
        {faqs.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {cat.category}
            </h2>
            <div className="space-y-1">
              {cat.items.map((item) => {
                const key = `${cat.category}-${item.q}`;
                const isOpen = openItems.has(key);
                return (
                  <div
                    key={key}
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <button
                      onClick={() => toggle(key)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors"
                      style={{
                        color: 'var(--text)',
                        backgroundColor: isOpen ? 'var(--surface-dim)' : 'var(--surface)',
                      }}
                    >
                      {item.q}
                      <ChevronDown
                        size={16}
                        className="shrink-0 ml-2 transition-transform"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: 'var(--text-muted)',
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className="px-4 py-3 text-sm"
                        style={{
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--surface)',
                        }}
                      >
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
