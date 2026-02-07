# Production Setup Guide

This guide walks through setting up the production environment for the voucher platform.

## Prerequisites

- Production PostgreSQL database (recommended: managed service like AWS RDS, Supabase, or Railway)
- Domain name configured
- SSL certificate (usually handled by hosting platform)
- Email service (Resend recommended)
- Stripe account (for payments)
- Redis (optional, for caching and rate limiting)

## Step 1: Environment Variables

Create a `.env.production` file or set these in your hosting platform:

### Required Variables

```bash
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
AUTH_SECRET=your-random-32-plus-character-secret
NEXTAUTH_SECRET=your-random-32-plus-character-secret

# Email (Resend recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Platform Admin
PLATFORM_ADMIN_EMAILS=admin@your-domain.com,admin2@your-domain.com
```

### Optional Variables

```bash
# Redis (for caching and rate limiting)
REDIS_URL=redis://host:6379

# Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Cron Secret (for scheduled jobs)
CRON_SECRET=your-random-secret-for-cron-endpoints

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_ID=your-apple-client-id
APPLE_SECRET=your-apple-secret
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

## Step 2: Database Setup

### 2.1 Create Production Database

Using your database provider's interface or CLI:

```bash
# Example with psql
createdb voucher_production
```

### 2.2 Run Migrations

**Important**: Convert from `db:push` to migrations first:

```bash
# Create initial migration from current schema
npx prisma migrate dev --name init

# For production, use deploy (doesn't prompt)
npx prisma migrate deploy
```

### 2.3 Generate Prisma Client

```bash
npx prisma generate
```

### 2.4 Seed Initial Data (Optional)

```bash
# Only if you need initial merchants/users
npm run db:seed
```

## Step 3: Redis Setup (Optional but Recommended)

### 3.1 Create Redis Instance

Using a managed service (Redis Cloud, Upstash, etc.) or self-hosted.

### 3.2 Configure Redis URL

Set `REDIS_URL` in environment variables.

### 3.3 Test Connection

The app will automatically use Redis if `REDIS_URL` is set, otherwise falls back to in-memory cache.

## Step 4: Sentry Setup (Optional but Recommended)

### 4.1 Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Create a new project (Next.js)
3. Copy the DSN

### 4.2 Configure Sentry

Set `NEXT_PUBLIC_SENTRY_DSN` in environment variables.

The app will automatically use Sentry if configured, otherwise logs to console.

## Step 5: Stripe Configuration

### 5.1 Get Live Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy your live secret key and publishable key
3. Set up webhook endpoint

### 5.2 Configure Webhook

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 6: Email Configuration (Resend)

### 6.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Create account and verify domain
3. Get API key from dashboard

### 6.2 Configure Resend

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in environment variables.

## Step 7: Cron Jobs

### 7.1 Credit Expiry Warnings

Set up a cron job to call the credit expiry endpoint daily:

```bash
# Using Vercel Cron (recommended)
# Add to vercel.json:
{
  "crons": [{
    "path": "/api/cron/credit-expiry-warnings",
    "schedule": "0 9 * * *"
  }]
}

# Or using external service (cron-job.org, etc.)
# Call: https://your-domain.com/api/cron/credit-expiry-warnings
# With header: X-Cron-Secret: your-cron-secret
```

Set `CRON_SECRET` in environment variables.

## Step 8: Deploy Application

### 8.1 Build

```bash
npm run build
```

### 8.2 Test Build Locally

```bash
npm start
```

### 8.3 Deploy to Hosting Platform

#### Vercel (Recommended)

1. Connect GitHub repository
2. Set all environment variables
3. Deploy

Vercel will automatically:
- Run `prisma generate` during build
- Deploy the application

**Important**: Run migrations manually or in a build hook:

```bash
# Add to package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

#### Other Platforms

Follow your platform's deployment guide. Ensure:
- Environment variables are set
- Database migrations run
- Prisma client is generated

## Step 9: Post-Deployment Verification

### 9.1 Basic Checks

- [ ] Homepage loads
- [ ] Login page works
- [ ] Magic link emails sent
- [ ] OAuth works (if configured)
- [ ] Voucher pages load
- [ ] Referral pages load

### 9.2 Core Flow Tests

- [ ] Create voucher
- [ ] Publish voucher
- [ ] Share referral
- [ ] Redeem voucher
- [ ] Confirm redemption
- [ ] Credit unlocks
- [ ] Apply credit

### 9.3 Payment Tests

- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Vouchers issued after payment

### 9.4 Admin Tests

- [ ] Platform admin access works
- [ ] Merchant management works
- [ ] Feature flags work
- [ ] Audit log accessible

## Step 10: Monitoring Setup

### 10.1 Error Tracking

- Sentry configured and receiving errors
- Error alerts set up

### 10.2 Performance Monitoring

- Response time monitoring
- Database query monitoring
- API endpoint monitoring

### 10.3 Uptime Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- Configure alerts

## Step 11: Backup Strategy

### 11.1 Database Backups

Configure automated backups:
- Daily backups
- Weekly backups
- Monthly backups
- Retention policy

### 11.2 Backup Testing

- [ ] Test backup restoration
- [ ] Verify backup integrity
- [ ] Document restoration procedure

## Step 12: Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] Secrets in environment variables (not in code)
- [ ] Database credentials secure
- [ ] API keys rotated regularly

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` format
- Check firewall rules
- Verify database is accessible from hosting platform

### Email Not Sending

- Verify Resend API key
- Check domain verification in Resend
- Review email logs in Resend dashboard

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Review Stripe webhook logs

### Migration Failures

- Check database connection
- Verify migration SQL syntax
- Review Prisma migration status: `npx prisma migrate status`

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up staging environment
4. Document runbooks for common issues
5. Set up CI/CD pipeline
6. Configure feature flags for gradual rollout
