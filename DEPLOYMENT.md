# Deployment

The app runs as a Docker Compose stack on a Linux server: the app container,
PostgreSQL and Redis, behind the server's own nginx. GitHub Actions builds the
image and rolls it out over SSH. This guide sets that up on a **shared Ubuntu
VPS** (one that already hosts other sites). Nothing here needs Vercel,
Supabase or Upstash; those are optional alternatives (see the end).

```
browser ──https──> nginx on the host (80/443, Let's Encrypt)
                     └─> 127.0.0.1:3100 ── app container
                                             ├─ postgres:5432 ┐ private compose network,
                                             └─ redis:6379    ┘ no ports on the host
```

| | Production | Staging |
|---|---|---|
| Deployed by | pushing a tag `v1.2.3` | every push to `main`, once enabled (`STAGING_ENABLED`, step 3) |
| Compose file | `docker-compose.prod.yml` | `docker-compose.staging.yml` |
| Env file on the server | `env/.env.production` | `env/.env.staging` |
| App port (127.0.0.1 only) | 3100 (`APP_PORT`) | 3101 |

Both stacks can run from the same directory on the same server: their
containers, volumes and ports are separate. You don't have to use staging: it
is off until you set the repository variable `STAGING_ENABLED` (step 3), so a
push to `main` builds and deploys nothing.

On the server, everything lives in one directory (default `/srv/voucher`):

```
/srv/voucher/
  docker-compose.prod.yml, docker-compose.staging.yml   copied by every deploy
  deploy/            deploy scripts, nginx and crontab examples (copied by every deploy)
  scripts/           db-backup.sh, db-restore.sh (copied by every deploy)
  env/               .env.production / .env.staging: your settings and secrets (never overwritten)
  state/             last healthy tag per environment + deploy history
  backups/           database dumps
  logs/              cron and backup logs
```

Run the commands marked "on your computer" in a terminal: macOS/Linux, or
**Git Bash** on Windows. Replace `SERVER` with the server's IP address and
`app.example.com` with your domain throughout.

