# Architecture

## Modules
- Voucher system: campaigns, vouchers, referrals, redemptions.
- B2B shop: products + cart to checkout intent.
- B2B rent: rental items + date-based quote intent.
- Page builder: `PageBuilderPage` (store/rental) for tenant layouts.
- Site pages: `SitePage` blocks for home and static pages.
- Custom domains: `DomainMapping` with verified status.
- Hub: aggregates tenants and featured content.

## Tenant context
Tenant context is resolved per-request based on host:
1. Verified custom domain
2. Subdomain on `PLATFORM_ROOT_DOMAIN`
3. Hub fallback

All public pages and API handlers must use tenant context to keep isolation intact.

## Data ownership rules
- Each merchant owns their campaigns, vouchers, products, rentals, pages, and domains.
- Hub pages use `scope=hub` and have no merchantId.
- Checkout intents store cart snapshots and are scoped to a merchant.
