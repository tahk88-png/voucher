# Runbook

## Local setup
- `pnpm install`
- `pnpm prisma migrate dev`
- `pnpm prisma db seed`
- `pnpm dev`

## Tenant resolution
Tenant is resolved by host:
- Custom domain mapping (DomainMapping with `status=verified`)
- Subdomain on `PLATFORM_ROOT_DOMAIN` (e.g. `coffee-house.lvh.me:3000`)
- Fallback to hub mode

The resolved tenant context is available in server components and API routes via `lib/tenant-context.ts`.

## Add a page
1. Create a `SitePage` row with:
   - `scope=tenant` (or `hub`)
   - `slug` (e.g. `about`, `contact`, or `/` for home)
   - `status=published`
   - `blocksJson` list (e.g. `["hero","featured_products"]`)
2. Navigate to `/p/<slug>` for tenant/hub pages.

## Add a domain
1. Go to `Merchant > Settings > Custom domains`.
2. Add the domain.
3. Verify DNS + click "Verify" (manual verify for local testing).

## Test hub vs tenant locally
- Hub: `http://localhost:3000/hub`
- Tenant via subdomain: `http://coffee-house.lvh.me:3000`
- Custom domain mapping:
  - Add to hosts file:
    - `127.0.0.1 coffee-house.local`
    - `127.0.0.1 tech-store.local`
  - Open `http://coffee-house.local:3000`

## Checkout intent
Shop and rent create a `CheckoutIntent` via `POST /api/commerce/checkout` and return an intent id.

---

# Production operations

For the first-time setup, see [DEPLOYMENT.md](DEPLOYMENT.md). Everything below
runs **on the server, as the `deploy` user, in the app directory**:

```bash
ssh -i voucher_deploy deploy@SERVER
cd /srv/voucher
```

Replace `production` with `staging` for the staging stack.
`deploy/compose.sh <env> ...` is `docker compose` with the right compose file,
env file and image tag already filled in.

## Status and logs
- Containers: `sh deploy/compose.sh production ps`
- App logs: `sh deploy/compose.sh production logs -f --tail=200 app` (Ctrl+C stops following)
- Database / Redis logs: `... logs --tail=100 postgres` / `redis`
- Health: `curl -fsS http://127.0.0.1:3100/api/health` (staging: 3101); a
  page must render too: `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/login` prints 200
- Deployed version and history: `cat state/production.tag state/production.history`
- A deploy that failed: open the run in GitHub → Actions → Deploy. It shows the
  step that failed and the last 100 lines of the app log.

## Roll back to an earlier version
A failed deploy rolls back by itself. To go back from a release that deployed
fine but misbehaves, pick an earlier tag from `state/production.history`:

```bash
sh deploy/deploy.sh production v1.2.2
```

This runs the normal deploy with that tag: backup, migrations (nothing to
apply for an older image), app swap, health check. The database isn't rolled
back. If the newer release's migrations broke the older code, restore the
backup taken just before that release (below).

## Failed migration
The deploy stops before replacing the app; the old version keeps serving. The
Prisma error is in the workflow log. Then:
1. If the migration is wrong, fix it (or add a new migration) and release a new tag.
2. If Prisma reports a migration *failed halfway* (error P3009), a new deploy
   refuses to continue until that's resolved. Undo what the migration did,
   or restore the `predeploy_*` backup (below), then mark it rolled back:
   `sh deploy/compose.sh production run --rm migrate npx prisma migrate resolve --rolled-back <migration_name>`

## Restore a database backup
Backups are in `backups/production/`: `voucher_*` (nightly) and
`predeploy_*` (before each production deploy), newest last.

```bash
ls backups/production/
sh scripts/db-restore.sh backups/production/predeploy_20260101_120000.sql.gz production
```

It asks for confirmation, stops the app, replaces the database, applies
migrations with the deployed image and starts the app again. Take a fresh
backup first if the current data might still matter:
`sh scripts/db-backup.sh production`.

## Change a setting or secret
Edit `env/.env.production`, then recreate the app container so it picks the
change up:

```bash
nano env/.env.production
sh deploy/compose.sh production up -d app
```

- `AUTH_SECRET`: changing it signs everyone out.
- `PLATFORM_ADMIN_EMAILS`: only addresses whose accounts you registered
  yourself (sign-up does not verify e-mail ownership).
- `REDIS_PASSWORD`: change it together with the password inside `REDIS_URL`,
  then `sh deploy/compose.sh production up -d redis app`.
- `POSTGRES_PASSWORD`: the database keeps the password it was created with, so
  editing the file alone breaks the connection. Change it in the database first,
  then update `POSTGRES_PASSWORD` **and** `DATABASE_URL`, then `up -d app`:
  `sh deploy/compose.sh production exec postgres psql -U voucher -d voucher -c "ALTER USER voucher PASSWORD 'new-hex-password'"`
  (with your `POSTGRES_USER` / `POSTGRES_DB`).

## Update PostgreSQL or Redis
Deploys never re-pull these images, so a database restart only happens when
you choose. For a patch update (same major version), with a short outage:

```bash
sh scripts/db-backup.sh production
sh deploy/compose.sh production pull postgres redis
sh deploy/compose.sh production up -d postgres redis app
```

A major PostgreSQL upgrade (16 → 17) can't reuse the data folder. Back up,
change the image in both compose files through a release, start with an empty
volume, then restore the backup.

## Scheduled jobs
Listed in `crontab -l`. Only failures are logged, in `logs/cron.log`. To run
one by hand: `sh deploy/run-cron.sh production email-queue`.

## Disk space
- `docker system df` shows what Docker uses. Deploys keep only the running and
  the previous app image (about 3 GB each) and delete older ones.
- Container logs are capped (10 MB × 5 files per container).
- `du -sh backups/*`. Rotation keeps 14 of each backup kind; set
  `BACKUP_RETENTION` in the crontab line to change that.

## After a server reboot
The containers start again by themselves (`restart: unless-stopped`), as long
as Docker starts on boot: `systemctl is-enabled docker` must say `enabled`.
Check with `sh deploy/compose.sh production ps`.
