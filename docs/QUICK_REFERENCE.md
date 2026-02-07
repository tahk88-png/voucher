# Quick Reference Guide

Quick commands and scripts for common tasks.

## Verification & Testing

```bash
# Verify MVP setup (database, PWA, cron, launch mode)
npm run verify:setup

# Test launch mode (kill switch, feature flags)
npm run test:launch-mode

# Run 8-step MVP test (manual - see docs/TESTING_GUIDE.md)
# Follow steps in docs/TESTING_GUIDE.md
```

## Database

```bash
# Quick setup (check Docker, start, wait, push schema, seed)
npm run db:setup

# Individual steps
npm run db:check      # Check Docker Desktop is running
npm run docker:up     # Start Docker containers
npm run db:wait       # Wait for database to be ready
npm run db:push       # Push Prisma schema to database
npm run db:migrate    # Create and run migration
npm run db:seed       # Seed test data
npm run db:studio     # Open Prisma Studio (database GUI)
```

## Development

```bash
# Start dev server
npm run dev

# Clean build and start dev
npm run dev:clean

# Full setup + dev (Docker, DB, seed, dev server)
npm run dev:full
```

## Testing

```bash
# Unit/Integration tests
npm test
npm run test:ui       # With UI

# E2E tests
npm run test:e2e
npm run test:e2e:ui  # With UI
npm run test:e2e:debug
```

## Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Docker

```bash
# Start containers
npm run docker:up

# Stop containers
npm run docker:down

# View logs
npm run docker:logs
```

## Common Workflows

### First Time Setup

```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm run db:setup
npm run verify:setup
npm run dev
```

### Before Deployment

```bash
# Verify everything is set up
npm run verify:setup
npm run test:launch-mode

# Run tests
npm test
npm run test:e2e

# Build
npm run build
npm start  # Test production build locally
```

### Daily Development

```bash
# Start everything
npm run dev:full

# Or if Docker already running
npm run dev
```

### Database Changes

```bash
# After schema changes
npm run db:migrate    # Creates migration file
# Or
npm run db:push       # Direct push (dev only)

# View database
npm run db:studio
```

## Troubleshooting

### Database Connection Issues

```bash
# Check Docker is running
npm run db:check

# Restart Docker containers
npm run docker:down
npm run docker:up
npm run db:wait
```

### Verification Fails

```bash
# Check what failed
npm run verify:setup

# Common fixes:
# - Run migrations: npm run db:migrate
# - Check .env.example has all variables
# - Verify PWA files exist
```

### Build Cache Errors

If you see "Cannot find module" errors or webpack cache issues:

```bash
# Clean build cache
npm run clean

# Restart dev server
npm run dev
```

See [TROUBLESHOOTING_BUILD.md](TROUBLESHOOTING_BUILD.md) for details.

### Tests Failing

```bash
# Run specific test
npm test -- path/to/test

# Debug E2E test
npm run test:e2e:debug
```

## Environment Variables

See [Configuration Guide](CONFIGURATION_GUIDE.md) for complete list.

**Required:**

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

**Optional:**

- `RESEND_API_KEY` or `SMTP_*` (for emails)
- `STRIPE_*` (for payments)
- `PLATFORM_ADMIN_EMAILS` (for launch mode)
- `CRON_SECRET` (for cron jobs)

## Documentation

- [Testing Guide](TESTING_GUIDE.md) - 8-step MVP test
- [Configuration Guide](CONFIGURATION_GUIDE.md) - Complete setup
- [Setup Verification](SETUP_VERIFICATION.md) - Verify setup
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre-deployment
- [Launch Mode Guide](LAUNCH_MODE_IMPLEMENTATION.md) - Kill switch & feature flags
