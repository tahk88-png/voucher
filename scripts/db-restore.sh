#!/bin/bash
# Database restore script
# Usage: ./scripts/db-restore.sh <backup-file> [staging|production]
#
# Restores a gzipped pg_dump backup to the target environment's
# PostgreSQL container.

set -euo pipefail

BACKUP_FILE="${1:-}"
ENV="${2:-staging}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz> [staging|production]"
  echo "Example: $0 backups/staging/voucher_20260308_120000.sql.gz staging"
  exit 1
fi

# Determine container name based on environment
if [ "$ENV" = "production" ]; then
  CONTAINER="voucher-postgres"
  ENV_FILE=".env.production"
elif [ "$ENV" = "staging" ]; then
  CONTAINER="voucher-postgres-staging"
  ENV_FILE="env/.env.staging"
else
  echo "Unknown environment: $ENV (use staging or production)"
  exit 1
fi

# Load env vars if file exists
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_USER="${POSTGRES_USER:-voucher_user}"
DB_NAME="${POSTGRES_DB:-voucher_db}"

echo ""
echo "WARNING: This will DROP and RECREATE the ${ENV} database '${DB_NAME}'."
echo "Container: ${CONTAINER}"
echo "Backup: ${BACKUP_FILE}"
echo ""
read -rp "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Stopping app container..."
if [ "$ENV" = "production" ]; then
  docker compose -f docker-compose.prod.yml stop app 2>/dev/null || true
else
  docker compose -f docker-compose.staging.yml stop app 2>/dev/null || true
fi

echo "Dropping and recreating database ${DB_NAME}..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" \
  -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

echo "Restoring from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --quiet

echo "Running migrations..."
if [ "$ENV" = "production" ]; then
  docker compose -f docker-compose.prod.yml run --rm migrate
else
  docker compose -f docker-compose.staging.yml run --rm migrate
fi

echo "Starting app container..."
if [ "$ENV" = "production" ]; then
  docker compose -f docker-compose.prod.yml up -d app
else
  docker compose -f docker-compose.staging.yml up -d app
fi

echo "Restore complete."
