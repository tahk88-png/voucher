# Vouchr

Merchant-owned referral infrastructure: branded vouchers and store credit. Pay for results, not reach. Production-ready, global, multi-tenant; Web and PWA.

**Status**: Production-ready. Core commerce, payouts, loyalty, and observability all shipped. See the feature matrix below for the current-state breakdown.

## Quick Links

- [Contributing](CONTRIBUTING.md) — setup, conventions, PR checklist
- [Architecture Decision Records](docs/adr/README.md) — the "why" behind key choices
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) — pre-production gate
- [Configuration Guide](docs/CONFIGURATION_GUIDE.md) — every env var explained
- [API Reference](docs/API.md) — public REST + webhook surface
- [Monitoring](docs/MONITORING.md) — Sentry, Prometheus, cron telemetry
- [Security Checklist](docs/SECURITY_CHECKLIST.md) — live hardening list
- [Backup Strategy](docs/BACKUP_STRATEGY.md) — DB backup + restore runbook
- [Historical docs](docs/archive/README.md) — MVP-era snapshots (read-only)

## Feature matrix

| Area | State | Notes |
|---|---|---|
| Auth (OTP / password / OAuth / Passkeys / TOTP) | Shipped | NextAuth v5, JWT sessions — see [ADR-0003](docs/adr/0003-nextauth-v5-jwt-sessions.md) |
| Multi-tenant merchant panel (campaigns / vouchers / gift cards / team) | Shipped | `app/merchant/[slug]/*` |
| Admin control panel (RBAC / audit / moderation / flags / ops / analytics) | Shipped | `app/admin/*`, 5 admin sub-roles |
| Stripe checkout + webhooks | Shipped | `app/api/stripe/*` |
| Merchant payouts — Stripe Connect | Shipped | Account onboarding, `transfer_data` + `application_fee_amount` on checkout |
| Email sender system (queue / suppression / webhook / templates) | Shipped | DB-backed queue — see [ADR-0001](docs/adr/0001-database-backed-email-queue.md), Resend + SES + SMTP — [ADR-0002](docs/adr/0002-resend-primary-email-provider.md) |
| i18n (15 locales) | Shipped | next-intl with "as-needed" prefix — see [ADR-0004](docs/adr/0004-next-intl-as-needed-locale-prefix.md) |
| Domain verification (merchant custom domain) | Shipped | DNS TXT record check |
| Merchant outbound webhooks | Shipped | HMAC-signed, event-filtered, SSRF-blocked |
| User cashback tracking | Shipped | `app/app/cashback`, reuses `CreditLedger` |
| Merchant notification preferences | Shipped | Per-member `notificationPrefs` JSONB |
| Reviews & ratings | Shipped | Wired into campaign detail page |
| Loyalty tiers (bronze / silver / gold / platinum / diamond) | Shipped | Nightly recompute cron `/api/cron/loyalty-tiers` |
| Gamification (streaks / badges / levels) | Shipped | Sweep cron `/api/cron/streaks-badges` |
| PWA (installable, offline QR) | Shipped | `next-pwa` + service worker |
| Sentry (client / server / edge) | Shipped | `browserTracingIntegration` for WebAPI spans |
| Web Vitals reporting (CLS / INP / LCP / FCP / TTFB) | Shipped | `components/web-vitals.tsx` → `/api/metrics/vitals` |
| Prometheus metrics (HTTP / DB / cache / rate-limit / email-queue / payout-backlog) | Shipped | `/api/admin/ops/metrics/prometheus` |
| Bundle analyzer | Opt-in | `pnpm build:analyze` |
| Subscription boxes | Models only | Not yet shipped — schema in place |
| Rentals | Models only | Under review — likely to be removed |
| Storybook / component docs | Not started | Deferred pending design-system owner |

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI, warm design tokens — see [ADR-0005](docs/adr/0005-warm-design-tokens.md)
- **Backend**: Next.js Route Handlers, NextAuth v5
- **Database**: PostgreSQL + Prisma ORM (40+ models)
- **Cache / rate limit**: Redis (distributed) with in-memory fallback
- **Payments**: Stripe Checkout + Stripe Connect (transfer_data)
- **Email**: Resend (primary) → SES → SMTP failover
- **Observability**: Sentry + Winston logger + Prometheus scrape endpoint

## Getting Started

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Docker Desktop** (for local PostgreSQL database)
- **npm** (comes with Node.js)

### Quick Start (One-Liner)

