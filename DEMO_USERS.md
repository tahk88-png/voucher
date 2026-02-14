# Demo Users Reference

All demo users are fully seeded with complete profiles, proper RBAC assignments, and functional data.

## 🔑 Login Credentials

### Platform Admin

- **Email:** `platform-admin@gifthub.local`
- **Password:** `platform123`
- **Role:** Platform Owner
- **Access:** Admin dashboard (`/admin`), all merchant data, global settings
- **Org Membership:** GiftHub Platform (Owner)
- **Capabilities:**
  - View all merchants and their data
  - Manage platform-wide settings
  - Access audit logs
  - Monitor platform health

### Merchant Admin (Coffee House)

- **Email:** `admin@coffee-house.com`
- **Password:** `admin123`
- **Role:** Merchant Admin
- **Merchant:** Coffee House
- **Access:** Merchant dashboard (`/merchant/coffee-house`)
- **Merchant Membership:** Coffee House (merchant_admin)
- **Org Membership:** GiftHub Platform (Admin)
- **Capabilities:**
  - Create and manage campaigns
  - Create and publish vouchers
  - Manage merchandise (products)
  - Configure rentals
  - View merchant statistics
  - Manage team members (staff)
  - Access merchant billing & settings
  - Full merchant operational control

### Merchant Staff (Coffee House)

- **Email:** `staff@coffee-house.com`
- **Password:** `staff123`
- **Role:** Merchant Staff
- **Merchant:** Coffee House
- **Access:** Merchant dashboard (`/merchant/coffee-house`)
- **Merchant Membership:** Coffee House (merchant_staff)
- **Org Membership:** GiftHub Platform (Support)
- **Capabilities:**
  - View campaigns and vouchers
  - Redeem vouchers for customers
  - Confirm redemptions
  - View merchant statistics (read-only)
  - Process in-store transactions
  - Cannot modify campaigns or billing

### Tech Admin (Tech Store)

- **Email:** `admin@tech-store.com`
- **Password:** `techadmin123`
- **Role:** Merchant Admin
- **Merchant:** Tech Store
- **Access:** Merchant dashboard (`/merchant/tech-store`)
- **Merchant Membership:** Tech Store (merchant_admin)
- **Org Membership:** GiftHub Platform (Admin)
- **Capabilities:**
  - Same as Merchant Admin but for Tech Store
  - Manage Tech Store campaigns, vouchers, products, rentals
  - Full merchant operational control for Tech Store

### End User (Customer)

- **Email:** `test@example.com`
- **Password:** `test123`
- **Role:** Regular User
- **Access:** User hub (`/app`), wallet, referrals
- **Wallet:**
  - $50.00 USD credit at Coffee House (expires in 1 year)
  - £30.00 GBP credit at Tech Store (expires in 1 year)
- **Sample Data:**
  - Owns referral for voucher campaign
  - Has redeemed 1 voucher
  - Has purchased vouchers
  - Can view referral history
- **Capabilities:**
  - View and redeem vouchers
  - Check wallet balance and credits
  - Manage referrals
  - View redemption history
  - Update profile settings
  - Share referral links

### Secondary User (Regular User)

- **Email:** `user@example.com`
- **Password:** `user123`
- **Role:** Regular User
- **Access:** User hub (`/app`), wallet, referrals
- **Wallet:**
  - $25.00 USD credit at Coffee House (expires in 1 year)
- **Sample Data:**
  - Has purchased premium vouchers
  - Sample transaction history
- **Capabilities:**
  - Same as End User

## 🛍️ Test Merchants

### Coffee House ☕

- **Slug:** `coffee-house`
- **Country:** United States
- **Currency:** USD
- **Campaigns:**
  - Holiday Special (15% off) - Active, Free
  - Weekly Monday Drop ($5 off, weekly) - Active, $5.00 payment
- **Vouchers:** 2 (percentage discount + fixed amount)
- **Products:** House Blend, Gift Pack
- **Rentals:** Espresso Machine (daily/weekly rates)
- **Domain:** `coffee-house.local`
- **Staff:** `admin@coffee-house.com`, `staff@coffee-house.com`

### Tech Store 💻

- **Slug:** `tech-store`
- **Country:** United Kingdom
- **Currency:** GBP
- **Campaigns:** (Can be created via dashboard)
- **Vouchers:** 1 (Store Credit)
- **Products:** Wireless Headphones, Smart Home Kit
- **Rentals:** Projector Kit (daily/weekly rates)
- **Domain:** `tech-store.local`
- **Admin:** `admin@tech-store.com`

## ✅ Sample Data Included

### User Wallets

- End User has earned credits through referrals
- Secondary User has purchased vouchers
- Both users have sample transaction history

### Campaigns & Vouchers

- Coffee House has 2 active campaigns
- Tech Store has 1 active voucher (GBP £10 credit)
- All vouchers are published and ready to test

### Redemptions

- Sample redemption in Coffee House system
- Shows complete redemption workflow (online method)

### Referrals

- Sample referral data for testing referral features
- End user has referral history

## 🚀 Quick Start Testing

### Test Login Flow

```bash
# Visit login page
http://localhost:3000/login

# Use any of the above credentials
```

### Test Each Role

1. **Platform Admin:** Login with platform admin → Visit `/admin`
2. **Merchant Admin:** Login with Coffee House admin → Visit `/merchant/coffee-house`
3. **Merchant Staff:** Login with staff → Visit `/merchant/coffee-house`
4. **End User:** Login with `test@example.com` → Visit `/app`

### Test Merchant Stores (if configured)

- Coffee House: [`http://coffee-house.local:3000`](http://coffee-house.local:3000) (local domain)
- Tech Store: [`http://tech-store.local:3000`](http://tech-store.local:3000) (local domain)

## 🔧 Database Details

All users have:

- ✅ Valid password hashes
- ✅ Email verified status
- ✅ Active status
- ✅ Proper RBAC assignments
- ✅ Organization memberships
- ✅ Sample transaction history
- ✅ Wallet credits (for end users)

## 📝 Notes

- All demo users are set up for immediate use without additional configuration
- Passwords match the environment variables in `.env`
- Test credentials can be disabled by setting `ENABLE_TEST_CREDENTIALS=false`
- All sample data uses realistic test values
- Vouchers and campaigns are set to expire properly (30-90 days from seeding)
