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
