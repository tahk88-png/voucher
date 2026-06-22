# Launch Mode Implementation Guide

This guide explains how to use the launch mode features (kill switch and feature flags) that have been prepared for the platform.

## Prerequisites

1. Run the migration to add launch mode fields:
```bash
npx prisma migrate dev --name launch_mode
```

Or manually apply the SQL from `prisma/migrations/launch_mode/migration.sql`

2. Regenerate Prisma client:
```bash
npx prisma generate
```

## Kill Switch

### How It Works

The `isActive` field on the `Merchant` model acts as a kill switch. When set to `false`:
- Merchant is hidden from public routes
- New voucher creation is blocked
- Existing redemptions can complete
- All actions are logged to AuditLog

### Usage

#### Deactivate a Merchant

```typescript
import { deactivateMerchant } from '@/lib/merchant-status';

// Deactivate merchant (requires platform admin)
await deactivateMerchant(merchantId, actorUserId, 'Reason for deactivation');
```

#### Activate a Merchant

```typescript
import { activateMerchant } from '@/lib/merchant-status';

// Activate merchant
await activateMerchant(merchantId, actorUserId);
```

#### Check Merchant Status in API Routes

```typescript
import { requireActiveMerchant } from '@/lib/merchant-status';

export async function POST(req: NextRequest) {
  // ... auth checks ...
  
  // Check merchant is active
  await requireActiveMerchant(merchant.id);
  
  // Continue with voucher creation...
}
```

#### SQL Direct Access

```sql
-- Deactivate merchant
UPDATE "Merchant" SET "isActive" = false WHERE "slug" = 'merchant-slug';

-- Activate merchant
UPDATE "Merchant" SET "isActive" = true WHERE "slug" = 'merchant-slug';

-- Check status
SELECT id, name, "isActive" FROM "Merchant" WHERE "slug" = 'merchant-slug';
```

## Feature Flags

### How It Works

The `featureFlags` JSON field on `Merchant` stores per-merchant feature flags. This allows enabling/disabling features per merchant without code changes.

### Usage

#### Check Feature Flag

```typescript
import { isFeatureEnabled } from '@/lib/merchant-status';

// Check if weekly drops are enabled for merchant
const weeklyDropsEnabled = await isFeatureEnabled(merchantId, 'weeklyDropsEnabled');

if (weeklyDropsEnabled) {
  // Show weekly drop options
}
```

#### Set Feature Flags

```sql
-- Enable weekly drops for a merchant
UPDATE "Merchant" 
SET "featureFlags" = jsonb_set(
  COALESCE("featureFlags", '{}'::jsonb),
  '{weeklyDropsEnabled}',
  'true'::jsonb
)
WHERE "slug" = 'merchant-slug';

-- Disable a feature
UPDATE "Merchant" 
SET "featureFlags" = jsonb_set(
  COALESCE("featureFlags", '{}'::jsonb),
  '{weeklyDropsEnabled}',
  'false'::jsonb
)
WHERE "slug" = 'merchant-slug';

-- Set multiple flags
UPDATE "Merchant" 
SET "featureFlags" = '{"weeklyDropsEnabled": true, "analyticsEnabled": false}'::jsonb
WHERE "slug" = 'merchant-slug';
```

### Available Feature Flags

- `weeklyDropsEnabled` - Enable weekly drop functionality
- `analyticsEnabled` - Enable analytics dashboard (V2)
- `customDomainsEnabled` - Enable custom domains (V2)
- `whiteLabelEnabled` - Enable white-label mode (V2)

## Integration Points

### Where to Add Kill Switch Checks

Add `requireActiveMerchant()` checks to:

1. **Voucher Creation** (`app/api/merchant/[slug]/vouchers/route.ts`)
   - Block new vouchers for inactive merchants

2. **Voucher Publishing** (`app/api/vouchers/[id]/publish/route.ts`)
   - Block publishing for inactive merchants

3. **Public Voucher Pages** (`app/v/[id]/page.tsx`)
   - Hide vouchers from inactive merchants

4. **Public Referral Pages** (`app/r/[id]/page.tsx`)
   - Hide referrals from inactive merchants

5. **Redemption Creation** (`app/api/redemptions/route.ts`)
   - Allow existing redemptions, but log warning

### Where to Add Feature Flag Checks

Add feature flag checks to:

1. **Weekly Drop Claim** (`app/api/weekly-drop/claim/route.ts`)
   - Check `weeklyDropsEnabled` flag

2. **Voucher Builder** (`app/merchant/[slug]/vouchers/new/page.tsx`)
   - Show/hide weekly drop options based on flag

3. **Analytics Dashboard** (`app/merchant/[slug]/analytics/page.tsx`)
   - Check `analyticsEnabled` flag (V2)

## Manual Onboarding Flow

### Step 1: Create Merchant

```sql
INSERT INTO "Merchant" (id, name, slug, country, "defaultCurrency", "isActive", "invitedAt")
VALUES (
  gen_random_uuid()::text,
  'New Merchant',
  'new-merchant',
  'US',
  'USD',
  true,
  NOW()
);
```

### Step 2: Add Merchant Admin

```sql
-- First, create or find user
INSERT INTO "User" (id, email, name, "emailVerified")
VALUES (gen_random_uuid()::text, 'admin@new-merchant.com', 'Admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Add as merchant admin
INSERT INTO "MerchantMember" (id, "merchantId", "userId", role)
VALUES (
  gen_random_uuid()::text,
  (SELECT id FROM "Merchant" WHERE slug = 'new-merchant'),
  (SELECT id FROM "User" WHERE email = 'admin@new-merchant.com'),
  'merchant_admin'
);
```

### Step 3: Mark Onboarded

```sql
UPDATE "Merchant" 
SET "onboardedAt" = NOW()
WHERE "slug" = 'new-merchant';
```

## Monitoring

### Check Merchant Status

```sql
SELECT 
  name,
  slug,
  "isActive",
  "invitedAt",
  "onboardedAt",
  "featureFlags"
FROM "Merchant"
ORDER BY "createdAt" DESC;
```

### Audit Log

All kill switch actions are logged:

```sql
SELECT 
  "createdAt",
  action,
  "payloadJson"
FROM "AuditLog"
WHERE action IN ('merchant_activated', 'merchant_deactivated')
ORDER BY "createdAt" DESC;
```

## Best Practices

1. **Always check `isActive` before allowing writes** - Prevents creating vouchers for inactive merchants
2. **Log all kill switch actions** - Use `deactivateMerchant()` and `activateMerchant()` functions
3. **Test feature flags** - Verify flags work before enabling for all merchants
4. **Monitor audit logs** - Track who activated/deactivated merchants
5. **Graceful degradation** - Inactive merchants should see clear messages, not errors

## Emergency Procedures

### Emergency Deactivation

```sql
-- Immediately deactivate merchant
UPDATE "Merchant" SET "isActive" = false WHERE "slug" = 'problematic-merchant';

-- This will:
-- - Block new voucher creation
-- - Hide from public routes
-- - Allow existing redemptions to complete
```

### Reactivation

```sql
-- Reactivate after issue resolved
UPDATE "Merchant" SET "isActive" = true WHERE "slug" = 'problematic-merchant';
```

## Next Steps

1. Run migration: `npx prisma migrate dev --name launch_mode`
2. Integrate `requireActiveMerchant()` into API routes
3. Add feature flag checks where needed
4. Test kill switch functionality
5. Document merchant onboarding process
6. Set up monitoring/alerts for deactivations
