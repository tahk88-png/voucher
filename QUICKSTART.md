# Quick Start Guide

Local development only. Putting the site on a server is
[DEPLOYMENT.md](DEPLOYMENT.md); day-to-day operations are [RUNBOOK.md](RUNBOOK.md).
The full reference is [README.md](README.md).

## Prerequisites

- Node.js 20 (`node --version`)
- pnpm 10: `npm install -g pnpm@10.28.1`. `npm install` does **not** work in
  this project (an upstream peer-dependency conflict), always use pnpm.
- Docker (Docker Desktop on Windows/macOS), running

## Ühe käsuga (soovitus)

```bash
pnpm install --frozen-lockfile && npm run env:init && npm run db:setup && npm run dev
```

- `env:init` loob `.env` failist `.env.example` ja genereerib juhusliku
  `AUTH_SECRET`-i (olemasolevat `.env`-i ei kirjuta üle).
- `db:setup` kontrollib Dockerit, käivitab Postgresi ja Redise, ootab andmebaasi,
  teeb `db push` ja `db:seed`.
- Ava <http://localhost:3000>; tervisekontroll: <http://localhost:3000/api/health>.

Windowsis teeb `npm run dev:full` sama PowerShelli skriptiga (kirjutab
`.env.local`-i ja lisab testikasutaja).

**Testikasutaja:** `test@example.com` / `test123` (`npm run db:ensure-test-user`
lisab selle, kui seed on juba varem jooksnud).

## Step by step

```bash
pnpm install --frozen-lockfile
npm run env:init      # .env with a random AUTH_SECRET
npm run db:check      # Docker running? (Windows: starts Docker Desktop)
npm run docker:up     # PostgreSQL + Redis containers
npm run db:wait       # until PostgreSQL answers
npm run db:push       # create the tables
npm run db:seed       # sample merchants, users, vouchers
npm run dev
```

## Test the Flow

1. **Login** (e‑post + parool): <http://localhost:3000/login>, `test@example.com` / `test123`
2. **Create a voucher** (sign in as the merchant admin `admin@coffee-house.com` / `admin123`): <http://localhost:3000/merchant/coffee-house/vouchers/new>
3. **Share it**: open it at `/v/[voucherId]`, click "Share & Earn Credit", copy the referral link
4. **Redeem**: open the referral link in a private window, enter an order amount, "Redeem Online"
5. **Confirm** (as merchant admin or `staff@coffee-house.com` / `staff123`): <http://localhost:3000/merchant/coffee-house/redemptions>
6. **Wallet**: <http://localhost:3000/app/wallet>

Prisma Studio (`npm run db:studio`) shows the data, e.g. voucher IDs.

## Seed Data

- 2 merchants (Coffee House, Tech Store)
- users (e-mail / password): `test@example.com` / `test123` and `user@example.com` / `user123` (customers),
  `admin@coffee-house.com` / `admin123`, `staff@coffee-house.com` / `staff123`, `admin@tech-store.com` / `techadmin123` (merchants)
- local development only: these passwords are public, never seed a server database with them
- sample vouchers, referrals and credits

## Troubleshooting

- **Docker not running:** `npm run db:check` says what to do.
- **Database connection error:** `npm run db:wait`, then `npm run docker:logs`.
  Restart: `npm run docker:down && npm run docker:up`.
- **`AUTH_SECRET: looks like a placeholder`:** `.env` still has the example
  value. Delete `.env` and run `npm run env:init`, or set a random value of at
  least 32 characters.
- **Port 3000 in use:** stop the other app, or run `npx next dev -p 3001`.
- More: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Next Steps

- E-mail: set `RESEND_API_KEY` (or the `SMTP_*` settings) in `.env`
- Sign-in providers: Google / Apple credentials in `.env`
- Deploy: [DEPLOYMENT.md](DEPLOYMENT.md) (your own server with Docker; tags deploy to production)
