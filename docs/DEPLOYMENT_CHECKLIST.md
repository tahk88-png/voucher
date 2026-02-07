# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Environment Variables
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `AUTH_SECRET` - Random 32+ character string
- [ ] `NEXTAUTH_URL` - Production URL (e.g., https://voucher.example.com)
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (e.g., https://voucher.example.com)
- [ ] `SMTP_HOST` - Email server for magic links
- [ ] `SMTP_PORT` - Email server port
- [ ] `SMTP_USER` - Email server username
- [ ] `SMTP_PASSWORD` - Email server password
- [ ] `SMTP_FROM` - From email address
- [ ] `RESEND_API_KEY` - Resend API key (recommended for transactional emails)
- [ ] `RESEND_FROM_EMAIL` - Default "from" address for Resend
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (required for payments)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (required for webhooks)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (client-side)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth (optional)
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)
- [ ] `APPLE_ID` - Apple OAuth client ID (optional)
- [ ] `APPLE_SECRET` - Apple OAuth secret (optional)
- [ ] `APPLE_TEAM_ID` - Apple OAuth team ID (optional)
- [ ] `APPLE_KEY_ID` - Apple OAuth key ID (optional)
- [ ] `APPLE_PRIVATE_KEY` - Apple OAuth private key (optional)
- [ ] `PLATFORM_ADMIN_EMAILS` - Comma-separated admin emails
- [ ] `REDIS_URL` - Redis connection (optional, for rate limiting)

### Database
- [ ] Production database created
- [ ] Migration run: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Seed data loaded (if needed)
- [ ] Database backups configured

### Security
- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] CSRF protection enabled (Next.js default)

### PWA
- [ ] `manifest.json` updated with production URL
- [ ] Icons generated (192x192, 512x512)
- [ ] Service worker tested
- [ ] Offline functionality tested

## Deployment Steps

### 1. Build
```bash
npm run build
```

### 2. Test Build Locally
```bash
npm start
```

### 3. Deploy
- Deploy to your hosting platform (Vercel, Render, etc.)
- Set all environment variables
- Run database migrations

### 4. Post-Deployment

#### Verify
- [ ] Homepage loads
- [ ] Login works
- [ ] Magic link emails sent
- [ ] OAuth providers work (if configured)
- [ ] Voucher pages load
- [ ] Referral pages load
- [ ] PWA installable
- [ ] Service worker active

#### Test Core Flows
- [ ] Create voucher
- [ ] Create campaign
- [ ] Generate vouchers from campaign
- [ ] Purchase voucher (Stripe checkout)
- [ ] Publish voucher
- [ ] Share referral
- [ ] Redeem voucher
- [ ] Confirm redemption
- [ ] Credit unlocks
- [ ] Apply credit
- [ ] Create event
- [ ] Generate tickets for event
- [ ] Purchase ticket (Stripe checkout)

#### Monitor
- [ ] Error logs checked
- [ ] Performance metrics reviewed
- [ ] Database connections stable
- [ ] API response times acceptable

## Launch Mode Setup

### Initial Setup
- [ ] Run launch mode migration
- [ ] Create first merchant via database
- [ ] Add merchant admin user
- [ ] Test merchant dashboard access
- [ ] Verify kill switch works

### Merchant Onboarding
- [ ] Document onboarding process
- [ ] Create merchant invite template
- [ ] Set up merchant creation workflow
- [ ] Test feature flags

## Monitoring

### Set Up
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Alerts
- [ ] Database connection failures
- [ ] High error rates
- [ ] Slow API responses
- [ ] Merchant deactivations
- [ ] Unusual redemption patterns

## Rollback Plan

### If Issues Occur
1. **Immediate**: Deactivate problematic merchants via kill switch
2. **Short-term**: Revert deployment if critical bug
3. **Long-term**: Fix issue and redeploy

### Rollback Steps
```bash
# 1. Revert code deployment
# 2. Check database migrations (may need to rollback)
# 3. Verify environment variables
# 4. Test critical flows
```

## Post-Launch

### Week 1
- [ ] Monitor error rates daily
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Verify all core flows work
- [ ] Test on multiple devices/browsers

### Week 2-4
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Review security logs
- [ ] Plan V2 features based on feedback

## Support

### Documentation
- [ ] API documentation up to date
- [ ] User guides created
- [ ] Merchant onboarding guide
- [ ] Troubleshooting guide

### Communication
- [ ] Support email configured
- [ ] Status page (if applicable)
- [ ] Changelog maintained

## Success Criteria

MVP is successfully deployed when:
- ✅ All 8 done definition steps work in production
- ✅ No critical errors in logs
- ✅ Performance meets targets (<2s page load)
- ✅ PWA installable and functional
- ✅ At least one merchant onboarded and active
- ✅ At least one successful end-to-end flow

## Notes

- Keep staging environment identical to production
- Test all changes in staging first
- Document all manual steps
- Keep deployment process repeatable
- Monitor closely for first 48 hours
