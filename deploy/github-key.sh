#!/bin/sh
# Prepare an existing, non-root server user (typically the one that already
# runs your other Docker apps) for GitHub Actions deploys: create the app
# directory and a dedicated SSH key whose public half is authorized for this
# user, print the private half once for the DEPLOY_SSH_KEY secret, then delete
# it from the server. Run as that user; needs no root:
#
#   curl -fsSL https://raw.githubusercontent.com/tahk88-png/voucher/main/deploy/github-key.sh | sh -s -- ~/apps/voucher
#
# (On a fresh server where you have root, use deploy/server-setup.sh instead.)
#
# The key is authorized with `restrict`: no port/agent/X11 forwarding and no
# PTY. The deploy actions only run commands and copy files, so they keep
# working, but the key cannot open tunnels to databases or other services that
# listen on this server's localhost.
set -eu

APP_DIR=${1:-}
[ -n "$APP_DIR" ] || {
  echo "usage: $0 <app-directory, e.g. ~/apps/voucher>" >&2
  exit 2
}
case $APP_DIR in
  /*) ;;
  *) APP_DIR=$(pwd)/$APP_DIR ;;
esac
id -nG | tr ' ' '\n' | grep -qx docker || {
  echo "error: $(id -un) is not in the docker group; deploys run docker compose as this user" >&2
  exit 1
}

mkdir -p "$APP_DIR/env" "$APP_DIR/state" "$APP_DIR/backups" "$APP_DIR/logs"
chmod 700 "$APP_DIR/env" "$APP_DIR/backups"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
AUTH=$HOME/.ssh/authorized_keys
touch "$AUTH"
chmod 600 "$AUTH"

COMMENT="github-actions-voucher"
if grep -q " $COMMENT\$" "$AUTH"; then
  echo "A $COMMENT key is already authorized in $AUTH."
  echo "To replace it: delete that line from $AUTH, run this again, and update the DEPLOY_SSH_KEY secret."
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
ssh-keygen -q -t ed25519 -N '' -C "$COMMENT" -f "$TMPDIR/key"
printf 'restrict %s\n' "$(cat "$TMPDIR/key.pub")" >>"$AUTH"

HOST_KEY=""
for key_type in ecdsa rsa ed25519; do
  if [ -r "/etc/ssh/ssh_host_${key_type}_key.pub" ]; then
    HOST_KEY=$(ssh-keygen -lf "/etc/ssh/ssh_host_${key_type}_key.pub" | cut -d' ' -f2)
    break
  fi
done

cat <<EOF
Prepared $APP_DIR and authorized a new deploy key for $(id -un).

GitHub -> repository -> Settings -> Secrets and variables -> Actions -> New repository secret:
  DEPLOY_HOST              this server's IP address
  DEPLOY_USER              $(id -un)
  DEPLOY_APP_DIR           $APP_DIR
${HOST_KEY:+  DEPLOY_HOST_FINGERPRINT  $HOST_KEY
}  DEPLOY_SSH_KEY           the whole key below, from its BEGIN line to its END line

Paste it into GitHub only - never into a chat or e-mail. If you saved this
output to a file, delete that file once the secret is saved. The key is
deleted from this server when this script ends and cannot be shown again (to
make a new one, remove the old line from $AUTH and run the script again).
=====
$(cat "$TMPDIR/key")
=====
EOF
