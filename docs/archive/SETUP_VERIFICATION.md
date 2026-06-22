# Setup Verification Guide

This guide helps you verify that all MVP components are properly configured and ready for testing or deployment.

## Quick Verification

Run the automated verification script:

```bash
npm run verify:setup
```

This will check:

- ✅ Database schema (launch mode fields)
- ✅ PWA configuration
- ✅ Cron endpoint setup
- ✅ Launch mode functions
- ✅ Environment variables documentation

## Manual Verification Steps

### 1. Database Schema

Verify launch mode fields exist:

```sql
-- Check Merchant table has launch mode fields
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Merchant'
  AND column_name IN ('isActive', 'featureFlags', 'invitedAt', 'onboardedAt');
```

Expected output: 4 rows (one for each field)

### 2. Launch Mode Functions

Test kill switch and feature flags:

```bash
npm run test:launch-mode
```

This tests:

- `isMerchantActive()` - Check merchant status
- `requireActiveMerchant()` - Block inactive merchants
- `isFeatureEnabled()` - Check feature flags
- `activateMerchant()` / `deactivateMerchant()` - Kill switch operations

### 3. PWA Setup

Check PWA files exist:

```bash
# Check manifest
ls public/manifest.json

# Check next.config.js has next-pwa
grep -q "next-pwa" next.config.js && echo "✅ PWA configured" || echo "❌ PWA not configured"
```

### 4. Cron Endpoint

Verify cron endpoint exists:

```bash
# Check endpoint file
ls app/api/cron/credit-expiry-warnings/route.ts

# Check Vercel config (if using Vercel)
cat vercel.json | grep -q "crons" && echo "✅ Cron configured" || echo "⚠️  Cron not in vercel.json"
```

### 5. Environment Variables

Check required variables are documented:

```bash
# Check .env.example has required variables
grep -q "DATABASE_URL" .env.example && echo "✅ DATABASE_URL documented" || echo "❌ Missing"
grep -q "AUTH_SECRET" .env.example && echo "✅ AUTH_SECRET documented" || echo "❌ Missing"
grep -q "NEXTAUTH_URL" .env.example && echo "✅ NEXTAUTH_URL documented" || echo "❌ Missing"
```

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] All environment variables set in production
- [ ] PWA icons generated (192x192, 512x512)
- [ ] Cron job configured (Vercel Cron or external service)
- [ ] Email service configured (SMTP or Resend)
- [ ] Error tracking configured (Sentry DSN if using)
- [ ] Launch mode tested: `npm run test:launch-mode`

## Troubleshooting

### Migration Issues

If launch mode fields are missing:

```bash
# Run migration
npx prisma migrate dev --name launch_mode

# Or apply SQL directly
psql $DATABASE_URL -f prisma/migrations/launch_mode/migration.sql
```

### PWA Not Working

1. Check `next.config.js` has `next-pwa` configured
2. Verify `public/manifest.json` exists
3. Check icons exist: `public/icon-192.png`, `public/icon-512.png`
4. Clear `.next` folder and rebuild: `npm run dev:clean`

### Cron Not Running

1. Verify endpoint exists: `app/api/cron/credit-expiry-warnings/route.ts`
2. Check `vercel.json` has cron configuration (if using Vercel)
3. For external cron, ensure `CRON_SECRET` is set
4. Test endpoint manually: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/credit-expiry-warnings`

## Next Steps

After verification:

1. **Run 8-step MVP test**: See `docs/TESTING_GUIDE.md`
2. **Configure production**: See `docs/DEPLOYMENT_CHECKLIST.md`
3. **Test launch mode**: `npm run test:launch-mode`
4. **Deploy**: Follow deployment checklist
