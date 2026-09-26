# Voucher Platform UI Skeleton - Implementation Summary

## Overview

Production-ready MVP UI skeleton for a Voucher Platform with three main flows:

1. **Landing Page** - Marketing/public page
2. **User Mobile App** - Wallet, vouchers, sharing
3. **Merchant Dashboard** - Campaign management, analytics, brand settings

## File Structure

```text
app/
├── (landing)/
│   ├── layout.tsx          # Landing page layout with nav + footer
│   └── page.tsx             # Landing page (Hero, How it works, Benefits, CTA)
├── (user)/
│   └── app/
│       ├── layout.tsx       # User app layout with BottomNav
│       ├── page.tsx         # Wallet (Active/Used/Expired tabs)
│       ├── voucher/
│       │   └── [id]/
│       │       └── page.tsx  # Voucher detail + terms
│       ├── redeem/
│       │   └── [id]/
│       │       └── page.tsx  # Fullscreen QR code panel
│       ├── share/
│       │   └── page.tsx      # Share & earn (invite link, recent shares)
│       └── profile/
│           └── page.tsx      # User profile settings
└── (merchant)/
    └── merchant/
        ├── layout.tsx        # Merchant layout with sidebar
        ├── page.tsx          # Overview dashboard (stats + campaigns)
        ├── vouchers/
        │   ├── page.tsx      # Campaigns list
        │   └── new/
        │       └── page.tsx  # Create voucher (form + live preview)
        ├── credits/
        │   └── page.tsx      # Credits balance + payout history
        └── brand/
            └── page.tsx      # Brand settings (logo, color, preview)

components/
├── ui/
│   ├── voucher-card.tsx     # Voucher card component (updated)
│   ├── tabs.tsx             # Tabs component (new)
│   ├── sheet.tsx            # Sheet component (new)
│   ├── dialog.tsx           # Dialog component (new)
│   ├── separator.tsx        # Separator component (new)
│   └── dropdown-menu.tsx   # Dropdown menu component (new)
├── qr-code-panel.tsx        # QR code display (new)
├── bottom-nav.tsx           # Mobile bottom navigation (new)
├── merchant-sidebar.tsx     # Merchant dashboard sidebar (new)
├── stat-card.tsx            # Stats display card (new)
└── page-header.tsx          # Page header component (new)

lib/
└── mock.ts                  # Mock data (vouchers, stats, campaigns, payouts)
```

## Design System

### Colors (Updated in `app/globals.css`)

- **Primary**: `#0F172A` (slate/dark)
- **Accent**: `#22C55E` (reward green)
- **Surface**: White
- **Muted Background**: `#F1F5F9`
- **Error**: `#EF4444` (red)

### Border Radius (Updated)

- **Card**: `16px` (via `--radius`)
- **Button**: `12px` (via `--radius-button`)

### Spacing Scale

- 4px, 8px, 12px, 16px, 24px, 32px

## Core Components

### 1. VoucherCard

- **Props**: `merchantName`, `merchantLogoUrl`, `title`, `description`, `expiryDate`, `status` (active|redeemed|expired), `code`, `accentColor`, `onPrimaryAction`
- **States**: Active shows "Redeem", Redeemed shows "Used", Expired shows "Expired"
- **Location**: `components/ui/voucher-card.tsx`

### 2. QRCodePanel

- Fullscreen QR code display with show/hide code toggle
- Placeholder QR rendering (deterministic pattern)
- **Location**: `components/qr-code-panel.tsx`

### 3. BottomNav

- Mobile bottom navigation for user app
- Links: Wallet, Share, Profile
- **Location**: `components/bottom-nav.tsx`

### 4. MerchantSidebar

- Desktop sidebar + mobile sheet for merchant dashboard
- Navigation: Overview, Vouchers, Credits, Brand
- **Location**: `components/merchant-sidebar.tsx`

### 5. StatCard

- Reusable stat display with icon, value, description
- **Location**: `components/stat-card.tsx`

### 6. PageHeader

