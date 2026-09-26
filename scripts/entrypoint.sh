#!/usr/bin/env sh
set -e

# `prisma migrate deploy` only applies pending migrations, so running it on
# every start is safe (an older image against a newer database is a no-op).
# The production and staging stacks set MIGRATE_ON_START=false: deploy/deploy.sh
# runs migrations there as a separate, blocking step before the app is
# replaced. The local docker-compose.yml relies on the default.
if [ "${MIGRATE_ON_START:-true}" = "true" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

echo "Starting app..."
# exec (same command as `npm run start`): Next.js replaces this shell and
# receives docker stop's SIGTERM itself. Without it the shell swallows the
# signal and Docker kills the app after the 10s grace period.
exec node_modules/.bin/next start
