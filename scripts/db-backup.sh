#!/bin/bash
# Database backup script
# Usage: ./scripts/db-backup.sh [staging|production]
#
# Runs pg_dump against the Docker PostgreSQL container and creates
# a gzipped backup file. Rotates old backups to keep the last N.

set -euo pipefail

ENV="${1:-staging}"
RETENTION="${BACKUP_RETENTION:-7}"
BACKUP_DIR="backups/${ENV}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Determine container name based on environment
if [ "$ENV" = "production" ]; then
  CONTAINER="voucher-postgres"
  ENV_FILE=".env.production"
elif [ "$ENV" = "staging" ]; then
  CONTAINER="voucher-postgres-staging"
  ENV_FILE="env/.env.staging"
else
  echo "Usage: $0 [staging|production]"
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

# Create backup directory
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/voucher_${TIMESTAMP}.sql.gz"

echo "Backing up ${ENV} database (${DB_NAME}) from container ${CONTAINER}..."

docker exec "$CONTAINER" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: ${BACKUP_FILE} (${FILE_SIZE})"

# Rotate old backups — keep only the last N
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "voucher_*.sql.gz" -type f | wc -l)
if [ "$BACKUP_COUNT" -gt "$RETENTION" ]; then
  REMOVE_COUNT=$((BACKUP_COUNT - RETENTION))
  echo "Rotating: removing ${REMOVE_COUNT} old backup(s)..."
  find "$BACKUP_DIR" -name "voucher_*.sql.gz" -type f \
    | sort \
    | head -n "$REMOVE_COUNT" \
    | xargs rm -f
fi

echo "Done. ${BACKUP_COUNT} backup(s) in ${BACKUP_DIR} (retention: ${RETENTION})"
