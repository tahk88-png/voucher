# Vouchr — Tech Stack

## Core Framework & Language

- **Next.js 14.2.35** (App Router)
- **TypeScript** (strict mode)

## Database & ORM

- **PostgreSQL** (via Docker Compose for local dev)
- **Prisma** (ORM, migrations, type-safe queries)

## Authentication & Authorization

- **Auth.js (NextAuth v5)** — credentials, email magic links, OAuth (Google, Apple)
- **@auth/prisma-adapter** — session/user storage

## Payments

- **Stripe** — voucher purchases, campaign payments, subscription billing

## Email & Communications

- **Resend** — transactional emails (recommended)
- **nodemailer** — fallback/legacy email support
- **SMS** (future) — Twilio or similar

## UI & Styling

- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component library (Radix UI primitives)
- **lucide-react** — icons
- **class-variance-authority** — component variants
- **tailwind-merge** — Tailwind class merging
- **tailwindcss-animate** — animations

## Internationalization

- **next-intl** — i18n routing, translations (13 locales: en, et, es, fr, de, fi, sv, no, da, lv, lt, pl, uk)

## Forms & Validation

- **react-hook-form** — form state management
- **zod** — schema validation

## State Management

- **zustand** — global state (lightweight)

## Utilities

- **date-fns** — date formatting
- **qrcode** — QR code generation for vouchers
- **clsx** — conditional class names

## File Storage (Future)

- **Cloudflare R2** or **AWS S3** — voucher design images, brand assets

## PDF Export

- **@react-pdf/renderer** — client/server-side PDF generation for voucher exports

## PWA

- **next-pwa** — Progressive Web App support (disabled in development)

## Development Tools

- **tsx** — TypeScript execution (scripts, seed)
- **vitest** — testing framework
- **ESLint** — linting
- **Docker Compose** — local PostgreSQL

## Environment Variables

Required:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret (min 32 chars)
- `NEXTAUTH_URL` — app URL (optional, defaults to `http://localhost:3000`)

Stripe (optional for development):

- `STRIPE_SECRET_KEY` — Stripe secret key (required for payments)
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (required for webhooks)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — public key (client-side)
- Note: Stripe helpers will throw clear errors if not configured when used

Resend (optional for development):

- `RESEND_API_KEY` — Resend API key (required for email sending)
- `RESEND_FROM_EMAIL` — default "from" address (optional, defaults to `noreply@vouchr.app`)
- Note: Resend helpers will throw clear errors if not configured when used

Storage (future):

- `R2_ACCOUNT_ID` / `AWS_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY` / `AWS_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` / `S3_BUCKET_NAME`

---

## Stack Philosophy

- **Type-safe** — TypeScript strict, Prisma types, Zod validation
- **Modular** — clear boundaries (auth, billing, vouchers, referrals)
- **Production-ready** — error handling, audit logs, RBAC where needed
- **Developer-friendly** — hot reload, clear errors, good DX