- Shared page header with title, description, optional action
- **Location**: `components/page-header.tsx`

## Mock Data

Located in `lib/mock.ts`:

- `mockVouchers[]` - Sample vouchers with different statuses
- `mockMerchantStats` - Dashboard statistics
- `mockCampaigns` - Campaign list data
- `mockPayoutHistory` - Payout records
- `mockShares` - Recent share activity

## Routes

### Public

- `/` - Landing page (Hero, How it works, Benefits, CTA)

### User Mobile App

- `/app` - Wallet (tabs: Active/Used/Expired)
- `/app/voucher/[id]` - Voucher detail + terms
- `/app/redeem/[id]` - Fullscreen QR code redemption
- `/app/share` - Share & earn (invite link, recent shares)
- `/app/profile` - User profile settings

### Merchant Dashboard

- `/merchant` - Overview (stats + active campaigns)
- `/merchant/vouchers` - Campaigns list
- `/merchant/vouchers/new` - Create voucher (form + live preview)
- `/merchant/credits` - Credits balance + payout history
- `/merchant/brand` - Brand settings (logo upload, color picker, preview)

## Implementation Notes

### Route Groups

- `(landing)`, `(user)`, `(merchant)` are route groups that organize code without affecting URLs
- Each has its own layout for consistent structure

### Responsive Design

- Mobile-first approach
- Desktop breakpoints: `md:` (768px+), `lg:` (1024px+)
- Merchant sidebar: Desktop fixed sidebar, mobile sheet

### No Backend Integration

- All data comes from `lib/mock.ts`
- No API calls or database queries
- Forms are UI-only (no submission handlers)

### Accessibility

- Basic ARIA labels where needed
- Semantic HTML
- Keyboard navigation support via shadcn/ui components

## Running the Application

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Access pages**:

   - Landing: <http://localhost:3000>
   - User App: <http://localhost:3000/app>
   - Merchant Dashboard: <http://localhost:3000/merchant>

## Testing Checklist

### Landing Page

- [ ] Hero section displays correctly
- [ ] "How it works" section shows 3 steps
- [ ] Benefits sections render
- [ ] CTAs link to correct pages
- [ ] Footer displays

### User Mobile App Checklist

- [ ] Wallet page shows tabs (Active/Used/Expired)
- [ ] Voucher cards display correctly
- [ ] Voucher detail page shows full info + terms
- [ ] Redeem page shows QR code panel
- [ ] Share page shows invite link + copy functionality
- [ ] Bottom navigation works on all pages
- [ ] Profile page displays

### Merchant Dashboard Checklist

- [ ] Overview shows stat cards
- [ ] Active campaigns list displays
- [ ] Vouchers list page works
- [ ] Create voucher form + preview updates live
- [ ] Credits page shows balance + history
- [ ] Brand settings page with logo upload + color picker
- [ ] Sidebar navigation works (desktop + mobile)

## Next Steps (Not Implemented)

- Backend API integration
- Authentication flows
- Real QR code generation
- Form submission handlers
- Database integration
- Real-time updates
- Image upload functionality (currently UI-only)

## Files Changed/Created

### New Files

- All route group layouts and pages
- All new UI components
- Mock data file
- Updated design tokens

### Modified Files

- `app/globals.css` - Updated design tokens
- `tailwind.config.ts` - Added spacing scale, button radius
- `components/ui/button.tsx` - Updated border radius
- `components/ui/card.tsx` - Updated border radius
- `components/ui/voucher-card.tsx` - Updated to match spec

## Known Issues

1. **Route Conflict**: `app/page.tsx` exists and conflicts with `app/(landing)/page.tsx`. The route group version should take precedence, but you may want to remove or rename the existing `app/page.tsx`.

2. **Toast Notifications**: Uses existing `showSuccess` from `lib/toast-helpers.ts`. Ensure toast provider is in root layout.

3. **Image Upload**: Brand settings logo upload is UI-only (FileReader for preview). No actual upload handler.

4. **QR Code**: Placeholder pattern, not real QR code generation.
