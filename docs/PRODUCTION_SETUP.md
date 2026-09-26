# Production Setup Guide

The server, database, Redis, deploys, cron jobs and backups are set up by
**[DEPLOYMENT.md](../DEPLOYMENT.md)** (Docker Compose on your own server,
deployed by GitHub Actions); day-to-day operations are in
**[RUNBOOK.md](../RUNBOOK.md)**. This page covers the third-party services
you connect afterwards, and the checks to run once the site is live.

All settings go in the server's `env/.env.production` (created by
`deploy/init-env.sh`, documented line by line in
[env/.env.production.example](../env/.env.production.example)). After editing
it, restart the app as described in RUNBOOK.md, "Change a setting or secret".

## Sentry Setup (Optional but Recommended)

### Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Create a new project (Next.js)
3. Copy the DSN

### Configure Sentry

Set `SENTRY_DSN` in the env file. Browser-side Sentry (`NEXT_PUBLIC_SENTRY_DSN`) needs the value at image build time (DEPLOYMENT.md, "Browser-side settings").

The app will automatically use Sentry if configured, otherwise logs to console.

## Stripe Configuration

### Get Live Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy your live secret key and publishable key
3. Set up webhook endpoint

### Configure Webhook

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Email Configuration (Resend)

### Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Create account and verify domain
3. Get API key from dashboard

### Configure Resend

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in environment variables.

## Scheduled jobs, deploys and migrations

Covered by DEPLOYMENT.md: the host crontab (`deploy/crontab.example`) calls
every `/api/cron/*` job with `CRON_SECRET`; a `vX.Y.Z` tag deploys, and the
deploy runs `prisma migrate deploy` before the new version replaces the old
one. Never run `db push`, `migrate dev` or the seed against production.

## Post-Deployment Verification

### Basic Checks

- [ ] Homepage loads
- [ ] Login page works
- [ ] Magic link emails sent
- [ ] OAuth works (if configured)
- [ ] Voucher pages load
- [ ] Referral pages load

### Core Flow Tests

- [ ] Create voucher
- [ ] Publish voucher
- [ ] Share referral
- [ ] Redeem voucher
- [ ] Confirm redemption
- [ ] Credit unlocks
- [ ] Apply credit

### Payment Tests

- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Vouchers issued after payment

### Admin Tests

- [ ] Platform admin access works
- [ ] Merchant management works
- [ ] Feature flags work
- [ ] Audit log accessible

## Monitoring Setup

### Error Tracking

- Sentry configured and receiving errors
- Error alerts set up

### Performance Monitoring

- Response time monitoring
- Database query monitoring
- API endpoint monitoring

### Uptime Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- Configure alerts

## Backups

Nightly and pre-deploy database dumps are set up in DEPLOYMENT.md, step 7;
restoring one is in RUNBOOK.md. Copy them off the server regularly, and test a
restore once.

## Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] Secrets in environment variables (not in code)
- [ ] Database credentials secure
- [ ] API keys rotated regularly

## Troubleshooting

### Database Connection Issues

- `DATABASE_URL` must repeat the `POSTGRES_*` values (`deploy/deploy.sh` checks this)
- Logs: RUNBOOK.md, "Status and logs"

### Email Not Sending

- Verify Resend API key
- Check domain verification in Resend
- Review email logs in Resend dashboard

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Review Stripe webhook logs

### Migration Failures

- RUNBOOK.md, "Failed migration"

## Next Steps

1. Set up monitoring and alerts
2. Optionally set up staging (DEPLOYMENT.md, `STAGING_ENABLED`)
3. Configure feature flags for gradual rollout
