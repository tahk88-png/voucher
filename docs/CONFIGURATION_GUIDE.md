# Configuration Guide

Complete guide for configuring all MVP components for development and production.

## Environment Variables

### Required for MVP

Copy `.env.example` to `.env` and configure:

```bash
# App Configuration
NODE_ENV=development  # or 'production'
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/voucher_db

# Auth (Required)
AUTH_SECRET=your-secret-key-min-32-chars  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000  # Must match NEXT_PUBLIC_APP_URL
```

### Email Configuration (Choose One)

#### Option 1: Resend (Recommended)

```bash
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Option 2: SMTP

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

### Stripe (For Payments)

```bash
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...
```

### OAuth (Optional)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Apple OAuth
APPLE_ID=your-apple-id
APPLE_SECRET=your-secret
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key
```

### Launch Mode

```bash
# Platform admin emails (comma-separated)
PLATFORM_ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Cron secret (for credit expiry warnings)
CRON_SECRET=your-cron-secret  # Generate: openssl rand -base64 32
```

### Optional Services

```bash
# Redis (for caching/rate limiting)
REDIS_URL=redis://localhost:6379

# Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Database Setup

### 1. Create Database

```bash
# Using Docker (recommended for local dev)
npm run docker:up

# Or create manually in PostgreSQL
createdb voucher_db
```

### 2. Run Migrations

```bash
# Development (creates migration files)
npm run db:migrate

# Production (applies existing migrations)
npx prisma migrate deploy
```

### 3. Seed Data

```bash
npm run db:seed
```

This creates:

- Test merchant (Coffee House)
- Admin user: `admin@coffee-house.com`
- Regular user: `user@example.com`
- Sample vouchers

## PWA Configuration

### 1. Generate Icons

```bash
# Icons should be in public/ directory
# icon-192.png (192x192)
# icon-512.png (512x512)
```

If missing, generate using:

```bash
node scripts/generate-icons.js
```

### 2. Verify Manifest

Check `public/manifest.json` exists and has correct values:

```json
{
  "name": "Vouchr",
  "short_name": "Vouchr",
  "start_url": "/",
  "display": "standalone",
  "icons": [...]
}
```

### 3. Test PWA

1. Build app: `npm run build`
2. Start production server: `npm start`
3. Open in browser
4. Check "Install" option appears
5. Test offline functionality

## Cron Job Setup

### Option 1: Vercel Cron (If using Vercel)

Already configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/credit-expiry-warnings",
    "schedule": "0 9 * * *"
  }]
}
```

Set `CRON_SECRET` environment variable in Vercel dashboard.

### Option 2: External Cron Service

Use a service like:

- GitHub Actions (scheduled workflow)
- cron-job.org
- EasyCron

Configure to call:

```http
GET https://your-domain.com/api/cron/credit-expiry-warnings
Authorization: Bearer YOUR_CRON_SECRET
```

Schedule: Daily at 9 AM (or your preferred time)

## Email Service Setup

### Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Verify domain (for production)
4. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

### SMTP Alternative

1. Get SMTP credentials from your email provider
2. Set `SMTP_*` environment variables
3. Test with magic link login

## Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Set webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Copy webhook signing secret
5. Set all `STRIPE_*` environment variables

## Launch Mode Configuration

### 1. Run Migration

```bash
npx prisma migrate dev --name launch_mode
```

Or apply SQL directly:

```bash
psql $DATABASE_URL -f prisma/migrations/launch_mode/migration.sql
```

### 2. Set Platform Admin

```bash
# In .env
PLATFORM_ADMIN_EMAILS=admin@example.com
```

### 3. Create First Merchant

```sql
INSERT INTO "Merchant" (id, name, slug, country, "defaultCurrency", "isActive", "invitedAt")
VALUES (
  gen_random_uuid()::text,
  'Your Merchant',
  'your-merchant',
  'US',
  'USD',
  true,
  NOW()
);
```

### 4. Add Merchant Admin

```sql
-- Create user (or use existing)
INSERT INTO "User" (id, email, name, "emailVerified")
VALUES (gen_random_uuid()::text, 'admin@merchant.com', 'Admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Add as merchant admin
INSERT INTO "MerchantMember" (id, "merchantId", "userId", role)
VALUES (
  gen_random_uuid()::text,
  (SELECT id FROM "Merchant" WHERE slug = 'your-merchant'),
  (SELECT id FROM "User" WHERE email = 'admin@merchant.com'),
  'merchant_admin'
);
```

## Verification

After configuration, verify everything:

```bash
# Run verification script
npm run verify:setup

# Test launch mode
npm run test:launch-mode

# Run 8-step MVP test
# See docs/TESTING_GUIDE.md
```

## Production Checklist

Before deploying:

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] PWA icons generated
- [ ] Email service configured and tested
- [ ] Stripe webhook configured
- [ ] Cron job scheduled
- [ ] Error tracking configured (optional)
- [ ] Platform admin emails set
- [ ] First merchant created
- [ ] All tests passing

## Troubleshooting

### Database Connection Issues

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma can connect
npx prisma db pull
```

### Email Not Sending

1. Check Resend/SMTP credentials
2. Verify `RESEND_FROM_EMAIL` or `SMTP_FROM` is set
3. Check email service logs
4. Test with magic link login

### PWA Not Installing

1. Check HTTPS (required for PWA)
2. Verify manifest.json is accessible
3. Check service worker is registered
4. Clear browser cache

### Cron Not Running

1. Verify endpoint is accessible
2. Check `CRON_SECRET` is set
3. Test endpoint manually with curl
4. Check cron service logs

## Support

For issues:

1. Check `docs/TROUBLESHOOTING.md`
2. Review error logs
3. Run verification scripts
4. Check deployment checklist
