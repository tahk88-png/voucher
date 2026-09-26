#!/bin/sh
# Trigger one of the app's scheduled jobs (/api/cron/<job>) on this host. On a
# VPS nothing calls them otherwise — vercel.json's "crons" only work on Vercel.
# Scheduled from the deploy user's crontab (deploy/crontab.example):
#
#   sh deploy/run-cron.sh <production|staging> <job>
#   sh deploy/run-cron.sh production email-queue
#
# Calls the app directly on 127.0.0.1:$APP_PORT with CRON_SECRET from the env
# file, sent both as "Authorization: Bearer" and "x-cron-secret" (the routes
# differ in which one they read). Prints nothing on success; on failure prints
# a dated line and exits non-zero.
set -eu

fail() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) cron $*" >&2
  exit 1
}

[ $# -eq 2 ] || {
  echo "usage: $0 <production|staging> <job>" >&2
  exit 2
}
ENV_NAME=$1
JOB=$2
case $ENV_NAME in
  production) DEFAULT_PORT=3100 ;;
  staging) DEFAULT_PORT=3101 ;;
  *) fail "unknown environment '$ENV_NAME'" ;;
esac
case $JOB in
  '' | *[!a-z0-9-]*) fail "invalid job name '$JOB'" ;;
esac

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
ENV_FILE=$APP_DIR/env/.env.$ENV_NAME
[ -r "$ENV_FILE" ] || fail "$JOB: cannot read $ENV_FILE"

# Last KEY=value line of the env file, surrounding quotes removed.
env_get() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

CRON_SECRET=$(env_get CRON_SECRET)
[ -n "$CRON_SECRET" ] || fail "$JOB: CRON_SECRET is not set in $ENV_FILE"
APP_PORT=$(env_get APP_PORT)
APP_PORT=${APP_PORT:-$DEFAULT_PORT}

# The headers go in through curl's config on stdin, so the secret never shows
# up in the process list other users of this server can read.
printf 'header = "Authorization: Bearer %s"\nheader = "x-cron-secret: %s"\n' "$CRON_SECRET" "$CRON_SECRET" |
  curl --config - -fsS -o /dev/null --max-time 300 "http://127.0.0.1:$APP_PORT/api/cron/$JOB" ||
  fail "$JOB failed on $ENV_NAME (http://127.0.0.1:$APP_PORT/api/cron/$JOB)"
