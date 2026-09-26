#!/bin/sh
# Database restore script
# Usage: scripts/db-restore.sh <backup-file.sql.gz> [staging|production|local]
#
# Replaces the target stack's database with a gzipped plain-SQL dump made by
# scripts/db-backup.sh, through the postgres container (docker compose exec).
#
#   production, staging  the server stacks, via deploy/compose.sh: stops the
#                        app, restores, runs migrations with the deployed image
#                        (a dump older than the code gets the newer migrations),
#                        starts the app again
#   local                the dev stack (docker-compose.yml and .env); only the
#                        database is replaced

set -eu

cd "$(dirname "$0")/.."

BACKUP_FILE="${1:-}"
ENV="${2:-staging}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz> [staging|production|local]"
  echo "Example: $0 backups/staging/voucher_20260308_120000.sql.gz staging"
  exit 1
fi

case "$ENV" in
  production | staging | local) ;;
  *)
    echo "Unknown environment: $ENV (use staging, production or local)"
    exit 1
    ;;
esac

compose() {
  if [ "$ENV" = "local" ]; then
    docker compose -f docker-compose.yml "$@"
  else
    sh deploy/compose.sh "$ENV" "$@"
  fi
}

# Fail before asking if the file is not a complete gzip stream
gzip -t "$BACKUP_FILE"

# </dev/null on every exec/run that needs no input: compose attaches stdin
# and would otherwise swallow the answer to the prompt below.
# shellcheck disable=SC2016 # expanded by the container's shell
DB_NAME=$(compose exec -T postgres sh -c 'printf %s "$POSTGRES_DB"' </dev/null)

echo ""
echo "WARNING: This will DROP and RECREATE the ${ENV} database '${DB_NAME}'."
echo "Backup: ${BACKUP_FILE}"
echo ""
printf 'Are you sure? (yes/no): '
read -r CONFIRM || CONFIRM=""

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

if [ "$ENV" != "local" ]; then
  echo "Stopping app container..."
  compose stop app
fi

echo "Dropping and recreating database ${DB_NAME}..."
# WITH (FORCE) also ends leftover sessions (e.g. a cron-triggered request).
# shellcheck disable=SC2016 # expanded by the container's shell
compose exec -T postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
     -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);" \
     -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"' </dev/null

echo "Restoring from ${BACKUP_FILE}..."
# Decompressed inside the container with pipefail, and ON_ERROR_STOP: a dump
# that does not apply cleanly fails the restore instead of leaving a
# half-restored database behind a success message.
# shellcheck disable=SC2016 # expanded by the container's shell
compose exec -T postgres sh -c \
  'set -o pipefail; gunzip -c | psql -v ON_ERROR_STOP=1 --quiet -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < "$BACKUP_FILE"

if [ "$ENV" = "local" ]; then
  echo "Restore complete. Apply newer migrations if needed: pnpm prisma migrate deploy"
  exit 0
fi

echo "Running migrations..."
compose run --rm -T migrate </dev/null

echo "Starting app container..."
compose up -d app

echo "Restore complete. Check the app: sh deploy/compose.sh ${ENV} ps"
