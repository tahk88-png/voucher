#!/bin/sh
# Publish the app on a HestiaCP server: an nginx proxy template for the app's
# port, the web domain, a Let's Encrypt certificate and the http -> https
# redirect. Run as root, once per domain; safe to run again.
#
#   sh deploy/hestia-site.sh <domain> <app-port> [hestia-user]
#   sh deploy/hestia-site.sh voucher.example.ee 3110
#
# Use this instead of deploy/nginx/voucher.conf.example when HestiaCP manages
# nginx: Hestia regenerates the vhosts it owns, so a hand-written site file
# would drift from the panel (and certificate renewal is Hestia's job there).
#
# The template is a copy of one this server already proxies a Node app with
# (default node-3006, override with BASE_TEMPLATE=...), with only the upstream
# port changed. That keeps the server's own headers, logging and ACME handling.
# hestia-user defaults to the owner of the parent domain (Hestia refuses a
# subdomain under another user's domain).
#
# Needs: an A record for <domain> pointing at this server (the certificate
# step checks it), and the app listening on 127.0.0.1:<app-port> (APP_PORT in
# env/.env.production) - until the first deploy the site answers 502.
set -eu

HESTIA=${HESTIA:-/usr/local/hestia}
BIN=$HESTIA/bin
TPL_DIR=$HESTIA/data/templates/web/nginx
BASE_TEMPLATE=${BASE_TEMPLATE:-node-3006}

fail() {
  echo "error: $*" >&2
  exit 1
}

[ $# -ge 2 ] && [ $# -le 3 ] || {
  echo "usage: $0 <domain> <app-port> [hestia-user]" >&2
  exit 2
}
DOMAIN=$1
PORT=$2
HUSER=${3:-}

case $DOMAIN in
  '' | *[!a-z0-9.-]* | .* | *. | *..*) fail "'$DOMAIN' is not a plain lower-case host name such as voucher.example.ee" ;;
  *.*) ;;
  *) fail "'$DOMAIN' is not a fully qualified host name" ;;
esac
case $PORT in
  '' | *[!0-9]*) fail "the app port must be a number (got '$PORT')" ;;
esac
[ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || fail "the app port must be between 1024 and 65535"

[ "$(id -u)" -eq 0 ] || fail "run this as root"
[ -x "$BIN/v-add-web-domain" ] || fail "HestiaCP not found in $HESTIA"

# ── 1. proxy template ────────────────────────────────────────────────────────
TEMPLATE=voucher-$PORT
for ext in tpl stpl; do
  target=$TPL_DIR/$TEMPLATE.$ext
  if [ -f "$target" ]; then
    grep -q "proxy_pass http://127.0.0.1:$PORT;" "$target" ||
      fail "$target exists but does not proxy to 127.0.0.1:$PORT; inspect it before re-running"
    echo "Template $TEMPLATE.$ext exists."
    continue
  fi
  source=$TPL_DIR/$BASE_TEMPLATE.$ext
  [ -f "$source" ] || fail "base template $source not found (set BASE_TEMPLATE to a node proxy template this server uses)"
  base_port=$(sed -n 's|.*proxy_pass http://127\.0\.0\.1:\([0-9]*\);.*|\1|p' "$source" | sort -u)
  case $base_port in
    '' | *[!0-9]*) fail "$source must contain exactly one 'proxy_pass http://127.0.0.1:<port>;' upstream (found: $base_port)" ;;
  esac
  tmp=$target.tmp.$$
  sed -e "s|127\.0\.0\.1:$base_port;|127.0.0.1:$PORT;|g" \
    -e "s|$BASE_TEMPLATE|$TEMPLATE|g" \
    -e "s|127\.0\.0\.1:$base_port\$|127.0.0.1:$PORT|g" "$source" >"$tmp"
  if grep -q "127\.0\.0\.1:$base_port\b" "$tmp" || ! grep -q "proxy_pass http://127.0.0.1:$PORT;" "$tmp"; then
    rm -f "$tmp"
    fail "could not rewrite the upstream port in $source; create $target by hand"
  fi
  chmod 644 "$tmp"
  mv "$tmp" "$target"
  echo "Created template $TEMPLATE.$ext (from $BASE_TEMPLATE, upstream 127.0.0.1:$PORT)."
done

# ── 2. web domain ────────────────────────────────────────────────────────────
if [ -z "$HUSER" ]; then
  parent=${DOMAIN#*.}
  HUSER=$("$BIN/v-search-domain-owner" "$parent" || true)
  [ -n "$HUSER" ] || fail "could not find which Hestia user owns $parent; pass the user as the third argument"
  echo "Using Hestia user $HUSER (owner of $parent)."
fi
"$BIN/v-list-user" "$HUSER" >/dev/null 2>&1 || fail "Hestia user '$HUSER' does not exist"

# Prints the owning user, or nothing (non-zero exit) when the domain is new.
owner=$("$BIN/v-search-domain-owner" "$DOMAIN" web || true)
if [ -z "$owner" ]; then
  # IP empty = the user's default, restart 'no' (the template change below
  # reloads nginx once), aliases 'none' = no www.<domain> alias, which would
  # need its own DNS record and break the certificate.
  "$BIN/v-add-web-domain" "$HUSER" "$DOMAIN" '' no none
  echo "Added web domain $DOMAIN for $HUSER."
elif [ "$owner" = "$HUSER" ]; then
  echo "Web domain $DOMAIN exists."
else
  fail "$DOMAIN already belongs to Hestia user '$owner'"
fi

# Hestia checks the template with `nginx -t` before it reloads, so a broken
# template cannot take the other sites down.
"$BIN/v-change-web-domain-proxy-tpl" "$HUSER" "$DOMAIN" "$TEMPLATE"
echo "Proxy template set to $TEMPLATE."

# ── 3. HTTPS ─────────────────────────────────────────────────────────────────
# shell format prints e.g. "SSL:              yes / same"
ssl=$("$BIN/v-list-web-domain" "$HUSER" "$DOMAIN" shell | sed -n 's/^SSL:[[:space:]]*\([a-z]*\).*/\1/p')
if [ "$ssl" = yes ]; then
  echo "HTTPS is already enabled."
else
  server_ip=$("$BIN/v-list-web-domain" "$HUSER" "$DOMAIN" shell | sed -n 's/^IP:[[:space:]]*//p')
  dns_ip=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | sed -n '1s/ .*//p')
  if [ -z "$dns_ip" ]; then
    echo "NOTE: $DOMAIN does not resolve yet. Add the A record ($DOMAIN -> ${server_ip:-the server IP}),"
    echo "      wait until it resolves, then run this script again for the certificate."
    exit 1
  fi
  if [ -n "$server_ip" ] && [ "$dns_ip" != "$server_ip" ]; then
    echo "NOTE: $DOMAIN points at $dns_ip, but the web domain is on $server_ip. Fix the A record, then run this script again."
    exit 1
  fi
  "$BIN/v-add-letsencrypt-domain" "$HUSER" "$DOMAIN"
  echo "Let's Encrypt certificate issued."
fi
# Idempotent: rewrites the redirect file and reloads nginx.
"$BIN/v-add-web-domain-ssl-force" "$HUSER" "$DOMAIN" yes
echo "http:// redirects to https://."

echo
echo "Done: https://$DOMAIN proxies to 127.0.0.1:$PORT."
echo "The app must run with APP_PORT=$PORT and NEXT_PUBLIC_APP_URL=https://$DOMAIN in env/.env.production."
