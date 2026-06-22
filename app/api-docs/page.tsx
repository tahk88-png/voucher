'use client';

import { useState, useMemo } from 'react';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  params?: { name: string; type: string; required?: boolean; description: string }[];
  body?: Record<string, unknown>;
  response?: Record<string, unknown> | unknown[];
}

const ENDPOINTS: Endpoint[] = [
  // Auth
  { method: 'POST', path: '/api/auth/signin', description: 'Sign in with credentials or OAuth', category: 'Auth', body: { email: 'string', password: 'string' }, response: { user: { id: 'string', email: 'string' }, token: 'string' } },
  { method: 'POST', path: '/api/auth/register', description: 'Create a new user account', category: 'Auth', body: { name: 'string', email: 'string', password: 'string' }, response: { user: { id: 'string', email: 'string' } } },
  { method: 'POST', path: '/api/auth/magic-link', description: 'Send magic link login email', category: 'Auth', body: { email: 'string' }, response: { sent: true } },
  { method: 'POST', path: '/api/auth/reset-password', description: 'Request password reset', category: 'Auth', body: { email: 'string' }, response: { sent: true } },
  // Vouchers
  { method: 'GET', path: '/api/vouchers', description: 'List all published vouchers', category: 'Vouchers', params: [{ name: 'merchantId', type: 'string', description: 'Filter by merchant' }, { name: 'status', type: 'string', description: 'Filter by status (draft|published|paused|ended)' }], response: { vouchers: [{ id: 'string', type: 'string', value: 0, currency: 'EUR' }] } },
  { method: 'GET', path: '/api/vouchers/[id]', description: 'Get voucher details', category: 'Vouchers', params: [{ name: 'id', type: 'string', required: true, description: 'Voucher ID' }], response: { id: 'string', type: 'string', value: 0, currency: 'EUR', validFrom: 'ISO8601', validTo: 'ISO8601' } },
  { method: 'POST', path: '/api/vouchers', description: 'Create a new voucher (merchant admin)', category: 'Vouchers', body: { merchantId: 'string', type: 'percentage|fixed_amount|credit_amount', value: 1000, currency: 'EUR', validFrom: 'ISO8601', validTo: 'ISO8601' }, response: { id: 'string' } },
  { method: 'PUT', path: '/api/vouchers/[id]', description: 'Update voucher details', category: 'Vouchers', body: { status: 'string', value: 0 }, response: { id: 'string', status: 'string' } },
  // Campaigns
  { method: 'GET', path: '/api/campaigns', description: 'List campaigns', category: 'Campaigns', params: [{ name: 'merchantId', type: 'string', description: 'Filter by merchant' }], response: { campaigns: [{ id: 'string', name: 'string', status: 'string' }] } },
  { method: 'POST', path: '/api/campaigns', description: 'Create a new campaign', category: 'Campaigns', body: { merchantId: 'string', name: 'string', type: 'weekly|limited', startDate: 'ISO8601', endDate: 'ISO8601' }, response: { id: 'string' } },
  { method: 'GET', path: '/api/campaigns/[id]', description: 'Get campaign details', category: 'Campaigns', params: [{ name: 'id', type: 'string', required: true, description: 'Campaign ID' }], response: { id: 'string', name: 'string', vouchers: [] } },
  // Events
  { method: 'GET', path: '/api/events', description: 'List upcoming events', category: 'Events', response: { events: [{ id: 'string', name: 'string', date: 'ISO8601' }] } },
  { method: 'POST', path: '/api/events', description: 'Create a new event', category: 'Events', body: { merchantId: 'string', name: 'string', date: 'ISO8601', venue: 'string' }, response: { id: 'string' } },
  { method: 'GET', path: '/api/events/[id]', description: 'Get event details with tickets', category: 'Events', response: { id: 'string', name: 'string', tickets: [] } },
  // Tickets
  { method: 'GET', path: '/api/tickets', description: 'List tickets for an event', category: 'Tickets', params: [{ name: 'eventId', type: 'string', required: true, description: 'Event ID' }], response: { tickets: [{ id: 'string', code: 'string', status: 'string' }] } },
  { method: 'POST', path: '/api/tickets/purchase', description: 'Purchase tickets for an event', category: 'Tickets', body: { eventId: 'string', ticketId: 'string', quantity: 1 }, response: { purchaseId: 'string', tickets: [] } },
  // Gift Cards
  { method: 'GET', path: '/api/gift-cards', description: 'List gift cards', category: 'Gift Cards', response: { giftCards: [{ id: 'string', code: 'string', amount: 0 }] } },
  { method: 'POST', path: '/api/gift-cards/purchase', description: 'Purchase a gift card', category: 'Gift Cards', body: { merchantId: 'string', amount: 5000, currency: 'EUR' }, response: { giftCard: { id: 'string', code: 'string' } } },
  { method: 'POST', path: '/api/gift-cards/redeem', description: 'Redeem a gift card by code', category: 'Gift Cards', body: { code: 'string' }, response: { success: true, remainingBalance: 0 } },
  // Redemptions
  { method: 'POST', path: '/api/redemptions', description: 'Redeem a voucher', category: 'Redemptions', body: { voucherId: 'string', code: 'string', merchantId: 'string' }, response: { redemptionId: 'string', status: 'confirmed' } },
  { method: 'GET', path: '/api/redemptions', description: 'List redemptions for a merchant', category: 'Redemptions', params: [{ name: 'merchantId', type: 'string', required: true, description: 'Merchant ID' }], response: { redemptions: [] } },
  // Commerce
  { method: 'GET', path: '/api/currency/rates', description: 'Get current exchange rates', category: 'Commerce', response: { currencies: ['EUR', 'USD'], rates: [{ from: 'EUR', to: 'USD', rate: 1.08 }] } },
  { method: 'POST', path: '/api/qr-checkout', description: 'Create a QR checkout intent', category: 'Commerce', body: { merchantSlug: 'string', voucherId: 'string (optional)' }, response: { intentId: 'string', checkoutUrl: 'string' } },
  { method: 'GET', path: '/api/subscription-boxes', description: 'List available subscription boxes', category: 'Commerce', response: [{ id: 'string', name: 'string', priceCents: 0, currency: 'EUR' }] },
  { method: 'POST', path: '/api/subscription-boxes/[id]/subscribe', description: 'Subscribe to a box', category: 'Commerce', response: { id: 'string', status: 'active' } },
  // Referrals
  { method: 'POST', path: '/api/referrals', description: 'Create a referral link', category: 'Referrals', body: { voucherId: 'string' }, response: { referralId: 'string', link: 'string' } },
  { method: 'GET', path: '/api/referrals/[id]', description: 'Get referral details and stats', category: 'Referrals', response: { id: 'string', clicks: 0, conversions: 0 } },
  // QR
  { method: 'GET', path: '/api/qr', description: 'Generate a QR code data URL', category: 'Utilities', params: [{ name: 'text', type: 'string', required: true, description: 'Text to encode' }], response: { dataUrl: 'data:image/png;base64,...' } },
  // Merchants
  { method: 'GET', path: '/api/merchant/[slug]/vouchers', description: 'List vouchers for a merchant', category: 'Merchants', response: { vouchers: [] } },
  { method: 'GET', path: '/api/merchant/[slug]/subscription-boxes', description: 'List subscription boxes for a merchant', category: 'Merchants', response: [] },
  // User
  { method: 'GET', path: '/api/user/profile', description: 'Get current user profile', category: 'User', response: { id: 'string', email: 'string', name: 'string' } },
  { method: 'PUT', path: '/api/user/profile', description: 'Update user profile', category: 'User', body: { name: 'string', preferredLanguage: 'en' }, response: { success: true } },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[#dfecd9] text-[#3d6e48]',
  POST: 'bg-[#dde6ec] text-[#3c5263]',
  PUT: 'bg-[#f4e9d4] text-[#8f6722]',
  DELETE: 'bg-[#f6ddd6] text-[#a23c2b]',
};

const CATEGORIES = ['Auth', 'Vouchers', 'Campaigns', 'Events', 'Tickets', 'Gift Cards', 'Redemptions', 'Referrals', 'Commerce', 'Merchants', 'User', 'Utilities'];

export default function APIDocsPage() {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!search) return ENDPOINTS;
    const q = search.toLowerCase();
    return ENDPOINTS.filter(
      (e) => e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q),
    );
  }, [search]);

  const toggleSection = (cat: string) => {
    setOpenSections((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#2D2721]">API Documentation</h1>
          </div>
          <p className="text-[#6b5e52] mb-6">
            REST API reference for integrating with GiftHub. Base URL: <code className="bg-[#f0ebe5] px-2 py-0.5 rounded text-sm font-mono">{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}</code>
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search endpoints..."
              className="flex-1 border border-[#e8e0d8] rounded-xl px-4 py-2.5 bg-white text-[#2D2721] focus:outline-none focus:ring-2 focus:ring-[#cc785c]"
            />
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#cc785c] hover:underline font-medium whitespace-nowrap"
            >
              OpenAPI JSON
            </a>
          </div>
        </div>

        {/* Endpoint groups */}
        {CATEGORIES.map((cat) => {
          const catEndpoints = filtered.filter((e) => e.category === cat);
          if (catEndpoints.length === 0) return null;
          const isOpen = openSections[cat] !== false; // default open

          return (
            <div key={cat} className="mb-4">
              <button
                onClick={() => toggleSection(cat)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between bg-white rounded-xl border border-[#e8e0d8] px-5 py-3 hover:bg-[#faf8f5] transition"
              >
                <span className="font-semibold text-[#2D2721]">{cat}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6b5e52] bg-[#f0ebe5] px-2 py-0.5 rounded-full">{catEndpoints.length}</span>
                  <svg className={`w-4 h-4 text-[#6b5e52] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {isOpen && (
                <div className="mt-1 space-y-1">
                  {catEndpoints.map((ep) => {
                    const key = `${ep.method}-${ep.path}`;
                    const expanded = expandedEndpoints[key];
                    return (
                      <div key={key} className="bg-white rounded-xl border border-[#e8e0d8] overflow-hidden">
                        <button
                          onClick={() => toggleEndpoint(key)}
                          aria-expanded={!!expanded}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#faf8f5] transition"
                        >
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                            {ep.method}
                          </span>
                          <code className="text-sm font-mono text-[#2D2721] flex-1">{ep.path}</code>
                          <span className="text-sm text-[#6b5e52] hidden sm:inline">{ep.description}</span>
                        </button>
                        {expanded && (
                          <div className="px-5 pb-4 border-t border-[#f0ebe5] pt-3 space-y-3">
                            <p className="text-sm text-[#6b5e52]">{ep.description}</p>
                            {ep.params && ep.params.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-[#2D2721] uppercase tracking-wider mb-1">Parameters</h4>
                                <div className="bg-[#faf8f5] rounded-lg p-3 space-y-1">
                                  {ep.params.map((p) => (
                                    <div key={p.name} className="flex items-start gap-2 text-sm">
                                      <code className="font-mono text-[#cc785c]">{p.name}</code>
                                      <span className="text-[#6b5e52]">{p.type}</span>
                                      {p.required && <span className="text-red-500 text-xs">required</span>}
                                      <span className="text-[#6b5e52]">- {p.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ep.body && (
                              <div>
                                <h4 className="text-xs font-semibold text-[#2D2721] uppercase tracking-wider mb-1">Request Body</h4>
                                <pre className="bg-[#2D2721] text-[#f0ebe5] rounded-lg p-3 text-sm overflow-x-auto font-mono">
                                  {JSON.stringify(ep.body, null, 2)}
                                </pre>
                              </div>
                            )}
                            {ep.response && (
                              <div>
                                <h4 className="text-xs font-semibold text-[#2D2721] uppercase tracking-wider mb-1">Response</h4>
                                <pre className="bg-[#2D2721] text-[#f0ebe5] rounded-lg p-3 text-sm overflow-x-auto font-mono">
                                  {JSON.stringify(ep.response, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
