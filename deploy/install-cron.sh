#!/bin/sh
# Install the app's scheduled jobs (deploy/crontab.example) into the current
# user's crontab as one marked block, leaving every other entry untouched:
#
#   sh deploy/install-cron.sh            # install or update the block
#   sh deploy/install-cron.sh --print    # only show the resulting crontab
#   sh deploy/install-cron.sh --remove   # take the block out again
#
# Use this instead of `crontab deploy/crontab.example` on a server where the
# user already has jobs for other sites: that command replaces the whole
# crontab. The paths in the example (/srv/voucher) are rewritten to this
# directory. The previous crontab is saved to logs/ before any change.
set -eu

CRONTAB=${CRONTAB:-crontab}
APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
EXAMPLE=$APP_DIR/deploy/crontab.example
BEGIN="# BEGIN voucher jobs ($APP_DIR) - managed by deploy/install-cron.sh"
END="# END voucher jobs ($APP_DIR)"

MODE=${1:-install}
case $MODE in
  install | --print | --remove) ;;
  *)
    echo "usage: $0 [--print|--remove]" >&2
    exit 2
    ;;
esac

[ -f "$EXAMPLE" ] || {
  echo "error: $EXAMPLE not found" >&2
  exit 1
}

# `crontab -l` exits non-zero when the user has no crontab yet; that is empty,
# not an error. Any other failure shows up when the new crontab is written.
current=$("$CRONTAB" -l 2>/dev/null || true)

# Everything outside our block, byte for byte.
others=$(printf '%s\n' "$current" | awk -v b="$BEGIN" -v e="$END" '
  $0 == b { skip = 1; next }
  $0 == e { skip = 0; next }
  !skip { print }
')

jobs=$(sed -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' -e "s|/srv/voucher|$APP_DIR|g" "$EXAMPLE")

if [ "$MODE" = --remove ]; then
  result=$others
else
  result=$(printf '%s\n%s\n%s\n%s' "$others" "$BEGIN" "$jobs" "$END")
fi
# No leading blank lines when the crontab was empty.
result=$(printf '%s\n' "$result" | sed '/./,$!d')

if [ "$MODE" = --print ]; then
  printf '%s\n' "$result"
  exit 0
fi

mkdir -p "$APP_DIR/logs"
backup=$APP_DIR/logs/crontab.backup.$(date +%Y%m%d-%H%M%S).$$
printf '%s\n' "$current" >"$backup"
printf '%s\n' "$result" | "$CRONTAB" -
if [ "$MODE" = --remove ]; then
  echo "Removed the voucher jobs. Previous crontab saved to $backup."
else
  echo "Installed $(printf '%s\n' "$jobs" | grep -c .) voucher jobs. Previous crontab saved to $backup."
fi
echo "Other entries unchanged: $(printf '%s\n' "$others" | grep -c '^[0-9*@]' || true) jobs."
