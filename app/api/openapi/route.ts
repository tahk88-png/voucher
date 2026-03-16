import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'GiftHub API',
    version: '1.0.0',
    description: 'GiftHub public REST API for vouchers, campaigns, events, gift cards, and commerce.',
  },
  servers: [
    { url: process.env.NEXTAUTH_URL || 'https://gifthub.app', description: 'Production' },
  ],
  paths: {
    '/api/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
        responses: { '200': { description: 'Authenticated user with token' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
        responses: { '201': { description: 'Account created' } },
      },
    },
    '/api/vouchers': {
      get: {
        tags: ['Vouchers'],
        summary: 'List published vouchers',
        parameters: [
          { name: 'merchantId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'paused', 'ended'] } },
        ],
        responses: { '200': { description: 'Array of vouchers' } },
      },
      post: {
        tags: ['Vouchers'],
        summary: 'Create a voucher (merchant admin)',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { merchantId: { type: 'string' }, type: { type: 'string', enum: ['percentage', 'fixed_amount', 'credit_amount'] }, value: { type: 'integer' }, currency: { type: 'string' }, validFrom: { type: 'string', format: 'date-time' }, validTo: { type: 'string', format: 'date-time' } }, required: ['merchantId', 'type', 'value', 'currency', 'validFrom', 'validTo'] } } } },
        responses: { '201': { description: 'Voucher created' } },
      },
    },
    '/api/vouchers/{id}': {
      get: {
        tags: ['Vouchers'],
        summary: 'Get voucher details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Voucher object' } },
      },
      put: {
        tags: ['Vouchers'],
        summary: 'Update a voucher',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated voucher' } },
      },
    },
    '/api/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        parameters: [{ name: 'merchantId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Array of campaigns' } },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create a campaign',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { merchantId: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' } }, required: ['merchantId', 'name', 'type', 'startDate', 'endDate'] } } } },
        responses: { '201': { description: 'Campaign created' } },
      },
    },
    '/api/campaigns/{id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Campaign with vouchers' } },
      },
    },
    '/api/events': {
      get: { tags: ['Events'], summary: 'List events', responses: { '200': { description: 'Array of events' } } },
      post: {
        tags: ['Events'],
        summary: 'Create an event',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { merchantId: { type: 'string' }, name: { type: 'string' }, date: { type: 'string', format: 'date-time' } } } } } },
        responses: { '201': { description: 'Event created' } },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event details with tickets',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Event object' } },
      },
    },
    '/api/tickets': {
      get: {
        tags: ['Tickets'],
        summary: 'List tickets for an event',
        parameters: [{ name: 'eventId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Array of tickets' } },
      },
    },
    '/api/tickets/purchase': {
      post: {
        tags: ['Tickets'],
        summary: 'Purchase tickets',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { eventId: { type: 'string' }, ticketId: { type: 'string' }, quantity: { type: 'integer' } } } } } },
        responses: { '201': { description: 'Purchase confirmed' } },
      },
    },
    '/api/gift-cards': {
      get: { tags: ['Gift Cards'], summary: 'List gift cards', responses: { '200': { description: 'Array of gift cards' } } },
    },
    '/api/gift-cards/purchase': {
      post: {
        tags: ['Gift Cards'],
        summary: 'Purchase a gift card',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { merchantId: { type: 'string' }, amount: { type: 'integer' }, currency: { type: 'string' } } } } } },
        responses: { '201': { description: 'Gift card created' } },
      },
    },
    '/api/gift-cards/redeem': {
      post: {
        tags: ['Gift Cards'],
        summary: 'Redeem a gift card',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } } } },
        responses: { '200': { description: 'Redemption result' } },
      },
    },
    '/api/redemptions': {
      post: {
        tags: ['Redemptions'],
        summary: 'Redeem a voucher',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { voucherId: { type: 'string' }, code: { type: 'string' }, merchantId: { type: 'string' } } } } } },
        responses: { '200': { description: 'Redemption confirmed' } },
      },
      get: {
        tags: ['Redemptions'],
        summary: 'List redemptions',
        parameters: [{ name: 'merchantId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Array of redemptions' } },
      },
    },
    '/api/referrals': {
      post: {
        tags: ['Referrals'],
        summary: 'Create a referral link',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { voucherId: { type: 'string' } } } } } },
        responses: { '201': { description: 'Referral link created' } },
      },
    },
    '/api/referrals/{id}': {
      get: {
        tags: ['Referrals'],
        summary: 'Get referral stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Referral with click/conversion stats' } },
      },
    },
    '/api/currency/rates': {
      get: { tags: ['Commerce'], summary: 'Get current exchange rates', responses: { '200': { description: 'Currency rates from ECB' } } },
    },
    '/api/qr-checkout': {
      post: {
        tags: ['Commerce'],
        summary: 'Create QR checkout intent',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { merchantSlug: { type: 'string' }, voucherId: { type: 'string' } }, required: ['merchantSlug'] } } } },
        responses: { '200': { description: 'Checkout intent with URL' } },
      },
    },
    '/api/subscription-boxes': {
      get: { tags: ['Commerce'], summary: 'List subscription boxes', responses: { '200': { description: 'Array of subscription boxes' } } },
    },
    '/api/subscription-boxes/{id}/subscribe': {
      post: { tags: ['Commerce'], summary: 'Subscribe to a box', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Subscription created' } } },
      delete: { tags: ['Commerce'], summary: 'Cancel subscription', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Subscription cancelled' } } },
    },
    '/api/qr': {
      get: {
        tags: ['Utilities'],
        summary: 'Generate QR code',
        parameters: [{ name: 'text', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'QR code data URL' } },
      },
    },
    '/api/user/profile': {
      get: { tags: ['User'], summary: 'Get current user profile', responses: { '200': { description: 'User profile' } } },
      put: {
        tags: ['User'],
        summary: 'Update profile',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, preferredLanguage: { type: 'string' } } } } } },
        responses: { '200': { description: 'Profile updated' } },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'Vouchers', description: 'Voucher management' },
    { name: 'Campaigns', description: 'Campaign management' },
    { name: 'Events', description: 'Event management' },
    { name: 'Tickets', description: 'Ticket purchases' },
    { name: 'Gift Cards', description: 'Gift card operations' },
    { name: 'Redemptions', description: 'Voucher and gift card redemptions' },
    { name: 'Referrals', description: 'Referral link management' },
    { name: 'Commerce', description: 'QR checkout, currency, subscriptions' },
    { name: 'User', description: 'User profile management' },
    { name: 'Utilities', description: 'QR codes and helpers' },
  ],
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
