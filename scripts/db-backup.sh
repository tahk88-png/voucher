#!/bin/sh
# Database backup script
# Usage: scripts/db-backup.sh [staging|production|local]   (default: staging)
#
# Runs pg_dump inside the stack's postgres container (docker compose exec, so
# nothing has to be published on the host) and writes a gzipped plain-SQL dump
# to backups/<env>/voucher_<timestamp>.sql.gz. Keeps the newest
# BACKUP_RETENTION dumps (default 14).
#
#   production, staging  the server stacks, via deploy/compose.sh (run in
#                        DEPLOY_APP_DIR, where the Deploy workflow put it)
#   local                the dev stack: docker-compose.yml and .env
#
# Nightly on the server (deploy/crontab.example):
#   15 3 * * * cd /srv/voucher && sh scripts/db-backup.sh production >>logs/backup.log 2>&1
#
# deploy/deploy.sh also takes one before every production migration, with
# BACKUP_PREFIX=predeploy (rotated separately, so they never push out nightly ones).

set -eu

cd "$(dirname "$0")/.."

ENV="${1:-staging}"
RETENTION="${BACKUP_RETENTION:-14}"
PREFIX="${BACKUP_PREFIX:-voucher}"
BACKUP_DIR="backups/${ENV}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

case "$ENV" in
  production | staging | local) ;;
  *)
    echo "Usage: $0 [staging|production|local]"
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

# Dumps contain every customer's data: owner-only files and directory.
umask 077
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/${PREFIX}_${TIMESTAMP}.sql.gz"
PARTIAL_FILE="${BACKUP_FILE}.partial"
trap 'rm -f "$PARTIAL_FILE"' EXIT

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Backing up the ${ENV} database..."

# Dump and compress inside the container: with pipefail there, a failing
# pg_dump fails the exec (a host-side pipe would report gzip's success).
# POSTGRES_USER / POSTGRES_DB come from the container's own env. Written to
# .partial first: a failed dump must never count as a backup and push a good
# one out of the rotation. stdin is /dev/null: compose exec attaches it, and
# must not consume the input of whatever runs this (deploy.sh over ssh).
# shellcheck disable=SC2016 # expanded by the container's shell
compose exec -T postgres sh -c \
  'set -o pipefail; pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges --format=plain | gzip' \
  < /dev/null > "$PARTIAL_FILE"
gzip -t "$PARTIAL_FILE"
mv "$PARTIAL_FILE" "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: ${BACKUP_FILE} (${FILE_SIZE})"

# Rotate old backups — keep only the last N with this prefix
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${PREFIX}_*.sql.gz" -type f | wc -l)
if [ "$BACKUP_COUNT" -gt "$RETENTION" ]; then
  REMOVE_COUNT=$((BACKUP_COUNT - RETENTION))
  echo "Rotating: removing ${REMOVE_COUNT} old backup(s)..."
  find "$BACKUP_DIR" -name "${PREFIX}_*.sql.gz" -type f \
    | sort \
    | head -n "$REMOVE_COUNT" \
    | xargs rm -f
  BACKUP_COUNT=$RETENTION
fi

echo "Done. ${BACKUP_COUNT} ${PREFIX} backup(s) in ${BACKUP_DIR} (retention: ${RETENTION})"