> **Server with HestiaCP, or without root access?** Follow
> [Shared server with HestiaCP](#shared-server-with-hestiacp) below instead of
> steps 2 and 6. Everything else is the same.

---

## 1. Point the domain at the server

At your domain registrar's DNS settings, add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `app` (for app.example.com) or `@` (for the bare domain) | the server's IPv4 address |
| A | `staging` (optional) | the same address |

Add a matching AAAA record only if the server has IPv6. Check it on your computer
(it can take from minutes to a few hours to show up):

```bash
dig +short app.example.com      # must print the server's IP
```

## 2. Prepare the server (once)

The server needs Docker Engine with the compose plugin, nginx and curl. A
server that already runs other Docker sites usually has them. Check, as root:

```bash
docker compose version   # v2.20 or newer
nginx -v
```

If Docker is missing, install it from https://docs.docker.com/engine/install/ubuntu/.

**On your computer**, from the repository folder, create the SSH key GitHub will
deploy with and run the setup script on the server:

```bash
ssh-keygen -t ed25519 -N "" -C voucher-deploy -f voucher_deploy
tr -d '\r' < deploy/server-setup.sh | ssh root@SERVER "DEPLOY_PUBKEY='$(cat voucher_deploy.pub)' sh -s"
```

This creates a `deploy` user (SSH key login only, in the `docker` group) and
`/srv/voucher` with its subfolders. It does **not** change SSH, the firewall or
nginx, because other sites depend on them. It prints the hardening steps
instead, for you to apply once you've checked them against the other sites.

If you log in with a sudo user instead of root, copy the script over first and
run it with sudo:

```bash
tr -d '\r' < deploy/server-setup.sh | ssh YOU@SERVER 'cat > server-setup.sh'
ssh -t YOU@SERVER "sudo DEPLOY_PUBKEY='$(cat voucher_deploy.pub)' sh server-setup.sh"
```

Check the new login works:

```bash
ssh -i voucher_deploy deploy@SERVER docker ps
```

Membership of the `docker` group is equivalent to root on this server, so keep
`voucher_deploy` (the private key) as safe as a root password, e.g. in a
password manager. The later steps use it to log in as `deploy`.

## 3. Add the GitHub secrets

GitHub → the repository → **Settings → Secrets and variables → Actions → New
repository secret**:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | the server's IP address (or host name) |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | the whole content of the `voucher_deploy` file, including the `-----BEGIN` / `-----END` lines |
| `DEPLOY_APP_DIR` | `/srv/voucher` |
| `DEPLOY_HOST_FINGERPRINT` | optional, recommended: the `SHA256:…` value the setup script printed. It is the fingerprint of the server's **ECDSA** host key (the deploy actions prefer ECDSA over Ed25519, so an Ed25519 fingerprint fails every deploy with "host key fingerprint mismatch"). By hand: `ssh-keygen -lf /etc/ssh/ssh_host_ecdsa_key.pub`. With it, a deploy refuses to talk to an impostor server |
| `DEPLOY_PORT` | optional: the SSH port, if it isn't 22 |

**Staging (optional).** Under **Settings → Secrets and variables → Actions →
Variables**, add the repository variable `STAGING_ENABLED` with the value
`true` once `env/.env.staging` exists on the server. Until then pushes to
`main` skip the Deploy workflow instead of failing it.

The deploy job runs in the GitHub environments `production` and `staging`, so
you can also set these per environment (**Settings → Environments**), for
example to use a separate staging server. There you can also add *Required
reviewers* to `production`, so every production deploy waits for your click.

**Registry access.** The image is `ghcr.io/tahk88-png/voucher-platform`. Each
deploy logs the server in to it with the workflow's short-lived token, then logs
out again, so a private package works. When this was written the package was
public. If you make it private, deploys still work, but a manual
`deploy/deploy.sh` run on the server first needs
`docker login ghcr.io -u <github-user>` with a token that has `read:packages`.

## 4. First deploy

**On your computer:**

```bash
git tag v0.1.0
git push origin v0.1.0
```

In GitHub → **Actions → Deploy**, the run builds the image, copies the compose
files and scripts to `/srv/voucher`, and then **stops with
"env/.env.production is missing"**. That's expected on the first run: the
settings file only exists after the next step.

## 5. Create the settings file, then deploy again

```bash
ssh -i voucher_deploy deploy@SERVER
sh /srv/voucher/deploy/init-env.sh production app.example.com
nano /srv/voucher/env/.env.production
```

`init-env.sh` fills in fresh random passwords and secrets and sets every URL to
your domain. `PLATFORM_ADMIN_EMAILS` starts empty (no platform admin). Once the
site is up, register your own account on it, then put that address there and
restart the app (RUNBOOK.md, "Change a setting or secret"). Only list
addresses you have registered yourself: sign-up does not verify that someone
owns the e-mail address they register with. A deploy refuses to run while any
URL or admin address still says `example.com`.
Fill in e-mail (Resend), Stripe and other keys whenever you have them; each
integration stays off until it's configured. Save a copy of the file in a
password manager: the database password is in it.

Then in GitHub, open the failed run and click **Re-run failed jobs**. A
successful run ends with `production is healthy on v0.1.0`. To check on the server:

```bash
curl -fsS http://127.0.0.1:3100/api/health
```

The site is not reachable from outside yet. That's the next step.

## 6. nginx and HTTPS

As root on the server, install the site from the example (it proxies to
127.0.0.1:3100 and sets the headers the app relies on for client IPs and
sign-in), then get a certificate:

```bash
sed 's/app\.example\.com/YOUR.DOMAIN/g' /srv/voucher/deploy/nginx/voucher.conf.example \
  > /etc/nginx/sites-available/voucher.conf
ln -s /etc/nginx/sites-available/voucher.conf /etc/nginx/sites-enabled/voucher.conf
nginx -t && systemctl reload nginx          # nginx -t checks every site; reload only if it passes

apt-get install certbot python3-certbot-nginx   # if certbot isn't installed yet
certbot --nginx -d YOUR.DOMAIN
certbot renew --dry-run
```

Open `https://YOUR.DOMAIN`. For staging, repeat with the staging host name,
port 3101 and the notes at the top of the example file.

## 7. Scheduled jobs and backups

On Vercel, `vercel.json` triggers the app's scheduled jobs (the e-mail queue
every 2 minutes, expiry reminders, reports and so on). On a server, cron has to
do it. As the `deploy` user:

```bash
sh /srv/voucher/deploy/install-cron.sh           # --print to preview, --remove to undo
```

It adds the jobs as one marked block and keeps any other entries in the
user's crontab (saving the previous crontab to `logs/` first).

This also takes a database backup every night at 03:15 into
`/srv/voucher/backups/production/`, keeping the last 14. Every production
deploy takes one more (`predeploy_*.sql.gz`) before it runs migrations. Failed
jobs are logged to `logs/cron.log`.

Backups on the same disk don't survive losing the server. Copy them elsewhere
regularly, for example from your computer:

```bash
scp -i voucher_deploy -r deploy@SERVER:/srv/voucher/backups ./voucher-backups
```

Restoring is covered in [RUNBOOK.md](RUNBOOK.md).

---

## Shared server with HestiaCP

Use this when HestiaCP manages nginx (it regenerates the vhosts it owns, so a
hand-written site file would drift) or when the account that runs your other
Docker apps has no sudo. The app then runs under that existing account, and
only the Hestia step needs root, once.

1. **DNS**: the A record for your domain, as in step 1.
2. **Pick a free host port** (the defaults 3100/3101 may be taken):
   `ss -ltn | grep -E ':31[0-9][0-9] '` lists the ones in use. Below: 3110.
