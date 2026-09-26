#!/bin/sh
# Update this server to a released version without GitHub Actions: download
# the release's compose file and scripts, then run the normal rollout
# (deploy/deploy.sh: env check, image pull, backup, migrations, health check,
# automatic rollback).
#
#   sh deploy/update.sh v1.2.3
#
# The image for the tag must already be in ghcr.io: the Deploy workflow builds
# it a few minutes after the tag is pushed.
set -eu

TAG=${1:-}
case $TAG in
  v[0-9]*) ;;
  *)
    echo "usage: $0 <tag, e.g. v1.2.3>" >&2
    exit 2
    ;;
esac

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$APP_DIR"
REPO=${REPO:-tahk88-png/voucher}

echo "==> Downloading $TAG files from github.com/$REPO"
curl -fsSL "https://github.com/$REPO/archive/refs/tags/$TAG.tar.gz" |
  tar -xz --strip-components=1 --wildcards \
    '*/docker-compose.prod.yml' '*/docker-compose.staging.yml' '*/deploy/*' \
    '*/scripts/db-backup.sh' '*/scripts/db-restore.sh' '*/scripts/demo-content.cjs'

exec sh deploy/deploy.sh production "$TAG"
