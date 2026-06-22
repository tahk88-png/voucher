/**
 * OpenAPI 3.0.3 specification for the public GiftHub REST API.
 *
 * Served as JSON from `/api/openapi`. Keep this file the single
 * source of truth — don't duplicate endpoint shapes in tests,
 * docs, or client stubs; generate from here instead.
 *
 * When adding a route that a third party could call (any
 * non-session-only handler under app/api/**), extend this spec
 * in the same PR. The checklist:
 *   1. Add the path under `paths` with method + summary + tags
 *   2. Reference a reusable schema in `components.schemas` for
 *      request bodies and non-trivial responses
 *   3. Declare the security requirement on the operation (session
 *      cookie, API key, or anonymous)
 *   4. Include the canonical error responses ($ref to
 *      `#/components/responses/*`) for any authenticated route
 */

const unauthorizedResponse = {
  description: 'Authentication required',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      examples: { unauthorized: { value: { error: 'Unauthorized' } } },
    },
  },
};

const badRequestResponse = {
  description: 'Validation error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const notFoundResponse = {
  description: 'Resource not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const conflictResponse = {
  description: 'Conflict — e.g. duplicate resource',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GiftHub API',
    version: '1.0.0',
    description:
      'GiftHub public REST API for vouchers, campaigns, events, gift cards, reviews, loyalty, cashback, and merchant integrations. ' +
      'Session-cookie auth is the default; B2B/API-key auth is available for programmatic merchant access — see lib/b2b/auth.ts.',
  },
  servers: [
    { url: process.env.NEXTAUTH_URL || 'https://gifthub.app', description: 'Production' },
  ],
  security: [{ sessionCookie: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'Vouchers', description: 'Voucher management' },
    { name: 'Campaigns', description: 'Campaign management' },
    { name: 'Events', description: 'Event management' },
    { name: 'Tickets', description: 'Ticket purchases' },
    { name: 'Gift Cards', description: 'Gift card operations' },
    { name: 'Redemptions', description: 'Voucher and gift card redemptions' },
    { name: 'Referrals', description: 'Referral link management' },
    { name: 'Reviews', description: 'User-generated reviews and ratings' },
    { name: 'Loyalty', description: 'Loyalty tiers, points, and history' },
    { name: 'Cashback', description: 'User credit / cashback wallet summary' },
    { name: 'Webhooks', description: 'Outbound webhook endpoint management' },
    { name: 'Commerce', description: 'QR checkout, currency, subscriptions' },
    { name: 'User', description: 'User profile management' },
    { name: 'Utilities', description: 'QR codes and helpers' },
  ],
  paths: {
    // -----------------------------------------------------------
    // Auth
    // -----------------------------------------------------------
    '/api/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated user with token' },
          '401': unauthorizedResponse,
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': badRequestResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Vouchers
    // -----------------------------------------------------------
    '/api/vouchers': {
      get: {
        tags: ['Vouchers'],
        summary: 'List published vouchers',
        parameters: [
          { name: 'merchantId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'paused', 'ended'] } },
        ],
        responses: {
          '200': {
            description: 'Array of vouchers',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Voucher' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Vouchers'],
        summary: 'Create a voucher (merchant admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantId: { type: 'string' },
                  type: { type: 'string', enum: ['percentage', 'fixed_amount', 'credit_amount'] },
                  value: { type: 'integer' },
                  currency: { type: 'string' },
                  validFrom: { type: 'string', format: 'date-time' },
                  validTo: { type: 'string', format: 'date-time' },
                },
                required: ['merchantId', 'type', 'value', 'currency', 'validFrom', 'validTo'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Voucher created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
      },
    },
    '/api/vouchers/{id}': {
      get: {
        tags: ['Vouchers'],
        summary: 'Get voucher details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Voucher object', content: { 'application/json': { schema: { $ref: '#/components/schemas/Voucher' } } } },
          '404': notFoundResponse,
        },
      },
      put: {
        tags: ['Vouchers'],
        summary: 'Update a voucher',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Updated voucher' },
          '401': unauthorizedResponse,
          '404': notFoundResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Campaigns
    // -----------------------------------------------------------
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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantId: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                },
                required: ['merchantId', 'name', 'type', 'startDate', 'endDate'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Campaign created' },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
      },
    },
    '/api/campaigns/{id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Campaign with vouchers' },
          '404': notFoundResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Events + Tickets
    // -----------------------------------------------------------
    '/api/events': {
      get: { tags: ['Events'], summary: 'List events', responses: { '200': { description: 'Array of events' } } },
      post: {
        tags: ['Events'],
        summary: 'Create an event',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantId: { type: 'string' },
                  name: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Event created' }, '401': unauthorizedResponse },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event details with tickets',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Event object' }, '404': notFoundResponse },
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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  eventId: { type: 'string' },
                  ticketId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                },
                required: ['eventId', 'ticketId', 'quantity'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Purchase confirmed' },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Gift cards
    // -----------------------------------------------------------
    '/api/gift-cards': {
      get: { tags: ['Gift Cards'], summary: 'List gift cards', responses: { '200': { description: 'Array of gift cards' } } },
    },
    '/api/gift-cards/purchase': {
      post: {
        tags: ['Gift Cards'],
        summary: 'Purchase a gift card',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantId: { type: 'string' },
                  amount: { type: 'integer' },
                  currency: { type: 'string' },
                },
                required: ['merchantId', 'amount', 'currency'],
              },
            },
          },
        },
        responses: { '201': { description: 'Gift card created' }, '401': unauthorizedResponse },
      },
    },
    '/api/gift-cards/redeem': {
      post: {
        tags: ['Gift Cards'],
        summary: 'Redeem a gift card',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
            },
          },
        },
        responses: { '200': { description: 'Redemption result' }, '400': badRequestResponse },
      },
    },

    // -----------------------------------------------------------
    // Redemptions + Referrals
    // -----------------------------------------------------------
    '/api/redemptions': {
      post: {
        tags: ['Redemptions'],
        summary: 'Redeem a voucher',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  voucherId: { type: 'string' },
                  code: { type: 'string' },
                  merchantId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Redemption confirmed' },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
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
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { voucherId: { type: 'string' } } },
            },
          },
        },
        responses: { '201': { description: 'Referral link created' }, '401': unauthorizedResponse },
      },
    },
    '/api/referrals/{id}': {
      get: {
        tags: ['Referrals'],
        summary: 'Get referral stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Referral with click/conversion stats' },
          '404': notFoundResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Reviews (user-generated)
    // -----------------------------------------------------------
    '/api/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List published reviews for a merchant, voucher, or campaign',
        description:
          'Pass exactly one of `merchantId`, `voucherId`, or `campaignId`. Returns ' +
          'published reviews only — flagged/hidden rows are filtered out server-side.',
        parameters: [
          { name: 'merchantId', in: 'query', schema: { type: 'string' } },
          { name: 'voucherId', in: 'query', schema: { type: 'string' } },
          { name: 'campaignId', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'highest', 'helpful'], default: 'newest' } },
        ],
        responses: {
          '200': {
            description: 'Reviews with aggregate rating',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
                    total: { type: 'integer' },
                    avgRating: { type: 'number', minimum: 0, maximum: 5 },
                    totalReviews: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': badRequestResponse,
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Submit a review',
        description:
          'Creates a review for the signed-in user. Content is auto-moderated: ' +
          'clean content is `published`, borderline is `flagged` (visible but queued ' +
          'for moderation), abusive is `hidden`. One review per user per target.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantId: { type: 'string' },
                  voucherId: { type: 'string' },
                  campaignId: { type: 'string' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  title: { type: 'string' },
                  comment: { type: 'string' },
                },
                required: ['rating'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    review: { $ref: '#/components/schemas/Review' },
                    moderation: {
                      type: 'object',
                      properties: {
                        approved: { type: 'boolean' },
                        flags: { type: 'array', items: { type: 'string' } },
                        status: { type: 'string', enum: ['published', 'flagged', 'hidden'] },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
          '409': conflictResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Loyalty
    // -----------------------------------------------------------
    '/api/loyalty': {
      get: {
        tags: ['Loyalty'],
        summary: 'Get the signed-in user\'s loyalty status',
        description:
          'Returns current and next tier, progress toward the next tier, tier ' +
          'benefits, and the 20 most recent points log entries. The loyalty ' +
          'account is lazily created on first call.',
        responses: {
          '200': {
            description: 'Loyalty status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalPoints: { type: 'integer' },
                    lifetimePoints: { type: 'integer' },
                    currentTier: { $ref: '#/components/schemas/LoyaltyTier' },
                    nextTier: {
                      oneOf: [
                        { $ref: '#/components/schemas/LoyaltyTier' },
                        { type: 'null' },
                      ],
                    },
                    pointsToNextTier: { type: 'integer' },
                    progressPercent: { type: 'number', minimum: 0, maximum: 100 },
                    benefits: { type: 'array', items: { type: 'string' } },
                    allTiers: { type: 'array', items: { $ref: '#/components/schemas/LoyaltyTier' } },
                    pointsHistory: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          points: { type: 'integer' },
                          reason: { type: 'string' },
                          description: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    tierUpdatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Cashback wallet summary
    // -----------------------------------------------------------
    '/api/cashback/summary': {
      get: {
        tags: ['Cashback'],
        summary: 'Cross-merchant credit / cashback summary for the signed-in user',
        description:
          'Aggregates every CreditLedger entry for the user regardless of merchant. ' +
          'Unlike `/api/wallet/*` which is per-merchant, this endpoint is the ' +
          'source of truth for the global wallet page.',
        responses: {
          '200': {
            description: 'Aggregated cashback summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currencies: { type: 'array', items: { type: 'string' } },
                    totals: {
                      type: 'object',
                      properties: {
                        available: { type: 'integer' },
                        locked: { type: 'integer' },
                        used: { type: 'integer' },
                        expired: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                    byMerchant: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          merchantId: { type: 'string' },
                          slug: { type: 'string' },
                          name: { type: 'string' },
                          currency: { type: 'string' },
                          available: { type: 'integer' },
                          locked: { type: 'integer' },
                          used: { type: 'integer' },
                        },
                      },
                    },
                    expiringSoon: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          amount: { type: 'integer' },
                          currency: { type: 'string' },
                          expiresAt: { type: 'string', format: 'date-time' },
                          merchantName: { type: 'string' },
                          merchantSlug: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Merchant webhooks
    // -----------------------------------------------------------
    '/api/merchant/{slug}/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhook endpoints for a merchant',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Webhook endpoints, newest first. Delivery count included.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/WebhookEndpoint' } },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': { description: 'Caller lacks merchant_admin role' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Register a new webhook endpoint',
        description:
          'URL must be public HTTPS — localhost / private IPs / non-HTTPS are ' +
          'rejected (SSRF guard). The returned `secret` is a 64-char hex HMAC ' +
          'key; clients MUST verify the `X-Webhook-Signature` header on every ' +
          'delivery using this secret.',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  events: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                    description: 'E.g. ["voucher.redeemed", "campaign.ended"]',
                  },
                },
                required: ['url', 'events'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Endpoint created — `secret` is returned ONCE.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/WebhookEndpoint' },
                    { type: 'object', properties: { secret: { type: 'string', description: '64-char hex HMAC secret' } } },
                  ],
                },
              },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
          '403': { description: 'Caller lacks merchant_admin role' },
        },
      },
    },
    '/api/merchant/{slug}/webhooks/{id}': {
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete a webhook endpoint',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Endpoint deleted' },
          '401': unauthorizedResponse,
          '403': { description: 'Caller lacks merchant_admin role' },
          '404': notFoundResponse,
        },
      },
    },

    // -----------------------------------------------------------
    // Commerce utilities
    // -----------------------------------------------------------
    '/api/currency/rates': {
      get: { tags: ['Commerce'], summary: 'Get current exchange rates', responses: { '200': { description: 'Currency rates from ECB' } } },
    },
    '/api/qr-checkout': {
      post: {
        tags: ['Commerce'],
        summary: 'Create QR checkout intent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  merchantSlug: { type: 'string' },
                  voucherId: { type: 'string' },
                },
                required: ['merchantSlug'],
              },
            },
          },
        },
        responses: { '200': { description: 'Checkout intent with URL' }, '400': badRequestResponse },
      },
    },
    '/api/subscription-boxes': {
      get: { tags: ['Commerce'], summary: 'List subscription boxes', responses: { '200': { description: 'Array of subscription boxes' } } },
    },
    '/api/subscription-boxes/{id}/subscribe': {
      post: {
        tags: ['Commerce'],
        summary: 'Subscribe to a box',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Subscription created' }, '401': unauthorizedResponse },
      },
      delete: {
        tags: ['Commerce'],
        summary: 'Cancel subscription',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Subscription cancelled' }, '401': unauthorizedResponse },
      },
    },
    '/api/qr': {
      get: {
        tags: ['Utilities'],
        summary: 'Generate QR code',
        parameters: [{ name: 'text', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'QR code data URL' } },
      },
    },

    // -----------------------------------------------------------
    // User profile
    // -----------------------------------------------------------
    '/api/user/profile': {
      get: { tags: ['User'], summary: 'Get current user profile', responses: { '200': { description: 'User profile' }, '401': unauthorizedResponse } },
      put: {
        tags: ['User'],
        summary: 'Update profile',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  preferredLanguage: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Profile updated' }, '401': unauthorizedResponse },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description:
          'NextAuth v5 JWT session cookie, set after sign-in. The default auth ' +
          'for interactive browser flows.',
      },
      apiKey: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API key',
        description:
          'B2B API key as a Bearer token. Issued per merchant via the admin ' +
          'console; validated in lib/b2b/auth.ts. Use for programmatic ' +
          'integrations that cannot hold a browser session.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Human-readable error summary' },
          code: { type: 'string', description: 'Stable machine-readable error code (optional)' },
        },
        required: ['error'],
      },
      Voucher: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          merchantId: { type: 'string' },
          campaignId: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['percentage', 'fixed_amount', 'credit_amount'] },
          value: { type: 'integer', description: 'Minor units' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'paused', 'ended'] },
          validFrom: { type: 'string', format: 'date-time' },
          validTo: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          merchantId: { type: 'string', nullable: true },
          voucherId: { type: 'string', nullable: true },
          campaignId: { type: 'string', nullable: true },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', nullable: true },
          comment: { type: 'string', nullable: true },
          helpful: { type: 'integer' },
          verified: { type: 'boolean' },
          status: { type: 'string', enum: ['published', 'flagged', 'hidden'] },
          merchantReply: { type: 'string', nullable: true },
          merchantReplyAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoyaltyTier: {
        type: 'object',
        properties: {
          name: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
          label: { type: 'string' },
          color: { type: 'string' },
          icon: { type: 'string' },
          minPoints: { type: 'integer' },
          discountPercent: { type: 'number' },
          isCurrent: { type: 'boolean' },
        },
      },
      WebhookEndpoint: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          merchantId: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          _count: {
            type: 'object',
            properties: { deliveries: { type: 'integer' } },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