3. **Directory and deploy key**, as the existing Docker user (no root needed):

   ```sh
   # on your computer (PowerShell works too: nothing here needs Git Bash)
   ssh USER@SERVER 'curl -fsSL https://raw.githubusercontent.com/tahk88-png/voucher/main/deploy/github-key.sh | sh -s -- ~/apps/voucher' > voucher-deploy-key.txt
   ```

   It creates `~/apps/voucher` (env/, state/, backups/, logs/) and a key that is
   authorized with `restrict` (no port forwarding, so it cannot reach the
   databases other apps expose on localhost). Open `voucher-deploy-key.txt`,
   add the GitHub secrets it lists (step 3 above), then delete the file.
4. **First deploy**: push a tag (step 4). It copies the files and stops with
   "env/.env.production is missing", as intended.
5. **Settings file** with your port and domain, then re-run the deploy:

   ```sh
   ssh USER@SERVER 'cd ~/apps/voucher && APP_PORT=3110 sh deploy/init-env.sh production app.example.com'
   ```
6. **nginx and HTTPS through Hestia** (as root, once; safe to repeat):

   ```sh
   sh ~USER/apps/voucher/deploy/hestia-site.sh app.example.com 3110
   ```

   It copies a Node proxy template this server already uses (`node-3006`,
   override with `BASE_TEMPLATE=`) to `voucher-3110` with only the port
   changed, adds the web domain to the Hestia user that owns the parent domain
   (no `www.` alias), issues the Let's Encrypt certificate and forces https.
   Hestia tests the nginx config before reloading, so the other sites are not
   affected by a bad template.
7. **Scheduled jobs and backups** without touching the other sites' cron jobs:

   ```sh
   ssh USER@SERVER 'sh ~/apps/voucher/deploy/install-cron.sh'
   ```

## Updating without GitHub Actions deploys

The Deploy workflow's server step is opt-in: it runs only when the repository
variable `AUTO_DEPLOY` is `true` (Settings → Secrets and variables → Actions →
Variables). Without it, pushing a tag still builds and pushes the image, and
you update the server yourself, a few minutes after the tag:

```sh
ssh USER@SERVER 'sh ~/apps/voucher/deploy/update.sh v1.2.3'
```

`deploy/update.sh` downloads that release's compose file and scripts and runs
`deploy/deploy.sh` (backup, migrations, health check, automatic rollback).

## Everyday use

- **Staging** (once `STAGING_ENABLED` is set): push to `main`.
- **Production:** `git tag v1.2.3 && git push origin v1.2.3`.

Each deploy (`deploy/deploy.sh`, run by the workflow):

1. checks the settings file exists, its secrets are filled in, no URL or admin
   address still uses `example.com`, and the database and Redis URLs match
   their passwords
2. pulls the new app image
3. production only: backs up the database
4. runs database migrations to completion. If they fail, the deploy stops and
   the old version keeps running
5. replaces the app container
6. waits up to 120 s for `GET /api/health` to succeed **and** `GET /login` to
   answer 200 (the health endpoint alone only proves the database answers; a
   release whose pages cannot render would pass it)
7. records the version as the last healthy one (`state/production.tag`)

If step 5 or 6 fails, the last healthy version is started again and the run
fails. Old app images are removed from the server (each is about 3 GB); the
running one and the previous one are kept.

Logs, status and manual rollback are in [RUNBOOK.md](RUNBOOK.md).

### Migrations

Migrations are Prisma migrations (`prisma migrate deploy`), applied only by
step 4, never by the app container on start. They only go forward. A rollback
starts the previous image against the already-migrated database, so write
migrations the previous release can live with (add columns first, remove them
a release later). When that's impossible, restore the pre-deploy backup
(RUNBOOK.md).

Never run `npm run db:migrate` (`prisma migrate dev`) against production. It's
the development command that creates migrations and can offer to reset the
database.

## Configuration notes

- **The env file is the single source of settings.** Docker Compose reads it for
  the `${...}` values in the compose file (`--env-file`), and the containers get
  it as their environment. `deploy/compose.sh` passes it for you. Keep values
  on one line, without spaces or `$`.
- **`DATABASE_URL`** is `postgresql://USER:PASSWORD@postgres:5432/DB`, with the
  same values as the `POSTGRES_*` lines. The database password only takes
  effect when the database is first created. Changing it later is in RUNBOOK.md.
- **`REDIS_URL`** is `redis://:PASSWORD@redis:6379` (empty user name, then
  `REDIS_PASSWORD`). Redis refuses clients without the password.
- **`AUTH_TRUST_HOST=true`** is required behind nginx. Without it, sign-in
  fails in production.
