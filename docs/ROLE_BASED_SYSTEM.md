# Role-Based System Architecture

Last updated: 2026-02-07

## A) Role list and permission matrix

Roles are centralized in `lib/access-control/roles.ts`:

- `guest`
- `end_user`
- `tenant_staff`
- `tenant_owner`
- `platform_admin`

Tenant membership roles (DB-facing):

- `merchant_staff`
- `merchant_admin`

### Permission matrix (single source of truth)

| Permission | guest | end_user | tenant_staff | tenant_owner | platform_admin |
|---|---|---|---|---|---|
| `platform.read` |  |  |  |  | x |
| `platform.manage` |  |  |  |  | x |
| `tenant.read` |  |  | x | x | x |
| `tenant.manage` |  |  |  | x | x |
| `tenant.members.manage` |  |  |  | x | x |
| `campaign.read` |  |  | x | x | x |
| `campaign.create` |  |  |  | x | x |
| `campaign.update` |  |  |  | x | x |
| `campaign.delete` |  |  |  | x | x |
| `voucher.read` |  |  | x | x | x |
| `voucher.create` |  |  |  | x | x |
| `voucher.publish` |  |  |  | x | x |
| `voucher.redeem` |  |  | x | x | x |
| `billing.read` |  |  | x | x | x |
| `billing.manage` |  |  |  | x | x |
| `shop.checkout` |  | x | x | x | x |
| `rental.book` |  | x | x | x | x |
| `wallet.read` |  | x | x | x | x |
| `referral.create` |  | x | x | x | x |

## B) View/route map per role

Route defaults and navigation are centralized in `ROLE_ROUTE_MAP` in `lib/access-control/roles.ts`.

### Guest
- Default landing: `/`
- Allowed views: marketing and public catalog routes only
- Primary nav: Campaigns, Shop, Rent, Login

### End user
- Default landing: `/app`
- Allowed views: user hub, referrals, wallet, settings, notifications
- Primary nav: Home, Referrals, Wallet, Settings

### Tenant staff
- Default landing: `/merchant/:slug/dashboard`
- Allowed views: dashboard, campaigns, vouchers, events, redemptions
- No access to tenant billing/team management

### Tenant owner
- Default landing: `/merchant/:slug/dashboard`
- Allowed views: tenant staff views + campaigns/vouchers create flows + members + settings + page builder
- Full tenant operational authority

### Platform admin
- Default landing: `/admin`
- Allowed views: platform admin views and all tenant data views
- Global governance authority

### Server-side enforcement points

- `app/admin/page.tsx` -> `requirePlatformAdminProfile()`
- `app/merchant/[slug]/layout.tsx` -> `requireMerchantProfileAccessBySlug(...)`
- `app/(merchant)/merchant/layout.tsx` -> authenticated tenant role gate
- `app/(user)/app/layout.tsx` -> authenticated user gate
- `app/(user)/app/entry/page.tsx` -> role-based post-login landing redirect

## C) Business rule summary

Business rules are centralized in:

- `lib/access-control/guards.ts` (authn/authz/policy guards)
- `lib/access-control/monetization.ts` (entitlements and plan logic)
- `lib/billing.ts` (backward-compatible billing API helpers using centralized entitlements)

### Core rule categories

- Authentication required for all protected routes and APIs.
- Tenant access requires explicit membership (`merchant_staff` or `merchant_admin`) unless user is `platform_admin`.
- Mutating tenant resources requires minimum role:
  - staff: read/redeem operations
  - admin: create/update/delete and team/billing management
- API is source of truth for rule enforcement; UI only renders based on API decisions.

### State transition rules (implemented and enforced)

- Billing states: `trial` -> `active` -> `grace` -> `locked`
- Campaign/voucher creation blocked when entitlement check fails
- Team invite blocked when seat limit entitlement fails

## D) Monetization and paywall rules

Monetization model is centralized in `lib/access-control/monetization.ts`.

### Plans

- `starter`
- `growth`
- `scale`

### Monetized capabilities

- `campaign.create`
- `voucher.create`
- `team.member.invite`
- `promotion.boost`
- `analytics.advanced`
- `domain.custom`

### Hard rules

- Trial window: `TRIAL_DAYS = 60`
- Grace window after past due/unpaid: `BILLING_GRACE_DAYS = 7`
- `locked` state triggers hard API block (HTTP `402`)
- Capability unavailable on current plan triggers upgrade-required block
- Limit exceeded triggers limit-reached block with structured payload

### Paywall behavior

- Backend: throws `AccessControlError` with status `402` and actionable details (`upgradePath`, `requiredPlan`, `limit`)
- Frontend: merchant create forms detect `402` and redirect to billing/settings upgrade path

## E) Code-level structure

### Centralized access control module

- `lib/access-control/roles.ts`: roles, permissions, route map, default landing helpers
- `lib/access-control/profile.ts`: profile resolution from DB and role aggregation
- `lib/access-control/guards.ts`: policy guards for authn/authz and tenant/capability checks
- `lib/access-control/monetization.ts`: plan catalog, billing state resolver, entitlement engine
- `lib/access-control/http.ts`: consistent API error responses
- `lib/access-control/index.ts`: module exports

### API integrations (current key paths)

- `app/api/admin/merchants/route.ts`
- `app/api/admin/merchants/[id]/route.ts`
- `app/api/admin/audit-log/route.ts`
- `app/api/campaigns/route.ts`
- `app/api/merchant/[slug]/campaigns/route.ts`
- `app/api/merchant/[slug]/vouchers/route.ts`
- `app/api/merchant/[slug]/members/route.ts`

### Dashboard routing

- `app/(user)/app/entry/page.tsx`: role-aware redirect after login
- `app/login/page.tsx`: callback defaults to role entrypoint
- `app/merchant/[slug]/layout.tsx`: tenant shell access by effective tenant role
- `components/navigation/merchant-shell.tsx`: role-aware merchant navigation

## Recommended folder structure (target, compact/domain-first)

```text
app/
  (public)/...
  (auth)/login/...
  (user)/app/...
  (merchant)/merchant/[slug]/...
  (admin)/admin/...
  api/
    admin/...
    merchant/...
    commerce/...
    public/...
lib/
  access-control/
  billing/
  commerce/
  notifications/
  persistence/
components/
  ui/
  navigation/
  merchant/
  user/
docs/
  ROLE_BASED_SYSTEM.md
```

This target keeps business logic in `lib/*` domain modules and keeps app routes thin and policy-driven.
