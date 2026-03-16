import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Voucher Platform',
  description: 'Terms and conditions for using our voucher platform',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>
        Terms of Service
      </h1>
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <p><strong>Last updated:</strong> March 2026</p>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>2. Description of Service</h2>
          <p>Our platform enables merchants to create, distribute, and manage digital vouchers, gift cards, event tickets, and promotional campaigns. Users can purchase, redeem, and share these digital products.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>3. User Accounts</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials, including passwords, passkeys, and two-factor authentication methods.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>4. Merchant Obligations</h2>
          <p>Merchants must honor all published vouchers and promotions. Merchants are responsible for the accuracy of their listings, pricing, and availability. Fraudulent or misleading listings will result in account suspension.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>5. Purchases & Payments</h2>
          <p>All payments are processed through Stripe. Prices are displayed in the local currency of the merchant. VAT/tax is calculated and displayed at checkout where applicable. Refund policies are set by individual merchants within platform guidelines.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>6. Voucher Redemption</h2>
          <p>Vouchers must be redeemed before their expiration date. Expired vouchers cannot be redeemed or refunded. Each voucher can only be redeemed once unless otherwise specified.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>7. Intellectual Property</h2>
          <p>All platform content, design, and technology are owned by us. Merchant content remains the property of the respective merchant. Users may not copy, distribute, or modify platform content without permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>8. Prohibited Activities</h2>
          <p>Users may not: create fake accounts, manipulate reviews or ratings, attempt to circumvent security measures, use the platform for illegal activities, or abuse the referral/loyalty programs.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>9. Limitation of Liability</h2>
          <p>We are not liable for disputes between merchants and users, technical outages beyond our control, or losses resulting from unauthorized account access due to user negligence.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>10. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. We will notify users of material changes via email or platform notification.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>11. Contact</h2>
          <p>For questions about these terms, contact us at <a href="/contact" className="underline" style={{ color: 'var(--primary)' }}>our contact page</a>.</p>
        </section>
      </div>
    </main>
  );
}
