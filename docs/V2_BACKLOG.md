# V2 Backlog

**DO NOT BUILD** - These features are explicitly forbidden in MVP and should only be documented for future consideration.

## Forbidden Features (Per Specification)

### Marketplace & Discovery
- ❌ Public marketplace/feed of vouchers
- ❌ Deals feed
- ❌ Ad network
- ❌ Social platform features

### Social Features
- ❌ Comments on vouchers
- ❌ Likes/reactions
- ❌ Social sharing beyond native share sheet
- ❌ User profiles/public pages

### Loyalty & Tiers
- ❌ Loyalty tiers/levels
- ❌ Points systems
- ❌ Gamification

### AI Features
- ❌ AI-powered recommendations
- ❌ AI-generated voucher designs
- ❌ AI content generation

### Advertising
- ❌ Ad placements
- ❌ Sponsored vouchers
- ❌ Third-party advertising

### Influencer Features
- ❌ Influencer dashboards
- ❌ Influencer-specific tools
- ❌ Creator monetization

## Potential V2 Features (Document Only)

These were mentioned in the specification as V2 backlog items:

1. **Apple Wallet / Google Wallet**
   - Add vouchers to native wallet apps
   - QR codes in wallet format

2. **Push Notifications**
   - Credit unlock notifications
   - Redemption confirmations
   - Weekly drop reminders
   - Credit expiry warnings

3. **Multi-language Selector**
   - User-selectable language (beyond browser detection)
   - Language preferences per user

4. **Custom Domains**
   - Merchant-branded domains
   - White-label subdomains

5. **POS Deep Integrations**
   - Direct POS system integration
   - Real-time inventory sync
   - Automated redemption confirmation

6. **Analytics Exports**
   - PDF reports
   - CSV exports (already have for redemptions)
   - Scheduled reports

7. **White-label Mode**
   - Fully branded merchant experience
   - Remove platform branding
   - Custom email templates

## Current Non-MVP Pages (For Reference)

These pages exist but are NOT in MVP scope:

- `/admin` - Platform admin (internal use for launch mode)
- `/merchant/[slug]/analytics` - Analytics dashboard (V2)
- `/merchant/[slug]/referrals` - Referral analytics (V2)
- `/merchant/[slug]/members` - Member management (internal use)
- `/m/[slug]` - Public merchant landing page (should be removed)

## Notes

- MVP focuses on core flows: create → share → redeem → confirm → unlock → apply
- All features must align with "merchant-powered referral infrastructure" identity
- No public discovery or marketplace features
- Platform brand should be minimal; merchant brand dominates
