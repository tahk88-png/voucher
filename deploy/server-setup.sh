#!/bin/sh
# One-time preparation of a shared Ubuntu server for the voucher stack.
# Run as root; safe to run again. See DEPLOYMENT.md, step 2.
#
# From your computer, without copying anything to the server first:
#   ssh root@SERVER "DEPLOY_PUBKEY='$(cat voucher_deploy.pub)' sh -s" < deploy/server-setup.sh
# Optional arguments: app directory (default /srv/voucher) and user (default deploy):
#   ssh root@SERVER "DEPLOY_PUBKEY='...' sh -s -- /srv/voucher deploy" < deploy/server-setup.sh
#
# What it does:
#   - creates the deploy user (SSH key login only, no password), adds it to the
#     docker group and installs DEPLOY_PUBKEY in its authorized_keys
#   - creates the app directory with env/, state/, backups/, logs/ owned by it,
#     and tightens any existing env files to mode 600
# What it deliberately does NOT do on a server that other sites share: touch
# sshd, the firewall, nginx or Docker's configuration. Those steps are printed
# at the end for you to apply yourself.
set -eu

APP_DIR=${1:-/srv/voucher}
DEPLOY_USER=${2:-deploy}

fail() {
  echo "error: $*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || fail "run this as root (sudo sh $0)"
case $APP_DIR in
  /*) ;;
  *) fail "the app directory must be an absolute path (got '$APP_DIR')" ;;
esac
command -v docker >/dev/null 2>&1 || fail "Docker is not installed. Install Docker Engine and the compose plugin first: https://docs.docker.com/engine/install/ubuntu/"
docker compose version >/dev/null 2>&1 || fail "the docker compose plugin is missing (apt-get install docker-compose-plugin)"
getent group docker >/dev/null 2>&1 || fail "there is no 'docker' group; is Docker installed from the official packages?"
command -v curl >/dev/null 2>&1 || fail "curl is missing (apt-get install curl); deploys use it for the health check"

# ── deploy user ──────────────────────────────────────────────────────────────
if id "$DEPLOY_USER" >/dev/null 2>&1; then
  echo "User $DEPLOY_USER exists."
else
  # '*' as the password hash: no password can ever match, SSH keys still work
  useradd --create-home --shell /bin/bash --password '*' "$DEPLOY_USER"
  echo "Created user $DEPLOY_USER (key login only)."
fi
# Membership of the docker group is root-equivalent on this host: guard the
# private key that GitHub holds accordingly.
usermod -aG docker "$DEPLOY_USER"
DEPLOY_GROUP=$(id -gn "$DEPLOY_USER")
DEPLOY_HOME=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" "$DEPLOY_HOME/.ssh"
AUTH_KEYS=$DEPLOY_HOME/.ssh/authorized_keys
[ -f "$AUTH_KEYS" ] || install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" /dev/null "$AUTH_KEYS"
if [ -n "${DEPLOY_PUBKEY:-}" ]; then
  case $DEPLOY_PUBKEY in
    ssh-ed25519\ * | ssh-rsa\ * | ecdsa-sha2-*\ * | sk-*\ *) ;;
    *) fail "DEPLOY_PUBKEY does not look like an SSH public key (it must start with ssh-ed25519, ssh-rsa, ...). Never paste the private key here." ;;
  esac
  if grep -qxF "$DEPLOY_PUBKEY" "$AUTH_KEYS"; then
    echo "Public key already installed."
  else
    printf '%s\n' "$DEPLOY_PUBKEY" >>"$AUTH_KEYS"
    echo "Installed the public key for $DEPLOY_USER."
  fi
elif [ ! -s "$AUTH_KEYS" ]; then
  echo "WARNING: no DEPLOY_PUBKEY given and $AUTH_KEYS is empty: nobody can log in as $DEPLOY_USER yet."
fi
chown "$DEPLOY_USER:$DEPLOY_GROUP" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

# ── app directory ────────────────────────────────────────────────────────────
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" "$APP_DIR"
for dir in env state backups logs; do
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" "$APP_DIR/$dir"
done
# Env files hold every secret of the stack; the deploy user must own them (one
# created as root would be unreadable for the deploys)
find "$APP_DIR/env" -type f -name '.env.*' ! -name '*.example' \
  -exec chown "$DEPLOY_USER:$DEPLOY_GROUP" {} + -exec chmod 600 {} +
echo "Prepared $APP_DIR."

# ── checks that need a human ─────────────────────────────────────────────────
for port in 3100 3101; do
  if command -v ss >/dev/null 2>&1 && ss -ltnH "sport = :$port" | grep -q .; then
    echo "NOTE: port $port is already in use on this server. Set APP_PORT to a free port in the env file (and in the nginx site)."
  fi
done

# The fingerprint of the host key the deploy actions will actually be shown.
# Their Go SSH client (appleboy/ssh-action, scp-action) sets no host-key
# algorithm list, so it prefers ECDSA, then RSA, then Ed25519: on a stock
# Ubuntu server that is the ECDSA key. Printing the Ed25519 one made every
# deploy fail with "host key fingerprint mismatch".
HOST_FINGERPRINT=""
for key_type in ecdsa rsa ed25519; do
  if [ -f "/etc/ssh/ssh_host_${key_type}_key.pub" ]; then
    HOST_FINGERPRINT=$(ssh-keygen -lf "/etc/ssh/ssh_host_${key_type}_key.pub" | cut -d' ' -f2)
    break
  fi
done

cat <<EOF

Done. Next (DEPLOYMENT.md):
  - GitHub secrets: DEPLOY_HOST=<this server's IP>, DEPLOY_USER=$DEPLOY_USER,
    DEPLOY_APP_DIR=$APP_DIR, DEPLOY_SSH_KEY=<the private key>
    ${HOST_FINGERPRINT:+DEPLOY_HOST_FINGERPRINT=$HOST_FINGERPRINT (optional, recommended)}
  - Test the login from your computer: ssh -i voucher_deploy $DEPLOY_USER@<this server> docker ps

Hardening NOT applied automatically (other sites share this server; check
each step against them first, and keep a root session open while testing):
  - SSH: once every account that logs in here uses keys, set in
    /etc/ssh/sshd_config:  PasswordAuthentication no
                           PermitRootLogin prohibit-password
    then:  sshd -t && systemctl reload ssh
  - Firewall: allow only SSH, HTTP and HTTPS from outside, e.g.
      ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
    (ufw status first: other sites may need more ports). This stack publishes
    nothing except the app on 127.0.0.1, so it needs no firewall rule.
  - Automatic security updates:  apt-get install unattended-upgrades
EOF
