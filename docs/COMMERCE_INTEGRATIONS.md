# Commerce Integrations (All Platforms)

This document defines a platform-agnostic integration for discount validation and redemption confirmation across Shopify, WooCommerce, Magento, and custom stores.

## 1) Core Concepts
- **Voucher**: A discount or credit offer with a code or prefix.
- **Referral**: A shared link that ties a friend purchase to a referrer.
- **Redemption**: An order confirmation that unlocks credit.

## 2) Universal API Endpoints

### Validate Discount
`POST /api/commerce/discount/validate`

Request:
```json
{
  "code": "CH-ABCD",
  "orderTotal": 5000,
  "currency": "USD",
  "customerEmail": "buyer@example.com",
  "referralId": "ref_123",
  "metadata": {
    "platform": "shopify",
    "shopId": "coffee-house",
    "orderId": "1001",
    "customerId": "c_001",
    "refSource": "share",
    "refParam": "ref_123",
    "couponCode": "CH-ABCD"
  }
}
```

Response:
```json
{
  "valid": true,
  "discountAmount": 750,
  "voucherId": "vou_123",
  "referralId": "ref_123"
}
```

### Confirm Redemption (Paid Order)
`POST /api/commerce/redemption/confirm`

Request:
```json
{
  "voucherId": "vou_123",
  "referralId": "ref_123",
  "orderReference": "ORDER-1001",
  "amountBeforeDiscount": 5000,
  "discountApplied": 750,
  "currency": "USD",
  "customerEmail": "buyer@example.com",
  "metadata": {
    "platform": "shopify",
    "shopId": "coffee-house",
    "orderId": "1001",
    "customerId": "c_001"
  }
}
```

Response:
```json
{
  "ok": true,
  "creditUnlocked": true,
  "redemptionId": "red_456"
}
```

### Revoke Redemption (Refund / Cancel)
`POST /api/commerce/redemption/revoke`

Request:
```json
{
  "orderReference": "ORDER-1001",
  "reason": "refund"
}
```

Response:
```json
{ "ok": true }
```

### Generate Codes (Optional)
`POST /api/commerce/codes/generate`

Request:
```json
{ "campaignId": "camp_123", "count": 100, "prefix": "CH" }
```

Response:
```json
{ "codes": ["CH-AAAA", "CH-BBBB"] }
```

## 3) Metadata Schema
```json
{
  "platform": "shopify | woocommerce | magento | custom",
  "shopId": "merchant-slug-or-id",
  "orderId": "platform-order-id",
  "customerId": "platform-customer-id",
  "refSource": "email | qr | share",
  "refParam": "referral-id-or-code",
  "couponCode": "applied-discount-code"
}
```

## 4) Platform Adapters

### Shopify
- **Coupon**: Create price rules + discount codes via Admin API.
- **Webhook**: `orders/paid` or `orders/fulfilled` -> `redemption/confirm`.
- **Referral**: Store `ref` param as order attribute or metafield.

### WooCommerce
- **Coupon**: WC REST API.
- **Webhook**: order completed -> `redemption/confirm`.
- **Referral**: Order meta `_referral_id`.

### Magento
- **Coupon**: Cart rules + coupon codes via REST.
- **Webhook**: invoice/payment success -> `redemption/confirm`.
- **Referral**: Order custom attribute.

### Custom Store
- **Checkout**: Validate coupon via `discount/validate`.
- **Payment**: On success -> `redemption/confirm`.
- **Referral**: Persist `ref` param in checkout session.

## 5) Security
- **HMAC signature** for all webhook calls.
- **Idempotency** using `orderReference` as unique key.
- **Rate limits** on `discount/validate`.

Environment variable:
- `COMMERCE_WEBHOOK_SECRET` - shared secret used to verify `X-Vouchr-Signature`.

## 6) Discount Rules (Universal)
- `percentage`: `orderTotal * percent`
- `fixed_amount`: `min(fixed, orderTotal)`
- `credit_amount`: no checkout discount; credit is granted post-purchase

## 7) Minimal Merchant Setup
- Webhook URL + secret
- Base shop URL
- Coupon sync mode (auto or manual)
- Referral param name (default: `ref`)
