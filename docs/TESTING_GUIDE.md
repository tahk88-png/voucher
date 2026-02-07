# Testing Guide - MVP Done Definition

This guide walks through all 8 steps of the MVP "done definition" to verify the platform works end-to-end.

## Prerequisites

1. Database is seeded: `npm run db:seed`
2. Development server is running: `npm run dev`
3. You have two browser windows/tabs (one for referrer, one for friend)

## Test Data

After seeding, you should have:
- **Merchant**: Coffee House (slug: `coffee-house`)
- **Admin user**: `admin@coffee-house.com`
- **Regular user**: `user@example.com`
- **Vouchers**: At least one published voucher

## Step-by-Step Test Flow

### Step 1: Open Voucher Page ✅

1. **Find a voucher ID** from the database:
   ```sql
   SELECT id, "codePrefix" FROM "Voucher" WHERE status = 'published' LIMIT 1;
   ```
   Or check Prisma Studio: `npm run db:studio`

2. **Open voucher page**:
   - URL: `http://localhost:3000/v/[voucherId]`
   - Should load without login
   - Should show merchant branding
   - Should display voucher value clearly
   - Should have "Share & Earn Credit" button (if logged in)

**Expected**: Voucher page loads in <3 seconds, shows value, merchant brand visible.

---

### Step 2: Create Referral ✅

1. **Login as user**:
   - Go to `http://localhost:3000/login`
   - Use email: `user@example.com`
   - Check email for magic link (or use OAuth if configured)

2. **Open voucher page** (from Step 1)

3. **Click "Share & Earn Credit"**:
   - Should create referral via `/api/referrals/create`
   - Should generate share URL: `/r/[referralId]`
   - Should show native share sheet or copy link

**Expected**: Referral created, share URL generated, link can be copied/shared.

---

### Step 3: Share Link ✅

1. **Copy the referral link** from Step 2
   - Format: `http://localhost:3000/r/[referralId]`

2. **Verify link is shareable**:
   - Can be copied to clipboard
   - Native share works (if on mobile/PWA)

**Expected**: Link is valid and shareable.

---

### Step 4: Friend Redeems Voucher ✅

1. **Open referral link in incognito/private window**:
   - URL: `http://localhost:3000/r/[referralId]`
   - Should load without login
   - Should show branded voucher
   - Should show QR code

2. **Redeem online**:
   - Enter order amount (e.g., 100)
   - Click "Redeem Online"
   - Should create redemption via `/api/redemptions`
   - Should show success message

**Expected**: Redemption created, locked credit created for referrer.

**Verify in database**:
```sql
-- Check redemption was created
SELECT id, "voucherId", "referralId", "confirmedAt" FROM "Redemption" ORDER BY "createdAt" DESC LIMIT 1;

-- Check locked credit was created
SELECT id, "userId", amount, status, "sourceId" FROM "CreditLedger" WHERE status = 'locked' ORDER BY "createdAt" DESC LIMIT 1;
```

---

### Step 5: Staff Confirms Redemption ✅

1. **Login as merchant staff/admin**:
   - Go to `http://localhost:3000/login`
   - Use email: `admin@coffee-house.com`
   - Check email for magic link

2. **Go to redemptions page**:
   - URL: `http://localhost:3000/merchant/coffee-house/redemptions`
   - Should see pending redemption (if method was `in_store`)
   - For `online` method, redemption is auto-confirmed

3. **Confirm redemption**:
   - Click "Confirm Redemption" button
   - Should call `/api/redemptions/[id]/confirm`
   - Should unlock credit

**Expected**: Redemption confirmed, credit unlocked.

**Verify in database**:
```sql
-- Check redemption is confirmed
SELECT id, "confirmedAt" FROM "Redemption" WHERE id = '[redemptionId]';

-- Check credit is unlocked
SELECT id, status FROM "CreditLedger" WHERE "sourceId" = '[redemptionId]';
-- Status should be 'available'
```

---

### Step 6: Credit Appears Locked ✅

