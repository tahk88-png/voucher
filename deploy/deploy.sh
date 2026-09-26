#!/bin/sh
# Roll out one image tag on this host:
#
#   sh deploy/deploy.sh <production|staging> <image-tag>
#
# The GitHub Deploy workflow runs this after copying the compose files and
# deploy/ here. Run it by hand to redeploy or roll back, e.g.
#   sh deploy/deploy.sh production v1.4.2
#
# Each step stops the deploy if it fails:
#   1. check env/.env.<env>: present, secrets filled in, URLs consistent
#   2. pull the app image                 - nothing running changes yet
#   3. production only: back up the database
#   4. run migrations to completion       - on failure the old app keeps serving
#   5. replace the app container
#   6. poll GET /api/health and GET /login on 127.0.0.1:$APP_PORT for up to
#      HEALTH_TIMEOUT s: the database answers AND a page actually renders
#   7. only now record the tag as the last good one (state/<env>.tag)
# If 5 or 6 fails, the last good tag is started again and the script exits 1.
set -eu

IMAGE_REPO=ghcr.io/tahk88-png/voucher-platform # must match the compose files
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-120}

# ::error:: lines are shown as annotations when this runs under GitHub Actions.
fail() {
  echo "::error::$*"
  exit 1
}

usage() {
  echo "usage: $0 <production|staging> <image-tag>" >&2
  exit 2
}

[ $# -eq 2 ] || usage
ENV_NAME=$1
NEW_TAG=$2
case $ENV_NAME in
  production) DEFAULT_PORT=3100 ;;
  staging) DEFAULT_PORT=3101 ;;
  *) usage ;;
esac
case $NEW_TAG in
  '' | *[!A-Za-z0-9_.-]*) fail "invalid image tag '$NEW_TAG'" ;;
esac

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$APP_DIR"
ENV_FILE=env/.env.$ENV_NAME
STATE_FILE=state/$ENV_NAME.tag

for tool in docker curl; do
  command -v "$tool" >/dev/null 2>&1 || fail "'$tool' is not installed on this server"
done
docker compose version >/dev/null 2>&1 || fail "the docker compose plugin is not installed on this server"

# ── 1. env file ──────────────────────────────────────────────────────────────
[ -f "$ENV_FILE" ] || fail "$APP_DIR/$ENV_FILE is missing on the server. Create it once (ssh in): sh $APP_DIR/deploy/init-env.sh $ENV_NAME <your-domain> - then re-run this deploy."

# Last KEY=value line of the env file, surrounding quotes removed.
env_get() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

missing=""
for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL REDIS_PASSWORD REDIS_URL AUTH_SECRET NEXT_PUBLIC_APP_URL; do
  case $(env_get "$key") in
    '' | *change_me*) missing="$missing $key" ;;
  esac
done
[ -z "$missing" ] || fail "$APP_DIR/$ENV_FILE has empty or placeholder values for:$missing (deploy/init-env.sh generates the secrets)"

# The templates use example.com, which nobody using this owns. Left in place it
# points every link at a stranger's domain, and a PLATFORM_ADMIN_EMAILS entry
# on it hands platform-admin rights to whoever registers that address first
# (sign-up does not verify e-mail ownership).
is_example_domain() {
  case $1 in
    *[/.@]example.com | *[/.@]example.com[/:,]*) return 0 ;;
  esac
  return 1
}
placeholder_domain=""
for key in NEXT_PUBLIC_APP_URL NEXTAUTH_URL PLATFORM_ROOT_DOMAIN WEBAUTHN_RP_ID WEBAUTHN_ORIGIN PLATFORM_ADMIN_EMAILS; do
  if is_example_domain "$(env_get "$key")"; then
    placeholder_domain="$placeholder_domain $key"
  fi
done
[ -z "$placeholder_domain" ] || fail "$APP_DIR/$ENV_FILE still uses the example.com placeholder in:$placeholder_domain. Put your own domain / e-mail address there (DEPLOYMENT.md, step 5)."

