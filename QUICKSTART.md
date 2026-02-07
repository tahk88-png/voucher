# Quick Start Guide

## Ühe käsuga (soovitus) — `dev:full`

Kui Docker Desktop on käivitatud:

```bash
npm install
npm run dev:full
```

See käivitab: Postgres, loob/värskendab `.env.local`, teeb `db push`, `db:seed` ja `db:ensure-test-user`, siis dev-serveri.

**Testikasutaja:** `test@example.com` / `test123`  
**Lehed:** <http://localhost:3000/login> → /app (Coffee House: Wallet, Vouchers, Merchant Dashboard)

---

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running
- Git (optional)

## Setup Steps

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:

   ```bash
   # Copy the example env file
   # Edit .env and set:
   # - AUTH_SECRET (generate: openssl rand -base64 32)
   # - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
   # - DATABASE_URL (already set for Docker)
   ```

3. **Start database and initialize**:

   ```bash
   # Quick setup (recommended)
   npm run db:setup
   
   # Or manually:
   npm run db:check      # Check Docker Desktop
   npm run docker:up     # Start containers
   npm run db:wait       # Wait for database
   npm run db:push       # Push schema
   npm run db:seed       # Seed data
   ```

4. **Start development server**:

   ```bash
   npm run dev
   ```

5. **Open browser**:
   Navigate to <http://localhost:3000>

## Test the Flow

1. **View a voucher** (after creating one):
   - Go to <http://localhost:3000/v/[voucherId]>
   - Replace [voucherId] with an actual voucher ID from your database
   - Or check Prisma Studio: `npm run db:studio`

2. **Login** (e‑post + parool):
   - Go to <http://localhost:3000/login>
   - [**test@example.com**](mailto:test@example.com) / **test123** (Credentials; töötab kohe kui `dev:full` või `db:ensure-test-user` on käivitatud)
   - Või [admin@coffee-house.com](mailto:admin@coffee-house.com) — magic link (vajab SMTP) või OAuth

3. **Create a voucher**:
   - Go to <http://localhost:3000/merchant/coffee-house/vouchers/new>
   - Fill in the form and create a voucher

4. **Share voucher**:
   - View the voucher at `/v/[voucherId]`
   - Click "Share & Earn Credit" (requires login)
   - Copy the referral link

5. **Redeem voucher**:
   - Open referral link in incognito/private window
   - Enter order amount and click "Redeem Online"

6. **Confirm redemption** (as staff):
   - Go to <http://localhost:3000/merchant/coffee-house/redemptions>
   - Click "Confirm Redemption" on pending redemptions

7. **View credit wallet**:
   - Go to <http://localhost:3000/app/coffee-house/wallet>
   - See unlocked credit

8. **Apply credit**:
   - Go to <http://localhost:3000/app/coffee-house/checkout-demo>
   - Enter order amount and apply credit

## Seed Data

The seed script creates:

- 2 merchants (Coffee House, Tech Store)
- 3 users: [**test@example.com**](mailto:test@example.com) (parool: test123), [admin@coffee-house.com](mailto:admin@coffee-house.com), [user@example.com](mailto:user@example.com)
- Sample vouchers, referrals, and credits

`npm run db:ensure-test-user` tagab [test@example.com](mailto:test@example.com) ja Coffee House liikmelisuse ka siis, kui seed on juba käivitatud.

## Troubleshooting

**Docker Desktop not starting**:

- Run: `npm run db:check` to check Docker status
- Start Docker Desktop manually from Start Menu
- See [TROUBLESHOOTING.md][troubleshooting] for detailed solutions

**Database connection error**:

- Run: `npm run db:wait` to wait for database
- Check Docker containers: `npm run docker:logs`
- Ensure Docker is running: `docker ps`
- Restart: `npm run docker:down && npm run docker:up`

**Port already in use**:

- Change port in `package.json`: `"dev": "next dev -p 3001"`

**Auth not working**:

- Ensure AUTH_SECRET and NEXTAUTH_SECRET are set in .env
- For email magic links, configure SMTP settings
- For OAuth, add provider credentials

**PWA icons missing**:

- Create 192x192 and 512x512 PNG icons
- Place in `public/` as `icon-192.png` and `icon-512.png`

## Next Steps

- Configure SMTP for email magic links
- Add OAuth provider credentials (Google, Apple)
- Customize branding and colors
- Add more merchants and vouchers
- Deploy to production (Vercel, Render, etc.)

[troubleshooting]: docs/TROUBLESHOOTING.md