```bash
npm install && cp .env.example .env && npm run db:setup && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and verify health at [http://localhost:3000/api/health](http://localhost:3000/api/health).

### Full Setup (Step-by-Step)

#### 1. Clone and Install

```bash
git clone <repository-url>
cd voucher
npm install
```

#### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env
```

**Required variables** (edit `.env`):

- `DATABASE_URL`: Already set to match docker-compose.yml (`postgresql://voucher_user:voucher_pass@localhost:5433/voucher_db`)
- `AUTH_SECRET`: Generate a random string (min 32 chars). Example:

  ```bash
  # On Linux/Mac: openssl rand -base64 32
  # On Windows: use an online generator or PowerShell
  ```

- `NEXTAUTH_URL`: Set to `http://localhost:3000`

**Optional variables** (for full functionality):

- Stripe keys (for payments)
- Resend API key or SMTP settings (for email magic links)
- OAuth provider credentials (Google, Apple)

**Validate environment**:

```bash
npm run validate:env
```

#### 3. Database Setup

##### Option A: Automated (Recommended)

```bash
# Checks Docker, starts containers, waits for DB, pushes schema, seeds
npm run db:setup
```

##### Option B: Manual Steps

```bash
# Check Docker Desktop is running
npm run db:check

# Start Docker containers (PostgreSQL + Redis)
npm run docker:up

# Wait for database to be ready
npm run db:wait

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed
```

##### Reset database (fresh start)

```bash
npm run db:reset
```

#### 4. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Figma Design Preview

