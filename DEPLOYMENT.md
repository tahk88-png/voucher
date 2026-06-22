# Deployment Guide

This project is production-ready with Docker, CI/CD, and controlled database migrations.

## Environments

Two environments are defined:

- **staging**: auto-deploys on `main`
- **production**: deploys on tags `v*.*.*`

Environment variable templates:

- `env/.env.staging.example`
- `env/.env.production.example`

## Local (Fresh Clone)

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

## Docker (Local)

```bash
cp .env.example .env
docker compose up -d --build
```

Health check: `http://localhost:3000/api/health`

## Production (Docker Compose)

1. Copy env file:

```bash
cp env/.env.production.example .env.production
```

1. Build and run:

```bash
export IMAGE_TAG=latest
docker compose -f docker-compose.prod.yml up -d migrate
docker compose -f docker-compose.prod.yml up -d app
```

1. Verify health:

```bash
curl -f http://localhost:3000/api/health
```

## Migrations (Controlled)

All deployments run:

```bash
npx prisma migrate deploy
```

This is executed by:

- `scripts/entrypoint.sh` (container start)
- `docker-compose.prod.yml` via the `migrate` service

## Rollback Strategy

Migrations are not auto-reverted. Rollback is **forward-fix**:

1. Re-deploy previous image tag.
1. Apply a new migration that fixes the issue.

If a migration must be rolled back manually:

1. Restore DB from backup.
1. Re-deploy previous image tag.

## CI/CD (GitHub Actions)

### CI (on PR + main)

- install dependencies
- lint
- test
- build
- docker build

### CD

- **staging**: push to `main`
- **production**: push tag `v*.*.*`

Deployment uses SSH:

Required secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_APP_DIR` (path on server containing `docker-compose.prod.yml`)

Healthcheck gate:
Deploy fails if `GET /api/health` is not 200.
Rollback automatically re-runs the previous image tag if health fails.

## EU Data Residency (GDPR Compliance)

All production infrastructure **MUST** be hosted in EU regions. This is a legal requirement for GDPR compliance and data residency.

### Required EU Regions

| Service | Provider | Required Region | Config |
|---------|----------|----------------|--------|
| Database (PostgreSQL) | Supabase | `eu-central-1` (Frankfurt) | `DATABASE_URL` must point to EU instance |
| Deployment | Vercel | `fra1` (Frankfurt) | Set in `vercel.json` → `regions: ["fra1"]` |
| Redis | Upstash | EU region | `REDIS_URL` → Upstash EU endpoint |
| Object Storage | Cloudflare R2 | EU jurisdiction | R2 bucket with EU data location hint |
| Email | Resend | N/A (no storage) | Transactional only, no PII stored |
| Monitoring | Sentry | EU data center | Set `SENTRY_DSN` to EU project |
| Logging | Axiom | EU region | `AXIOM_*` env vars → EU organization |
| Payments | Stripe | N/A | Stripe handles PCI/GDPR compliance independently |

### Deployment Checklist

Before going to production, verify:

- [ ] `DATABASE_URL` points to Supabase EU instance (not US)
- [ ] `REDIS_URL` points to Upstash EU region
- [ ] `vercel.json` has `"regions": ["fra1"]`
- [ ] Sentry project is configured for EU data center
- [ ] No US-region services in the data path
- [ ] Cookie consent banner is active (see `CookieConsentBanner` component)
- [ ] Analytics blocked until user consents (see `lib/cookie-consent.ts`)
- [ ] DPA (Data Processing Agreement) signed with all sub-processors:
  - Supabase, Vercel, Upstash, Stripe, Resend, Sentry, Axiom

### Data Retention Policies

| Data | Retention | Action on Expiry |
|------|-----------|-----------------|
| User PII | Until deletion request | Anonymize (see `/api/user/delete-account`) |
| Billing records | 7 years | Retain (legal requirement) |
| Audit logs | 7 years | Append-only, no deletion |
| Analytics events | 90 days | Auto-purge via cron |
| Session data | 30 days | Auto-expire |
| Cookie consent | 1 year | Re-prompt |

## Security

Secrets are **never** committed. Use environment variables or GitHub Secrets.