1. **Login as referrer** (user from Step 2):
   - Go to `http://localhost:3000/login`
   - Use email: `user@example.com`

2. **View wallet**:
   - URL: `http://localhost:3000/app/coffee-house/wallet`
   - Should show locked credit (before Step 5)
   - Should show available credit (after Step 5)

**Expected**: Locked credit visible before confirmation, available after.

---

### Step 7: Credit Unlocks ✅

1. **After Step 5** (staff confirms):
   - Refresh wallet page
   - Locked credit should move to "Available to use"
   - Locked section should show 0 or disappear

**Expected**: Credit status changes from `locked` to `available`.

**Verify in database**:
```sql
SELECT id, status, amount FROM "CreditLedger" WHERE "userId" = '[userId]' ORDER BY "createdAt" DESC;
```

---

### Step 8: Credit Applied in Checkout Demo ✅

1. **Go to checkout demo**:
   - URL: `http://localhost:3000/app/coffee-house/checkout-demo`
   - Should show available credit balance

2. **Enter order amount**:
   - E.g., 50 (in major units, will be converted to minor)

3. **Click "Apply Credit & Complete Order"**:
   - Should call `/api/credits/apply`
   - Should show success message
   - Should update credit balance

**Expected**: Credit applied, order completed, credit balance updated.

**Verify in database**:
```sql
-- Check credit usage
SELECT id, "amountUsed", "creditLedgerIds" FROM "CreditUsage" ORDER BY "createdAt" DESC LIMIT 1;

-- Check credit ledger updated
SELECT id, status FROM "CreditLedger" WHERE id = ANY('[creditLedgerIds]');
-- Status should be 'used'
```

---

## Troubleshooting

### Voucher not found
- Check voucher exists: `SELECT id, status FROM "Voucher" WHERE id = '[id]';`
- Voucher must be `published`

### Referral not created
- Check user is logged in
- Check voucher is published
- Check rate limits: `SELECT COUNT(*) FROM "Referral" WHERE "referrerUserId" = '[userId]' AND "createdAt" > NOW() - INTERVAL '1 hour';`

### Redemption fails
- Check voucher is published and valid
- Check usage limits
- Check self-referral prevention
- Check rate limits

### Credit not unlocking
- Check redemption is confirmed: `SELECT "confirmedAt" FROM "Redemption" WHERE id = '[id]';`
- Check credit exists: `SELECT * FROM "CreditLedger" WHERE "sourceId" = '[redemptionId]';`
- Check unlock function was called

### Credit not applying
- Check credit is available: `SELECT status FROM "CreditLedger" WHERE id = '[id]';`
- Check balance is sufficient
- Check API response for errors

## Quick Test Script

For automated testing, you can use this SQL to verify all steps:

```sql
-- Step 1: Voucher exists and is published
SELECT id, status FROM "Voucher" WHERE status = 'published' LIMIT 1;

-- Step 2: Referral created
SELECT id, "referrerUserId", status FROM "Referral" ORDER BY "createdAt" DESC LIMIT 1;

-- Step 4: Redemption created
SELECT id, "referralId", "confirmedAt" FROM "Redemption" ORDER BY "createdAt" DESC LIMIT 1;

-- Step 5: Credit locked
SELECT id, status, amount FROM "CreditLedger" WHERE status = 'locked' ORDER BY "createdAt" DESC LIMIT 1;

-- Step 7: Credit unlocked
SELECT id, status FROM "CreditLedger" WHERE status = 'available' ORDER BY "createdAt" DESC LIMIT 1;

-- Step 8: Credit used
SELECT id, "amountUsed" FROM "CreditUsage" ORDER BY "createdAt" DESC LIMIT 1;
```

## Success Criteria

All 8 steps should complete without errors:
- ✅ Voucher page loads
- ✅ Referral created
- ✅ Link shareable
- ✅ Friend redeems
- ✅ Staff confirms
- ✅ Credit appears locked
- ✅ Credit unlocks
- ✅ Credit applied

If all steps pass, **MVP is DONE** ✅
