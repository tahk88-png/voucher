# MVP Compliance Audit

## ✅ MVP Pages (Required & Present)

### PUBLIC
- ✅ `/v/[voucherId]` - Public voucher page
- ✅ `/r/[referralId]` - Public referral page  
- ✅ `/login` - Login page

### USER
- ✅ `/app` - User home
- ✅ `/app/[merchant]/wallet` - Credit wallet
- ⚠️ `/app/[merchantSlug]/vouchers` - User vouchers (not explicitly in spec, but useful for flow B)
- ✅ `/app/[merchantSlug]/checkout-demo` - Checkout demo (required for flow F)

### MERCHANT
- ✅ `/merchant/[slug]/dashboard` - Dashboard
- ✅ `/merchant/[slug]/vouchers` - Voucher list
- ✅ `/merchant/[slug]/vouchers/new` - Voucher builder
- ✅ `/merchant/[slug]/redemptions` - Redemptions list
- ✅ `/merchant/[slug]/settings` - Settings

## ⚠️ Non-MVP Pages (Present but Not in Scope)

These pages exist but are NOT in the MVP specification:

1. **`/admin`** - Platform admin dashboard
   - Status: Present, minimal implementation
   - Action: Keep for launch mode (manual onboarding), but document as internal-only

2. **`/merchant/[slug]/analytics`** - Analytics dashboard
   - Status: Present with charts/stats
   - Action: **REMOVE or hide** - Not in MVP scope

3. **`/merchant/[slug]/referrals`** - Referral analytics
   - Status: Present with referral stats
   - Action: **REMOVE or hide** - Not in MVP scope

4. **`/merchant/[slug]/members`** - Member management
   - Status: Present, minimal
   - Action: Keep for launch mode (manual onboarding), but hide from navigation

5. **`/m/[slug]`** - Public merchant landing page
   - Status: Present, shows merchant vouchers
   - Action: **REMOVE** - Not in MVP scope (spec says "NO OTHER PAGES")

## ✅ Core Flows Verification

### A) Merchant creates voucher → publish
- ✅ Voucher builder at `/merchant/[slug]/vouchers/new`
- ✅ Publish endpoint: `/api/vouchers/[id]/publish`
- ✅ Status: Working

### B) User shares voucher
- ✅ Share button on `/v/[voucherId]`
- ✅ Creates referral via `/api/referrals/create`
- ✅ Generates share URL `/r/[referralId]`
- ✅ Status: Working

### C) Friend redeems voucher
- ✅ Redemption form on `/r/[referralId]`
- ✅ POST to `/api/redemptions`
- ✅ Creates locked credit
- ✅ Status: Working

### D) Staff confirms redemption
- ✅ Confirm button on `/merchant/[slug]/redemptions`
- ✅ POST to `/api/redemptions/[id]/confirm`
- ✅ Status: Working

### E) Credit unlocks
- ✅ `unlockCreditForRedemption()` in `lib/credits.ts`
- ✅ Called after redemption confirmation
- ✅ Status: Working

### F) User applies credit in checkout demo
- ✅ Checkout demo at `/app/[merchantSlug]/checkout-demo`
- ✅ Apply credit endpoint: `/api/credits/apply`
- ✅ Status: Working

## ✅ Data Model Compliance

All required models present:
- ✅ Merchant
- ✅ MerchantMember
- ✅ User
- ✅ Voucher
- ✅ Referral
- ✅ Redemption
- ✅ CreditLedger
- ✅ CreditUsage
- ✅ AuditLog

Business rules enforced:
- ✅ Credit ≠ money (per-merchant, expires)
- ✅ Credit starts LOCKED
- ✅ Unlock only after redemption confirmation
- ✅ No self-referral (checked in redemption flow)
- ✅ Weekly drops have fixed stock

## ✅ Security & Fraud

- ✅ Rate limiting (`lib/fraud.ts`)
- ✅ Device/IP heuristics (rate limits)
- ✅ Hashed friend identifiers (`friendHash` in Referral)
- ✅ Audit log for admin/staff actions

## ✅ PWA Requirements

- ✅ `manifest.json` present
- ✅ Service worker (`public/sw.js`)
- ✅ Offline QR code generation
- ✅ Installable (manifest configured)
- ⚠️ Need to verify iOS compatibility

## ❌ Forbidden Features Check

Searched for forbidden terms:
- ✅ No marketplace
- ✅ No public feeds (except `/m/[slug]` which should be removed)
- ✅ No comments
- ✅ No likes
- ✅ No loyalty tiers
- ✅ No AI features
- ✅ No ads
- ✅ No influencer dashboards

## 🎯 Action Items

### High Priority
1. **Remove or hide non-MVP pages:**
   - `/merchant/[slug]/analytics` - Remove or hide from nav
   - `/merchant/[slug]/referrals` - Remove or hide from nav
   - `/m/[slug]` - Remove completely

2. **Verify public pages don't require login:**
   - `/v/[voucherId]` - ✅ Already public
   - `/r/[referralId]` - ✅ Already public

3. **UI/UX compliance:**
   - Verify mobile-first design
   - Verify premium, calm, confident look
   - Verify merchant brand dominates

### Medium Priority
4. **Document launch mode features:**
   - `/admin` - Internal use only
   - `/merchant/[slug]/members` - Manual onboarding

5. **PWA polish:**
   - Verify iOS compatibility
   - Test offline QR generation

### Low Priority
6. **Document V2 backlog:**
   - Create `V2_BACKLOG.md` with forbidden features list
