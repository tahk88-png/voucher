#!/bin/sh
# docker compose for one environment of this host, with the right files:
#
#   sh deploy/compose.sh <production|staging> <docker compose arguments...>
#
#   sh deploy/compose.sh production ps
#   sh deploy/compose.sh production logs -f --tail=200 app
#   sh deploy/compose.sh production restart app
#
# Passes env/.env.<environment> for interpolation (--env-file) and picks
# docker-compose.prod.yml / docker-compose.staging.yml. IMAGE_TAG comes from
# the environment if set, otherwise from state/<environment>.tag — the last tag
# deploy/deploy.sh saw pass its health check.
set -eu

if [ $# -lt 1 ]; then
  echo "usage: $0 <production|staging> <docker compose arguments...>" >&2
  exit 2
fi

case $1 in
  production) COMPOSE_YML=docker-compose.prod.yml ;;
  staging) COMPOSE_YML=docker-compose.staging.yml ;;
  *)
    echo "unknown environment '$1' (use production or staging)" >&2
    exit 2
    ;;
esac
ENV_NAME=$1
shift

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$APP_DIR"
ENV_FILE=env/.env.$ENV_NAME

if [ ! -f "$ENV_FILE" ]; then
  echo "::error::$APP_DIR/$ENV_FILE is missing. Create it with: sh $APP_DIR/deploy/init-env.sh $ENV_NAME <your-domain>" >&2
  exit 1
fi

if [ -z "${IMAGE_TAG:-}" ] && [ -s "state/$ENV_NAME.tag" ]; then
  IMAGE_TAG=$(cat "state/$ENV_NAME.tag")
fi
if [ -z "${IMAGE_TAG:-}" ]; then
  echo "No healthy $ENV_NAME deploy recorded yet (state/$ENV_NAME.tag). Set IMAGE_TAG=<tag> to choose one." >&2
  exit 1
fi
export IMAGE_TAG

exec docker compose --env-file "$ENV_FILE" -f "$COMPOSE_YML" "$@"
