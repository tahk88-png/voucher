# MVP Implementation Plan: VoucherLoop

**Based on:** MVP Gap Analysis  
**Goal:** Complete MVP with all required flows end-to-end

---

## Phase 1: Critical Gaps (Blocking MVP)

### 1.1 Campaign Model & Schema

**Priority:** CRITICAL  
**Effort:** 2-3 hours

**Tasks:**

1. Add `Campaign` model to Prisma schema
2. Add `campaignId` to `Voucher` model (optional, for backward compat)
3. Create migration
4. Update seed data

**Schema:**

```prisma
model Campaign {
  id              String   @id @default(cuid())
  merchantId      String
  name            String
  description     String?
  type            String   // weekly | limited
  startDate       DateTime
  endDate         DateTime
  price           Int?     // minor units, null = free
  discountRules   Json?    // { type, value, currency }
  maxRedemptions  Int?
  maxPurchases    Int?
  terms           String?
  creditPercentage Int?    // % of purchase price as credit
  status          String   @default("draft") // draft | active | ended
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  vouchers Voucher[]
  
  @@index([merchantId])
  @@index([status])
  @@index([startDate, endDate])
}

// Update Voucher
model Voucher {
  // ... existing fields
  campaignId      String?
  campaign        Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
}
```

---

### 1.2 Voucher Purchase Flow

**Priority:** CRITICAL  
**Effort:** 3-4 hours

**Tasks:**

1. Create `VoucherPurchase` model
2. Create purchase API: `POST /api/vouchers/[id]/purchase`
3. Update Stripe webhook to create voucher on payment
4. Create free voucher grant API: `POST /api/vouchers/[id]/grant`

**Schema:**

```prisma
model VoucherPurchase {
  id              String   @id @default(cuid())
  voucherId       String?
  campaignId      String?
  merchantId      String
  userId          String
  stripeSessionId String?
  amount          Int      // minor units
  currency        String
  status          String   @default("pending") // pending | paid | failed | refunded
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  voucher Voucher? @relation(fields: [voucherId], references: [id], onDelete: SetNull)
  campaign Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([merchantId])
  @@index([userId])
  @@index([status])
  @@index([stripeSessionId])
}
```

**API Flow:**

```text
1. POST /api/vouchers/[id]/purchase
   - Check voucher exists and is purchasable
   - Create VoucherPurchase (status: pending)
   - Create Stripe checkout session
   - Return checkout URL

2. Stripe Webhook: checkout.session.completed
   - Update VoucherPurchase (status: paid)
   - Create Voucher (if not exists)
   - Issue voucher to user
   - Send email receipt
   - Award credits to referrer (if applicable)
```

---

### 1.3 Email Templates & Integration

**Priority:** CRITICAL  
**Effort:** 3-4 hours

**Tasks:**

1. Create email template components
2. Integrate email sending in purchase flow
3. Integrate email sending in credit earning flow

**Templates to Create:**

- `templates/emails/voucher-purchase-receipt.tsx`
- `templates/emails/voucher-delivery.tsx`
- `templates/emails/credit-earned.tsx`

**Integration Points:**

- Stripe webhook (purchase completion)
- Credit creation (credit earned)
- Voucher issuance (delivery)

---

## Phase 2: High Priority

### 2.1 Merchant Onboarding UI

**Priority:** HIGH  
**Effort:** 2-3 hours

**Tasks:**

1. Add `website` and `supportEmail` to Merchant schema
2. Create onboarding flow: `/merchant/[slug]/onboarding`
3. Create brand profile editor: `/merchant/[slug]/settings/brand`

---

### 2.2 Campaign Management UI

**Priority:** HIGH  
**Effort:** 3-4 hours

**Tasks:**

1. Create campaign list: `/merchant/[slug]/campaigns`
2. Create campaign editor: `/merchant/[slug]/campaigns/new`
3. Create campaign detail: `/merchant/[slug]/campaigns/[id]`
4. Add campaign → voucher generation

---

### 2.3 Dashboard Enhancements

**Priority:** HIGH  
**Effort:** 2 hours

**Tasks:**

1. Add revenue calculation (sum of VoucherPurchase.amount where status=paid)
2. Add outstanding liability (sum of unredeemed voucher values)
3. Add campaign metrics

---

### 2.4 Fix Credit Earning Logic

**Priority:** HIGH  
**Effort:** 1-2 hours

**Tasks:**

1. Move credit creation from redemption to purchase
2. Add configurable credit percentage per campaign
3. Update credit calculation logic

---

## Phase 3: Polish

### 3.1 Redemption Location

**Priority:** MEDIUM  
**Effort:** 1 hour

**Tasks:**

1. Add `location String?` to Redemption model
2. Update redemption UI to capture location

---

### 3.2 Free Voucher Grant

**Priority:** MEDIUM  
**Effort:** 1-2 hours

**Tasks:**

1. Create API: `POST /api/vouchers/[id]/grant`
2. Add UI for merchant to grant free vouchers

---

## Implementation Order

### Week 1: Critical Path

1. Day 1-2: Campaign model + schema migration
2. Day 3-4: Voucher purchase flow + Stripe integration
3. Day 5: Email templates + integration

### Week 2: High Priority

1. Day 1-2: Merchant onboarding UI
2. Day 3-4: Campaign management UI
3. Day 5: Dashboard enhancements + credit earning fix

### Week 3: Polish

1. Day 1: Redemption location
2. Day 2: Free voucher grant
3. Day 3: Testing & bug fixes

---

## Testing Checklist

### Campaign Flow

- [ ] Create campaign
- [ ] Generate vouchers from campaign
- [ ] Purchase voucher via Stripe
- [ ] Free voucher grant

### Purchase Flow

- [ ] Stripe checkout redirects correctly
- [ ] Webhook creates voucher on payment
- [ ] Email receipt sent
- [ ] Credits awarded to referrer

### Email Notifications

- [ ] Purchase receipt email
- [ ] Voucher delivery email
- [ ] Credit earned email

### Dashboard

- [ ] Revenue calculation correct
- [ ] Outstanding liability correct
- [ ] Campaign metrics displayed

---

## Migration Strategy

1. **Backward Compatibility:**
   - `campaignId` is optional in Voucher
   - Existing vouchers work without campaigns
   - Gradual migration to campaign-based flow

2. **Data Migration:**
   - No data migration needed (new features)
   - Existing vouchers remain functional

3. **Deployment:**
   - Deploy schema changes first
   - Deploy API changes
   - Deploy UI changes

---

## Estimated Timeline

- **Phase 1:** 8-11 hours (Critical)
- **Phase 2:** 8-11 hours (High Priority)
- **Phase 3:** 2-3 hours (Polish)
- **Testing:** 4-6 hours
- **Total:** 22-31 hours (~1 week full-time)

---

## Notes

- All changes maintain backward compatibility
- Existing vouchers continue to work
- New features are additive, not breaking
- Can deploy incrementally (Phase 1 → Phase 2 → Phase 3)