# The URLs repeat the passwords; a mismatch would only show up at runtime
# (Redis auth failures silently disable rate limiting). Checked when they point
# at the bundled containers — a managed database/Redis URL is left alone.
PG_USER=$(env_get POSTGRES_USER)
PG_PASSWORD=$(env_get POSTGRES_PASSWORD)
PG_DB=$(env_get POSTGRES_DB)
DATABASE_URL=$(env_get DATABASE_URL)
case $DATABASE_URL in
  *@postgres:5432/*)
    case $DATABASE_URL in
      "postgresql://$PG_USER:$PG_PASSWORD@postgres:5432/$PG_DB" | "postgresql://$PG_USER:$PG_PASSWORD@postgres:5432/$PG_DB?"*) ;;
      *) fail "DATABASE_URL in $ENV_FILE must be postgresql://\$POSTGRES_USER:\$POSTGRES_PASSWORD@postgres:5432/\$POSTGRES_DB with the same values as the POSTGRES_* lines" ;;
    esac
    ;;
esac
REDIS_PASSWORD=$(env_get REDIS_PASSWORD)
REDIS_URL=$(env_get REDIS_URL)
case $REDIS_URL in
  *@redis:6379*)
    case $REDIS_URL in
      "redis://:$REDIS_PASSWORD@redis:6379" | "redis://:$REDIS_PASSWORD@redis:6379/"*) ;;
      *) fail "REDIS_URL in $ENV_FILE must be redis://:\$REDIS_PASSWORD@redis:6379 with the same password as REDIS_PASSWORD" ;;
    esac
    ;;
esac

APP_PORT=$(env_get APP_PORT)
APP_PORT=${APP_PORT:-$DEFAULT_PORT}
case $APP_PORT in
  '' | *[!0-9]*) fail "APP_PORT in $ENV_FILE must be a port number (got '$APP_PORT')" ;;
esac
HEALTH_URL="http://127.0.0.1:$APP_PORT/api/health"
# /api/health only proves the database answers. A release whose pages cannot
# render (e.g. every page redirecting in a loop) passes it, so a real page must
# answer 200 too, without following redirects.
PAGE_URL="http://127.0.0.1:$APP_PORT/login"

PREV_TAG=""
if [ -s "$STATE_FILE" ]; then
  PREV_TAG=$(cat "$STATE_FILE")
fi

echo "==> $ENV_NAME: deploying $NEW_TAG (last good: ${PREV_TAG:-none})"

# compose <image-tag> <docker compose arguments...>
compose() {
  tag=$1
  shift
  IMAGE_TAG=$tag sh deploy/compose.sh "$ENV_NAME" "$@"
}

page_status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$PAGE_URL"
}

wait_healthy() {
  started=$(date +%s)
  while :; do
    # -s: connection-refused noise is expected while the app boots
    if curl -fs -o /dev/null --max-time 5 "$HEALTH_URL" && [ "$(page_status)" = 200 ]; then
      return 0
    fi
    [ $(($(date +%s) - started)) -lt "$HEALTH_TIMEOUT" ] || return 1
    sleep 3
  done
}

# Each image is ~3 GB and every push to main adds a staging tag. Keep what
# either environment runs plus this environment's rollback target.
prune_images() {
  keep=" $NEW_TAG $PREV_TAG $(cat state/*.tag | tr '\n' ' ') "
  docker image ls "$IMAGE_REPO" --format '{{.Tag}}' | while read -r tag; do
    case $keep in *" $tag "*) continue ;; esac
    [ "$tag" != "<none>" ] || continue
    docker image rm "$IMAGE_REPO:$tag" >/dev/null 2>&1 || echo "kept $IMAGE_REPO:$tag (still used by a container)"
  done
}

# ── 2. pull ──────────────────────────────────────────────────────────────────
# Only the app image. postgres/redis are pulled once when missing and updated
# deliberately (RUNBOOK.md): re-pulling them here would restart the database
# mid-deploy whenever their tag moved, and count against Docker Hub's
# anonymous pull limit, which the other sites on the host share.
echo "==> Pulling $IMAGE_REPO:$NEW_TAG"
compose "$NEW_TAG" pull --quiet app migrate || fail "could not pull $IMAGE_REPO:$NEW_TAG (does the tag exist, and can this server read the package? See DEPLOYMENT.md, 'Registry access')"

# ── 3. backup ────────────────────────────────────────────────────────────────
# Before the first successful deploy there is nothing to back up.
if [ "$ENV_NAME" = production ] && [ -n "$PREV_TAG" ]; then
  echo "==> Backing up the database before migrating"
  BACKUP_PREFIX=predeploy sh scripts/db-backup.sh production || fail "pre-deploy database backup failed; nothing was changed"
fi

# ── 4. migrate ───────────────────────────────────────────────────────────────
echo "==> Running database migrations"
# </dev/null: `run` attaches stdin, which under ssh is the rest of the session.
compose "$NEW_TAG" run --rm -T migrate </dev/null || fail "migrations failed on $NEW_TAG; the running app was not changed (still ${PREV_TAG:-none}). See RUNBOOK.md, 'Failed migration'."

# ── 5 + 6. replace the app and wait for it ───────────────────────────────────
echo "==> Starting app $NEW_TAG, waiting up to ${HEALTH_TIMEOUT}s for $HEALTH_URL and $PAGE_URL"
if compose "$NEW_TAG" up -d app && wait_healthy; then
  # ── 7. record ──────────────────────────────────────────────────────────────
  mkdir -p state
  printf '%s\n' "$NEW_TAG" >"$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$NEW_TAG" >>"state/$ENV_NAME.history"
  echo "==> $ENV_NAME is healthy on $NEW_TAG"
  prune_images
  exit 0
fi

echo "::error::$ENV_NAME: $NEW_TAG did not pass the health check ($HEALTH_URL and $PAGE_URL) within ${HEALTH_TIMEOUT}s"
echo "--- health endpoint response:"
curl -sS --max-time 5 "$HEALTH_URL" || echo "(no response)"
echo
echo "--- $PAGE_URL answered HTTP $(page_status) (expected 200)"
echo "--- app logs ($NEW_TAG):"
compose "$NEW_TAG" logs --no-color --tail=100 app || echo "(could not read the app logs)"

if [ -z "$PREV_TAG" ]; then
  fail "no earlier healthy $ENV_NAME deploy to roll back to; the failing container is left running for debugging"
fi

echo "==> Rolling back to $PREV_TAG"
if compose "$PREV_TAG" up -d app && wait_healthy; then
  echo "::warning::$ENV_NAME rolled back to $PREV_TAG, which is healthy again. $NEW_TAG was not kept."
else
  echo "::error::rollback to $PREV_TAG is not healthy either. Check: sh $APP_DIR/deploy/compose.sh $ENV_NAME logs app"
fi
exit 1
