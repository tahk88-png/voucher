#!/bin/sh
# Create env/.env.<environment> from its example, with fresh secrets:
#
#   sh deploy/init-env.sh <production|staging> [domain]
#   sh deploy/init-env.sh production app.example.com
#
# Generates POSTGRES_PASSWORD, REDIS_PASSWORD, AUTH_SECRET, CRON_SECRET,
# METRICS_TOKEN and IP_SALT and writes DATABASE_URL / REDIS_URL to match. With
# a domain, the example host in every URL is replaced by it. Never overwrites an
# existing file. Secrets are 64 hex characters, so they need no quoting or
# URL-encoding. Run it on the server: the secrets never leave it.
set -eu

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  echo "usage: $0 <production|staging> [domain]" >&2
  exit 2
}

[ $# -ge 1 ] && [ $# -le 2 ] || usage
ENV_NAME=$1
DOMAIN=${2:-}
case $ENV_NAME in
  production) EXAMPLE_HOST=app.example.com ;;
  staging) EXAMPLE_HOST=staging.example.com ;;
  *) usage ;;
esac
case $DOMAIN in
  *[!A-Za-z0-9.-]*) fail "the domain must be a bare host name such as app.example.com (no https://, no path)" ;;
esac

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$APP_DIR"
EXAMPLE=env/.env.$ENV_NAME.example
TARGET=env/.env.$ENV_NAME

[ -f "$EXAMPLE" ] || fail "$APP_DIR/$EXAMPLE not found (the Deploy workflow copies it here)"
[ ! -e "$TARGET" ] || fail "$APP_DIR/$TARGET already exists; not overwriting it"

secret() {
  od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

PG_PASSWORD=$(secret)
REDIS_PASSWORD=$(secret)
SED_SCRIPT="
s|^POSTGRES_PASSWORD=change_me\$|POSTGRES_PASSWORD=$PG_PASSWORD|
s|^\(DATABASE_URL=postgresql://[^:]*:\)change_me@|\1$PG_PASSWORD@|
s|^REDIS_PASSWORD=change_me\$|REDIS_PASSWORD=$REDIS_PASSWORD|
s|^REDIS_URL=redis://:change_me@|REDIS_URL=redis://:$REDIS_PASSWORD@|
s|^AUTH_SECRET=change_me\$|AUTH_SECRET=$(secret)|
s|^CRON_SECRET=change_me\$|CRON_SECRET=$(secret)|
s|^METRICS_TOKEN=change_me\$|METRICS_TOKEN=$(secret)|
s|^IP_SALT=change_me\$|IP_SALT=$(secret)|
"
if [ -n "$DOMAIN" ]; then
  EXAMPLE_HOST_RE=$(printf '%s' "$EXAMPLE_HOST" | sed 's/\./\\./g')
  SED_SCRIPT="$SED_SCRIPT
s|$EXAMPLE_HOST_RE|$DOMAIN|g"
fi

mkdir -p env
chmod 700 env
umask 077
TMP=$TARGET.tmp.$$
trap 'rm -f "$TMP"' EXIT
sed "$SED_SCRIPT" "$EXAMPLE" >"$TMP"
# Every active line must now be free of placeholders; otherwise the example's
# format changed and this script needs updating — do not leave a weak file.
if grep -n '^[A-Z_]*=.*change_me' "$TMP" >&2; then
  fail "the lines above still hold placeholders; $TARGET was not written"
fi
mv "$TMP" "$TARGET"

echo "Created $APP_DIR/$TARGET (mode 600) with generated secrets."
echo "Still to edit (nano $APP_DIR/$TARGET):"
if [ -z "$DOMAIN" ]; then
  echo "  - the URL lines: they still say $EXAMPLE_HOST (or delete the file and run this again with your domain)"
fi
echo "  - PLATFORM_ADMIN_EMAILS (later): your own address, once you have registered it on the site"
echo "  - e-mail (RESEND_*), Stripe and other integrations once you have their keys"
echo "Keep a copy of this file somewhere safe (a password manager): the database password is in it."