The merged Figma UI is available under `/figma`. Open [http://localhost:3000/figma](http://localhost:3000/figma) to browse the full design route list. Dynamic routes use `demo` as the placeholder id.

#### 5. Verify Setup

**Health Check**:

```bash
# In browser or terminal:
curl http://localhost:3000/api/health
# Should return: {"status":"ok","database":"connected","timestamp":"..."}
```

**Full Verification**:

```bash
# Verify MVP setup is correct
npm run verify:setup

# Test launch mode functionality
npm run test:launch-mode
```

### Verification Checklist

After setup, verify:

- [ ] App opens at <http://localhost:3000>
- [ ] Health endpoint returns `{"status":"ok","database":"connected"}` at <http://localhost:3000/api/health>
- [ ] Database connection works (health check passes)
- [ ] Can access login/auth pages
- [ ] Test user exists: `test@example.com` / `test123` (if seeded)

### Troubleshooting

#### Docker Issues

**Problem**: `docker: command not found` or Docker Desktop not running

```bash
# Check Docker status
npm run db:check

# If Docker Desktop is not installed:
# Download from https://www.docker.com/products/docker-desktop
# Start Docker Desktop, wait for it to fully start (whale icon in system tray)
```

**Problem**: Port 5432 already in use

```bash
# Check what's using the port
# Windows: netstat -ano | findstr :5432
# Linux/Mac: lsof -i :5432

# Option 1: Stop the conflicting service
# Option 2: Change port in docker-compose.yml and update DATABASE_URL
```

**Problem**: Database container won't start

```bash
# Check logs
npm run docker:logs

# Reset containers
npm run docker:down
npm run docker:up
```

#### Environment Issues

**Problem**: `AUTH_SECRET must be at least 32 characters`

```bash
# Generate a new secret (32+ chars)
# Update .env file
# Validate again
npm run validate:env
```

**Problem**: `DATABASE_URL` connection fails

```bash
# Verify DATABASE_URL matches docker-compose.yml
# Check docker containers are running: docker ps
# Verify port 5432 is accessible: npm run db:wait
```

#### Build/Dev Server Issues

**Problem**: Build cache errors or stale Next.js cache

```bash
# Clean build cache
npm run clean

# Restart dev server
npm run dev
```

**Problem**: TypeScript/Prisma errors

```bash
# Regenerate Prisma client
npx prisma generate

# Restart dev server
npm run dev
```

#### Database Migration Issues

**Problem**: Schema out of sync

```bash
# Reset and re-push schema (⚠️ deletes all data)
npm run db:reset

# Or use migrations (preserves data)
npm run db:migrate
```

### Available Scripts

**Development**:

- `npm run dev` - Start dev server
- `npm run dev:full` - Full dev startup (Windows PowerShell script)
- `npm run dev:clean` - Clean build cache and start dev server

**Database**:

- `npm run db:setup` - Complete database setup (check Docker → start → wait → push → seed)
- `npm run db:reset` - Reset database (down → up → wait → push → seed)
- `npm run db:push` - Push Prisma schema to database
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:ensure-test-user` - Ensure test user exists
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:check` - Check Docker Desktop status
- `npm run db:wait` - Wait for database to be ready

**Docker**:

- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View Docker logs

**Build & Test**:

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests (Playwright)

**Validation**:

- `npm run validate:env` - Validate environment variables
- `npm run verify:setup` - Verify MVP setup
- `npm run test:launch-mode` - Test launch mode functionality
- `npm run check:migrations` - Check migration status

## Project Structure

```text
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── app/               # User app pages
│   ├── merchant/          # Merchant dashboard
│   ├── m/                 # Public merchant pages
│   ├── v/                 # Public voucher pages
│   └── r/                 # Public referral pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── rbac.ts           # Role-based access control
│   ├── tenant.ts         # Multi-tenant utilities
│   ├── fraud.ts          # Fraud prevention
│   ├── credits.ts        # Credit management
│   └── merchant-status.ts # Launch mode (kill switch, feature flags)
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed script
│   └── migrations/       # Database migrations
├── scripts/              # Utility scripts
│   ├── verify-mvp-setup.ts    # Verify MVP setup
│   ├── test-launch-mode.ts    # Test launch mode
│   └── check-migrations.ts    # Check migration status
└── public/               # Static assets
```

## Core Flows

### 1. Merchant Creates Voucher

1. Navigate to `/merchant/[slug]/vouchers/new`
2. Fill in voucher details (type, value, validity, limits)
3. Configure weekly drop (optional)
4. Design voucher (colors, headline, fine print)
5. Publish voucher

### 2. User Shares Voucher

1. User opens voucher landing page (`/v/[id]`)
2. Clicks "Share & Earn Credit"
3. System creates referral and generates share URL
4. User shares link via native share sheet or copy

### 3. Friend Redeems Voucher

1. Friend opens referral link (`/r/[id]`)
2. Sees branded voucher with QR code
3. Redeems online or in-store
4. System creates redemption (unconfirmed for in-store)
5. Locked credit created for referrer

### 4. Staff Confirms Redemption

1. Staff views redemptions at `/merchant/[slug]/redemptions`
2. Confirms in-store redemption
3. Credit unlocks for referrer

### 5. Referrer Uses Credit

1. View wallet at `/app/[merchantSlug]/wallet`
2. Go to checkout demo at `/app/[merchantSlug]/checkout-demo`
3. Apply credit to order

## API Endpoints

See [API Documentation](./docs/API.md) for complete API reference.

### Merchant Vouchers

- `POST /api/merchant/[slug]/vouchers` - Create voucher
- `GET /api/merchant/[slug]/vouchers` - List vouchers
- `GET /api/merchant/[slug]/vouchers/[id]` - Get voucher
- `PUT /api/merchant/[slug]/vouchers/[id]` - Update voucher
- `POST /api/vouchers/[id]/publish` - Publish voucher
- `POST /api/vouchers/[id]/purchase` - Purchase voucher (Stripe checkout)
- `POST /api/vouchers/[id]/grant` - Grant free voucher

### Campaigns

- `POST /api/merchant/[slug]/campaigns` - Create campaign
- `GET /api/merchant/[slug]/campaigns` - List campaigns
- `GET /api/campaigns/[id]` - Get campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `POST /api/campaigns/[id]/generate-vouchers` - Generate vouchers from campaign

### Events

- `POST /api/merchant/[slug]/events` - Create event
- `GET /api/merchant/[slug]/events` - List events
- `GET /api/events/[id]` - Get event
- `PUT /api/events/[id]` - Update event
- `POST /api/events/[id]/publish` - Publish event
- `POST /api/events/[id]/generate-tickets` - Generate tickets for event

### Tickets

- `POST /api/tickets/[id]/purchase` - Purchase ticket (Stripe checkout)

### Referrals

- `POST /api/referrals/create` - Create referral and get share URL

### Redemptions

- `POST /api/redemptions` - Create redemption
- `POST /api/redemptions/[id]/confirm` - Confirm redemption (staff)

### Credits

- `GET /api/wallet/[merchantSlug]` - Get credit balance
- `POST /api/credits/apply` - Apply credit to order

### Weekly Drop

- `POST /api/weekly-drop/claim` - Claim weekly drop stock

### Health

- `GET /api/health` - Health check endpoint (returns app and database status)

### B2B Organizations & Vouchers (new)

Authentication: `Authorization: Bearer <jwt>` (user session)

- `GET /api/orgs` - List user orgs
- `GET /api/orgs/{orgId}/members` - List org members
- `POST /api/orgs/{orgId}/members` - Invite existing user to org
- `GET /api/orgs/{orgId}/campaigns` - List B2B campaigns
- `POST /api/orgs/{orgId}/campaigns` - Create B2B campaign
- `GET /api/orgs/{orgId}/campaigns/{campaignId}` - Get campaign
- `PATCH /api/orgs/{orgId}/campaigns/{campaignId}` - Update campaign
- `POST /api/orgs/{orgId}/campaigns/{campaignId}/activate` - Activate
- `POST /api/orgs/{orgId}/campaigns/{campaignId}/pause` - Pause
- `POST /api/orgs/{orgId}/campaigns/{campaignId}/archive` - Archive
- `POST /api/orgs/{orgId}/campaigns/{campaignId}/vouchers/bulk-create` - Bulk issue
- `GET /api/orgs/{orgId}/vouchers` - List vouchers
- `GET /api/orgs/{orgId}/vouchers/{voucherId}` - Get voucher
- `POST /api/orgs/{orgId}/vouchers/{voucherId}/activate` - Activate voucher
- `POST /api/orgs/{orgId}/vouchers/{voucherId}/void` - Void voucher
- `GET /api/orgs/{orgId}/orders` - List orders
- `POST /api/orgs/{orgId}/orders` - Create order
- `GET /api/orgs/{orgId}/orders/{orderId}` - Get order
- `POST /api/orgs/{orgId}/orders/{orderId}/submit` - Submit order
- `POST /api/orgs/{orgId}/orders/{orderId}/generate-invoice` - Generate invoice
- `POST /api/orgs/{orgId}/orders/{orderId}/mark-paid` - Mark paid
- `GET /api/orgs/{orgId}/audit` - Audit events

Partner API (requires `X-Partner-Key` header):

- `POST /api/public/vouchers/validate` - Validate voucher (partner-side)
- `POST /api/partner/redemptions` - Redeem voucher (idempotent, requires `Idempotency-Key`)
- `POST /api/partner/redemptions/{redemptionId}/reverse` - Reverse redemption

Demo partner key (seeded): `partner_demo_key_coffee_house`

## Database Schema

Key models:

- `Merchant`: Tenant information
- `User`: Platform users
- `MerchantMember`: User-merchant relationships with roles
- `Voucher`: Voucher definitions
- `Campaign`: Campaign definitions (pricing, limits, credit percentages)
- `VoucherPurchase`: Voucher purchase records
- `Event`: Event definitions
- `Ticket`: Ticket instances for events
- `TicketPurchase`: Ticket purchase records
- `Referral`: Referral instances
- `Redemption`: Redemption records
- `CreditLedger`: Credit transactions
- `CreditUsage`: Credit application records
- `AuditLog`: Audit trail
- `Organization` + `OrgMembership`: B2B companies + RBAC
- `VoucherCampaign` + `VoucherInstance`: B2B voucher lifecycle
- `B2BOrder` + `B2BInvoice`: B2B purchasing
- `VoucherRedemption`: Partner-side redemption (idempotent)
- `AuditEvent`: B2B audit stream

See `prisma/schema.prisma` for full schema.

## Business Rules

1. **Credit is NOT cash**: Cannot be transferred or withdrawn
2. **Per-merchant credits**: Credits are merchant-specific
3. **Credit expiration**: Default 60 days (configurable per merchant)
4. **Self-referral prevention**: Users cannot redeem their own referrals
5. **Credit locking**: Credits start as LOCKED, unlock after redemption confirmation
6. **Weekly drop stock**: Enforced atomically
7. **Usage limits**: Total and per-user limits enforced

## Testing

Run tests:

```bash
npm test
```

## Deployment

Production and CI/CD are fully documented in `DEPLOYMENT.md` with Docker + GitHub Actions.
Quick reference:

```bash
# Build locally
npm run build

# Docker (local)
docker compose up -d --build
```

Staging/Prod via GitHub Actions:
- **staging**: push to `main`
- **production**: push tag `v*.*.*`

See `DEPLOYMENT.md` for environment variables, migrations, and rollback.

### Environment Variables

Ensure all required environment variables are set in production:

- Database connection
- Auth secrets
- OAuth provider credentials
- SMTP settings
- Object storage (for brand assets)

### Database Migrations

In production, use migrations:

```bash
npm run db:migrate
```

### Build

```bash
npm run build
npm start
```

## Documentation

- [API Documentation](./docs/API.md)
- [How to Add a New Locale](./docs/I18N.md)
- [How to Add a New Merchant Currency](./docs/CURRENCIES.md)

## License

[Your License Here]
