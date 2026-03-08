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

## Security

Secrets are **never** committed. Use environment variables or GitHub Secrets.

