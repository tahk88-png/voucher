# AI Coding Agent Instructions for Voucher Platform

## Project Overview
This is a multi-tenant referral voucher platform built with Next.js 14 (App Router). It enables merchants to create branded vouchers, manage campaigns, and leverage customer referrals with pay-for-performance pricing.

**Key Architecture:**
- **Multi-tenancy**: Tenants resolved by host (custom domains → subdomains → hub fallback)
- **Modules**: Voucher system, B2B shop, B2B rent, page builder, site pages, hub aggregation
- **Data Isolation**: Each merchant owns their campaigns, vouchers, products, rentals, pages, and domains

## Tech Stack & Conventions
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Next.js Route Handlers, NextAuth (email magic link + OAuth providers)
- **Database**: PostgreSQL with Prisma ORM
- **Internationalization**: next-intl with 15 locales (en default, as-needed prefix)
- **Styling**: Custom design system with warm color palette (#FFC857 primary)
- **Components**: shadcn/ui pattern with variants/sizes (e.g., `WarmButton` with primary/secondary/outline/ghost)
- **State**: Zustand for client state, React cache for tenant context

## Critical Workflows

### Development Setup
```bash
# Full automated setup (Windows PowerShell)
npm run dev:full  # Creates .env.local, starts Docker DB, pushes schema, seeds, starts dev server

# Manual steps
npm run db:setup  # Docker up + db push + seed
npm run dev       # Start dev server
```

### Database Operations
```bash
npm run db:push     # Push schema changes
npm run db:migrate  # Create migration (dev only)
npm run db:seed     # Seed sample data
npm run db:reset    # Fresh DB start
npm run db:studio   # Open Prisma Studio
```

### Testing
```bash
npm test           # Vitest unit tests
npm run test:e2e   # Playwright E2E tests
npm run test:e2e:ui # Playwright with UI
```

### Validation
```bash
npm run verify:setup      # MVP setup verification
npm run validate:env      # Environment variables check
npm run check:migrations  # Migration status
```

## Project-Specific Patterns

### Tenant Context Resolution
Always use `getTenantContext()` from `@/lib/tenant-context` in pages/APIs to determine tenant mode ("tenant" | "hub") and tenant data. Host-based routing:
- Custom domains → verified `DomainMapping`
- Subdomains → merchant slug on `PLATFORM_ROOT_DOMAIN`
- Fallback → hub mode

### Route Groups & Internationalization
- `(landing)`: Public marketing pages
- `(merchant)`: Merchant dashboard (authenticated)
- `(user)`: End-user wallet/vouchers
- `[locale]`: Localized routes with next-intl
- Middleware excludes `/app` (post-login hub) from i18n

### Component Patterns
- **Buttons**: `WarmButton` with variants (primary/secondary/outline/ghost), loading states, fullWidth
- **Cards**: `WarmCard` with consistent padding/borders
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React icons
- **Styling**: CSS variables for design tokens (e.g., `--radius-button`)

### API Patterns
- Route handlers in `app/api/` with descriptive JSDoc
- Use `prisma` from `@/lib/prisma` for DB access
- Error handling with custom error types from `@/lib/errors`
- Authentication via `auth()` from `@/lib/auth`

### Business Logic Libraries
- `@/lib/tenant.ts`: Tenant utilities
- `@/lib/rbac.ts`: Role-based access control
- `@/lib/credits.ts`: Credit system management
- `@/lib/fraud.ts`: Fraud prevention
- `@/lib/stripe.ts`: Payment integration
- `@/lib/emails.ts`: Email sending (Resend/Nodemailer)

### Data Models (Prisma)
- **Users**: Multi-role (platform_admin, merchant_admin, merchant_staff, user)
- **Merchants**: Tenants with branding, currencies
- **Campaigns**: Voucher campaigns with pricing, limits
- **Vouchers**: Generated codes with redemption tracking
- **Referrals**: User-to-user sharing with credit rewards
- **Credits**: Non-transferable, merchant-scoped, expiring balances

### Internationalization
- Messages in `messages/[locale].json`, merged with `en.json` as fallback
- Use `useTranslations()` hook for client, `getTranslations()` for server
- Locale detection: URL prefix (as-needed) or browser

### Security & Fraud Prevention
- Rate limiting on voucher generation/redemption
- Self-referral prevention
- Risk signals tracking
- Audit logging for sensitive operations

## Key Files & Directories
- `lib/tenant-context.ts`: Core tenant resolution logic
- `lib/auth.ts`: NextAuth configuration with test credentials
- `prisma/schema.prisma`: Complete data model
- `components/ui/`: shadcn/ui base components
- `components/layout/`: Shell components (HubShell, TenantShell)
- `app/(landing)/page.tsx`: Landing page with tenant/hub branching
- `scripts/dev-full.ps1`: Windows development setup automation
- `docs/ARCHITECTURE.md`: High-level system design

## Common Pitfalls
- **Tenant Isolation**: Always check `context.mode` and `context.tenant` before accessing merchant data
- **i18n Routing**: Use `Link` from `@/lib/navigation` instead of Next.js Link for locale-aware navigation
- **Database URLs**: Use `postgresql://` format, not `postgres://`
- **Environment**: Copy `.env.example` to `.env`, set `AUTH_SECRET` (32+ chars)
- **Docker**: Ensure Docker Desktop running before DB operations
- **Testing**: E2E tests require running dev server at `http://localhost:3000`</content>
<parameter name="filePath">c:/Users/tahk8/voucher/.github/copilot-instructions.md