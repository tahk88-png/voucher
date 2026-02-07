# Launch Mode Configuration

Per specification section 15, the platform is prepared for **invite-only merchants** with **manual onboarding**.

## Current Implementation

### Platform Admin
- **Route**: `/admin`
- **Access**: Environment variable `PLATFORM_ADMIN_EMAILS`
- **Purpose**: Manual merchant onboarding and monitoring
- **Status**: Minimal implementation (ready for expansion)

### Merchant Member Management
- **Route**: `/merchant/[slug]/members`
- **Access**: Merchant admin only
- **Purpose**: Add/remove merchant staff
- **Status**: Basic UI (add via database/API for now)

## Feature Flags (To Implement)

The specification requires:
- Feature flags per merchant
- Kill switch per merchant
- Invite-only merchant signup

### Recommended Implementation

```typescript
// Add to Merchant model
model Merchant {
  // ... existing fields
  isActive      Boolean @default(true)  // Kill switch
  featureFlags  Json?                   // Per-merchant feature flags
  invitedAt    DateTime?                // Track manual invites
  onboardedAt  DateTime?                // Track onboarding completion
}
```

### Feature Flag Examples
- `weeklyDropsEnabled: boolean`
- `customDomainsEnabled: boolean`
- `analyticsEnabled: boolean` (V2 feature)
- `whiteLabelEnabled: boolean` (V2 feature)

## Manual Onboarding Flow

1. **Platform admin** creates merchant via database/API
2. **Platform admin** adds merchant admin user via `/merchant/[slug]/members` or database
3. **Merchant admin** receives invite email (to implement)
4. **Merchant admin** logs in and completes onboarding
5. **Merchant** can start creating vouchers

## Kill Switch

To disable a merchant:
```sql
UPDATE "Merchant" SET "isActive" = false WHERE "slug" = 'merchant-slug';
```

This should:
- Hide merchant from public routes
- Prevent new voucher creation
- Allow existing redemptions to complete
- Log action in AuditLog

## No Public Signup

- ✅ No public merchant signup form
- ✅ No public user registration (except via OAuth/magic link)
- ✅ All merchant creation is manual/internal

## Next Steps

1. Add `isActive` and `featureFlags` to Merchant model
2. Implement kill switch logic in API routes
3. Add feature flag checks in relevant routes
4. Create merchant invite email template
5. Add onboarding completion tracking
