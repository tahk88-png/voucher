import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Voucher Platform',
  description: 'How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>
        Privacy Policy
      </h1>
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <p><strong>Last updated:</strong> March 2026</p>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>1. Data We Collect</h2>
          <p><strong>Account data:</strong> Name, email address, password hash, profile picture URL.</p>
          <p><strong>Usage data:</strong> Pages visited, vouchers viewed/purchased/redeemed, search queries, device information, IP address.</p>
          <p><strong>Payment data:</strong> Processed by Stripe — we do not store credit card numbers. We store transaction IDs, amounts, and payment status.</p>
          <p><strong>Location data:</strong> Only when you explicitly enable "nearby offers" — never collected without consent.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Process purchases and redemptions</li>
            <li>Send transactional notifications (order confirmations, expiry reminders)</li>
            <li>Personalize recommendations and search results</li>
            <li>Fraud detection and platform security</li>
            <li>Analytics to improve the platform (aggregated, anonymized)</li>
            <li>Smart notification timing (learning your preferred notification times)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>3. Legal Basis (GDPR)</h2>
          <p>We process data based on: contract performance (purchases), legitimate interest (fraud prevention, analytics), consent (marketing, location), and legal obligation (tax records, audit logs).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>4. Data Sharing</h2>
          <p>We share data with: <strong>Stripe</strong> (payments), <strong>Resend</strong> (emails), <strong>Sentry</strong> (error tracking, anonymized), and <strong>merchants</strong> (only purchase/redemption data relevant to their business). We never sell personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>5. Data Retention</h2>
          <p>Account data: retained while account is active + 30 days after deletion request. Transaction records: 7 years (tax compliance). Audit logs: 2 years. Analytics data: aggregated after 90 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>6. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> Download all your data from Settings → Privacy → Export Data</li>
            <li><strong>Rectification:</strong> Edit your profile anytime</li>
            <li><strong>Erasure:</strong> Request account deletion from Settings → Privacy → Delete Account</li>
            <li><strong>Portability:</strong> Export data in JSON format</li>
            <li><strong>Objection:</strong> Opt out of marketing from notification settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>7. Cookies & Tracking</h2>
          <p>We use essential cookies for authentication and session management. Optional cookies for: theme preference, language selection, analytics. You can manage cookie preferences in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>8. Security</h2>
          <p>We protect your data with: encrypted connections (TLS), hashed passwords (bcrypt), rate limiting, fraud detection, two-factor authentication support, and regular security audits.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>9. Children</h2>
          <p>Our platform is not intended for users under 16. We do not knowingly collect data from children.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>10. Contact</h2>
          <p>Data Protection Officer: <a href="/contact" className="underline" style={{ color: 'var(--primary)' }}>Contact us</a></p>
        </section>
      </div>
    </main>
  );
}
