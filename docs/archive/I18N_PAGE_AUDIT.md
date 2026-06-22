# I18N Page Audit (Figma Pages)

Date: 2026-02-08

## Scope
- Folder audited: `figma/app/pages`
- Focus:
  - hardcoded UI text in page components
  - i18n coverage gaps
  - encoding corruption (mojibake)
  - priority order for remediation

## Findings

### 1) Hardcoded UI text concentration (highest first)
Count is heuristic from JSX text-node scan (`>text<` style patterns).

| File | Count |
|---|---:|
| `figma/app/pages/AdminDashboard.tsx` | 194 |
| `figma/app/pages/Landing.tsx` | 74 |
| `figma/app/pages/AdvancedSettings.tsx` | 59 |
| `figma/app/pages/EventDetail.tsx` | 54 |
| `figma/app/pages/MerchantOnboarding.tsx` | 45 |
| `figma/app/pages/EventCreate.tsx` | 43 |
| `figma/app/pages/ComponentShowcase.tsx` | 43 |
| `figma/app/pages/Analytics.tsx` | 41 |
| `figma/app/pages/NewsCreate.tsx` | 37 |
| `figma/app/pages/Cart.tsx` | 36 |
| `figma/app/pages/Settings.tsx` | 35 |
| `figma/app/pages/MerchantWallet.tsx` | 34 |
| `figma/app/pages/IntegrationsSettings.tsx` | 33 |
| `figma/app/pages/StorefrontEditor.tsx` | 32 |
| `figma/app/pages/MerchantDashboard.tsx` | 32 |

### 2) Form placeholder-heavy pages
Good candidates for structured translation key extraction first.

| File | Placeholder count |
|---|---:|
| `figma/app/pages/EventCreate.tsx` | 29 |
| `figma/app/pages/MerchantOnboarding.tsx` | 16 |
| `figma/app/pages/Cart.tsx` | 10 |
| `figma/app/pages/AdvancedSettings.tsx` | 8 |
| `figma/app/pages/VoucherCreate.tsx` | 7 |
| `figma/app/pages/ProductCreate.tsx` | 7 |

### 3) Toast copy hardcoded hotspots
Interactive UX messages likely diverge across languages.

| File | Toast usage count |
|---|---:|
| `figma/app/pages/CampaignCreate.tsx` | 12 |
| `figma/app/pages/EventPublic.tsx` | 8 |
| `figma/app/pages/RentalDetail.tsx` | 8 |
| `figma/app/pages/Share.tsx` | 8 |
| `figma/app/pages/MobileScanner.tsx` | 8 |
| `figma/app/pages/AdminDashboard.tsx` | 8 |
| `figma/app/pages/Referrals.tsx` | 7 |

### 4) Encoding corruption (mojibake)
- `318` affected lines in `figma/app/pages` matched by `Ã|â|�`.
- This remains a blocking quality issue for multilingual UX.

## Changes Applied In This Pass

### i18n coverage improvements
- `figma/app/pages/VoucherPublic.tsx`
  - Added language-aware copy (`et`/`en`) for core public voucher UX.
  - Localized CTA labels, section labels, share/copy toasts, claimed-state copy.
- `figma/app/pages/VouchersList.tsx`
  - Added language-aware copy (`et`/`en`) for list header, filters, search placeholder, empty state, status labels, usage/validity labels.
  - Replaced static voucher copy with language-specific data.
- `figma/app/pages/AdvancedSettings.tsx`
  - Added page-level language helper and localized high-visibility UI copy (headers, sections, labels, actions, security, API/integrations, team).
- `figma/app/pages/MerchantOnboarding.tsx`
  - Added page-level language helper and localized onboarding wizard copy (step labels, validations, form labels/placeholders, legal copy, review labels, CTA flow).
- `figma/app/pages/EventDetail.tsx`
  - Added page-level language helper and localized visible event management surface (tabs, actions, KPI labels, tables, analytics labels, confirmations/toasts).
- `figma/app/pages/Analytics.tsx`
  - Added page-level language helper and localized all visible analytics UI copy (filters, KPIs, chart labels, demographics, tables, insights).
  - Refactored campaign type and gender labels to locale-safe keys.
- `figma/app/pages/Settings.tsx`
  - Added page-level language helper and localized settings UI copy (locations, delivery, payments, branding, and save flow).
  - Localized toast feedback and status labels.
- `figma/app/pages/EventCreate.tsx`
  - Added page-level language helper and localized full event creation flow (wizard steps, field labels/placeholders, ticket settings, payment panels, preview, and CTA flow).
  - Normalized refund policy options to locale-neutral values.

### Encoding fixes
- `figma/app/pages/VoucherCreate.tsx`
  - Fixed mojibake currency/symbol literals (`â‚¬`, `â€”`).
- `figma/app/pages/Referrals.tsx`
  - Fixed mojibake currency/checkmark literals (`â‚¬`, `âœ“`).
- `figma/app/pages/AdvancedSettings.tsx`
  - Fixed mojibake currency and API mask symbols.
- `figma/app/pages/MerchantOnboarding.tsx`
  - Fixed mojibake in monthly revenue range labels.
- `figma/app/pages/Analytics.tsx`
  - Fixed mojibake currency literals and chart value labels.
- `figma/app/pages/Settings.tsx`
  - Fixed mojibake in location, branding, and payment copy.
- `figma/app/pages/EventCreate.tsx`
  - Fixed mojibake currency and fee literals.

## Remaining Priority Order
1. `figma/app/pages/AdminDashboard.tsx`
2. `figma/app/pages/Landing.tsx`
3. `figma/app/pages/ComponentShowcase.tsx`
4. `figma/app/pages/NewsCreate.tsx`
5. `figma/app/pages/Cart.tsx`

## Recommended Next Pass
- Extract page-level copy blocks for the remaining top-priority files into shared i18n dictionaries.
- Normalize currency/date labels through shared formatter helpers.
- Continue dedicated mojibake cleanup pass across all `figma/app/pages/*.tsx` before i18n freeze.