- **`APP_PORT`** (3100 / 3101) must be free on the server and match the nginx
  site. Memory limits (`APP_MEM_LIMIT`, `POSTGRES_MEM_LIMIT`,
  `REDIS_MEM_LIMIT`) default to about 1.8 GB for production and 1.3 GB for
  staging; the reasoning is in the compose files.
- **Merchant subdomains.** Merchant site links point to
  `https://<merchant>.<PLATFORM_ROOT_DOMAIN>`. This guide only sets up the one
  host name, so those links do not work until you add a wildcard DNS record
  (`*.app.example.com`), a wildcard certificate (Let's Encrypt issues those only
  through a DNS-01 challenge, e.g. `certbot certonly --manual
  --preferred-challenges dns -d '*.app.example.com'` or your DNS provider's
  certbot plugin) and `server_name .app.example.com;` in the nginx site.
- **Browser-side settings.** `NEXT_PUBLIC_*` values are compiled into the
  browser code when the image is built, and the image is built without them.
  Server code reads them from the env file at runtime (links, e-mails), but
  browser features that need one don't get it: Stripe's publishable key,
  browser-side Sentry, web-push, and browser uploads to Supabase or Pusher.
  Enabling those needs the image build to receive them as build arguments.

## CI/CD (GitHub Actions)

### CI (on PR + main)

- lint, typecheck, unit tests (parallel)
- **schema-drift** — applies the migration chain to a fresh Postgres and fails if `schema.prisma` has drifted without a migration
- **integration-test** — `prisma migrate deploy` against a fresh Postgres, then the DB-backed tests
- build (needs lint/typecheck/test) → docker build (needs build), which then
  smoke-tests the image: migrations against an empty Postgres, then
  `/api/health`, `/`, `/login`, `/contact` and `/robots.txt` must answer 200

### CD (`.github/workflows/deploy.yml`)

- `build-and-push` builds the image and pushes it to
  `ghcr.io/tahk88-png/voucher-platform:<tag>` (`staging-<sha>` for `main`, the
  version for tags). Only this job's `GITHUB_TOKEN` gets `packages: write`; no
  extra registry secret is needed. For `main` it runs only when
  `STAGING_ENABLED` is `true`.
- `deploy` checks the secrets above (and fails with the names of any that are
  missing), copies the compose files, `deploy/` and the backup scripts to
  `DEPLOY_APP_DIR`, then runs `deploy/deploy.sh` over SSH. Its token, which the
  server uses for `docker login`, can only read packages. Deploys to the
  server queue behind each other, production and staging included, since both
  share the directory, scripts and registry login. GitHub keeps only the newest
  waiting run, so if three deploys pile up, the middle one is cancelled and
  has to be re-run.

## Managed services and other hosts (optional)

The Docker stack above is the supported path. Alternatives work through the
same settings:

- **Managed PostgreSQL / Redis** (e.g. Supabase, Neon, Upstash): put their
  URLs in `DATABASE_URL` / `REDIS_URL`. The bundled containers still start. The
  deploy checks skip URLs that don't point at them.
- **Vercel**: `vercel.json` (scheduled jobs, `fra1` region) is kept for that
  option. It needs a managed database and Redis, and is not covered here.

### EU data residency (GDPR)

Keep personal data in the EU:

| What | This guide | If you use a managed service instead |
|---|---|---|
| App, PostgreSQL, Redis | a VPS in an EU location | an EU region (e.g. Supabase `eu-central-1`, Upstash EU, Vercel `fra1` as in `vercel.json`) |
| Object storage | not set up | EU location (e.g. Cloudflare R2 with EU jurisdiction) |
| Monitoring / logging | off until configured | Sentry EU data center; Axiom EU region |
| E-mail | Resend: transactional only, no PII stored | |
| Payments | Stripe handles PCI/GDPR compliance independently | |

Sign a data processing agreement (DPA) with every sub-processor you actually
use (hosting provider, Stripe, Resend, and any of the above). Before launch,
also check:

- [ ] Cookie consent banner is active (see `CookieConsentBanner` component)
- [ ] Analytics blocked until user consents (see `lib/cookie-consent.ts`)

### Data retention policies

| Data | Retention | Action on Expiry |
|------|-----------|-----------------|
| User PII | Until deletion request | Anonymize (see `/api/user/delete-account`) |
| Billing records | 7 years | Retain (legal requirement) |
| Audit logs | 7 years | Append-only, no deletion |
| Analytics events | 90 days | Auto-purge via cron |
| Session data | 30 days | Auto-expire |
| Cookie consent | 1 year | Re-prompt |

## Security

Secrets are never committed. They live only in `env/.env.*` on the server
(mode 600, in a mode-700 folder) and in GitHub secrets. Postgres and Redis are
not published on the host; Redis requires a password; the app listens on
127.0.0.1 only. Docker's published ports bypass ufw, which is why none are
opened.
