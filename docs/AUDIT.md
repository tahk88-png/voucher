# Vouchr — Full Audit

**Date:** 2025-01  
**Scope:** Get project running; deps, scripts, auth, env, routes.

---

## 1. Package & Scripts ✅

| Script | Action |
| --- | --- |
| `dev` | next dev |
| `dev:full` | scripts/dev-full.ps1: .env.local, Docker Postgres, db push, seed, ensure-test-user, dev |
| `db:setup` | db:check, docker:up, wait 5s, db:wait, db:push, db:seed (no ensure-test-user) |
| `db:seed` | tsx prisma/seed.ts |
| `db:ensure-test-user` | tsx prisma/ensure-test-user.ts ([test@example.com](mailto:test@example.com) + Coffee House) |
| `db:push` | prisma db push |

- `dev:full` is the one-command path; requires Docker Desktop.
- `db:setup` does not run `db:ensure-test-user`; seed already upserts `test@example.com` and member.
- **Seed on existing DB:** `merchant.create` etc. can fail with "Unique constraint" (e.g. `slug`). Run `npm run db:ensure-test-user`; test user and Coffee House are then ensured.

---

## 2. Auth ✅

- **Credentials:** [test@example.com](mailto:test@example.com) / test123 (dev; from `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` or defaults).
- **Email:** magic link (needs SMTP in .env).
- **OAuth:** Google, Apple (optional env).
- **Session:** `strategy: 'jwt'` (required for Credentials).

---

## 3. Env

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Local: `postgresql://voucher_user:voucher_pass@localhost:5432/voucher_db` |
| `AUTH_SECRET` | yes | min 32 chars |
| `NEXTAUTH_URL` | optional | e.g. <http://localhost:3000> |
| `TEST_USER_EMAIL` | no | default [test@example.com](mailto:test@example.com) (dev) |
| `TEST_USER_PASSWORD` | no | default test123 (dev) |

- `dev:full` overwrites `.env.local` with `DATABASE_URL` and `AUTH_SECRET`.
- `.env` is used when `.env.local` is absent; ensure only one `DATABASE_URL` (local Postgres).

---

## 4. Login & /app ✅

- **/login:** Credentials (e‑post+parool), magic link, Google, Apple. Test hint shown in dev.
- **/app:** After login, lists user’s merchants (Wallet, Vouchers, Merchant Dashboard). [test@example.com](mailto:test@example.com) is `merchant_admin` for Coffee House (seed + ensure-test-user).

---

## 5. Docker & DB ✅

- **docker-compose.yml:** postgres (voucher_user, voucher_pass, voucher_db, 5432), redis.
- **wait-for-db.ps1:** TcpClient to `127.0.0.1:5432`.
- **dev:full:** `docker compose up -d postgres`, then wait-for-db, db push, seed, ensure-test-user.

---

## 6. Seed ✅

- Merchants: Coffee House, Tech Store.
- Users: [admin@coffee-house.com](mailto:admin@coffee-house.com), [user@example.com](mailto:user@example.com), [**test@example.com**](mailto:test@example.com) (upsert).
- [test@example.com](mailto:test@example.com) is member of Coffee House (merchant_admin).
- Vouchers, referral, redemption, credit, audit log.

---

## 7. Known / Non-blocking

- **next-intl:** `getRequestConfig` `locale` is deprecated in favor of `requestLocale`; non-blocking.
- **i18n:** `getRequestConfig` must return `locale`; next major may require it.

---

## 8. Quick Run

**Option A — dev:full (Docker):**

```bash
npm run dev:full
```

**Option B — manual:**

```bash
docker compose up -d postgres
# wait a few seconds
npm run db:push
npm run db:seed
npm run db:ensure-test-user
npm run dev
```

Then: <http://localhost:3000/login> → [test@example.com](mailto:test@example.com) / test123 → /app.
