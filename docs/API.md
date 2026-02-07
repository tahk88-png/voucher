# API Documentation

## Authentication

Most endpoints require authentication via NextAuth session cookie. Include the session cookie in requests.

## Endpoints

### B2B Organizations

All B2B endpoints require session auth (NextAuth cookie). Org scoping is enforced via `orgId` in the route.

#### List Orgs

```http
GET /api/orgs
```

**Response**: `{ orgs: [{ id, name, type, status, role }] }`

#### List Members

```http
GET /api/orgs/{orgId}/members
```

**Auth**: Org member

#### Invite Member (existing user)

```http
POST /api/orgs/{orgId}/members
```

**Auth**: Org owner/admin

**Body**:
```json
{ "email": "user@example.com", "role": "admin" }
```

#### Update Member Role

```http
PATCH /api/orgs/{orgId}/members/{memberId}
```

**Auth**: Org owner/admin

**Body**:
```json
{ "role": "finance" }
```

### B2B Campaigns

#### List Campaigns

```http
GET /api/orgs/{orgId}/campaigns
```

#### Create Campaign

```http
POST /api/orgs/{orgId}/campaigns
```

#### Get Campaign

```http
GET /api/orgs/{orgId}/campaigns/{campaignId}
```

#### Update Campaign

```http
PATCH /api/orgs/{orgId}/campaigns/{campaignId}
```

#### Activate/Pause/Archive

```http
POST /api/orgs/{orgId}/campaigns/{campaignId}/activate
POST /api/orgs/{orgId}/campaigns/{campaignId}/pause
POST /api/orgs/{orgId}/campaigns/{campaignId}/archive
```

### B2B Vouchers

#### Bulk Issue Vouchers

```http
POST /api/orgs/{orgId}/campaigns/{campaignId}/vouchers/bulk-create
```

#### List Vouchers

```http
GET /api/orgs/{orgId}/vouchers
```

#### Get Voucher

```http
GET /api/orgs/{orgId}/vouchers/{voucherId}
```

#### Activate / Void

```http
POST /api/orgs/{orgId}/vouchers/{voucherId}/activate
POST /api/orgs/{orgId}/vouchers/{voucherId}/void
```

### B2B Orders & Invoices

```http
GET /api/orgs/{orgId}/orders
POST /api/orgs/{orgId}/orders
GET /api/orgs/{orgId}/orders/{orderId}
POST /api/orgs/{orgId}/orders/{orderId}/submit
POST /api/orgs/{orgId}/orders/{orderId}/generate-invoice
POST /api/orgs/{orgId}/orders/{orderId}/mark-paid
```

### B2B Audit

```http
GET /api/orgs/{orgId}/audit
```

### Partner API (B2B)

All partner API calls require `X-Partner-Key` header.

#### Validate Voucher

```http
POST /api/public/vouchers/validate
```

#### Redeem Voucher (Idempotent)

```http
POST /api/partner/redemptions
```

**Headers**: `Idempotency-Key: <uuid>`

#### Reverse Redemption

```http
POST /api/partner/redemptions/{redemptionId}/reverse
```

### Partner Key Management (B2B)

```http
GET /api/orgs/{orgId}/partner-keys
POST /api/orgs/{orgId}/partner-keys
POST /api/orgs/{orgId}/partner-keys/{keyId}/revoke
```

### Merchant Vouchers

#### Create Voucher

```http
POST /api/merchant/[slug]/vouchers
```

**Auth**: Merchant admin required

**Body**:

```json
{
  "type": "percentage" | "fixed_amount" | "credit_amount",
  "value": 1500,  // basis points for percentage, minor units for money
  "currency": "USD",
  "validFrom": "2024-01-01T00:00:00Z",
  "validTo": "2024-01-31T23:59:59Z",
  "usageLimitTotal": 100,  // optional
  "usageLimitPerUser": 1,  // optional
  "weeklyDropEnabled": false,
  "weeklyDropJson": {  // optional
    "dayOfWeek": 1,
    "startTime": "10:00",
    "stock": 20,
    "durationMinutes": 60
  },
  "designJson": {
    "headline": "15% Off",
    "finePrint": "Valid for new customers",
    "primaryColor": "#000000",
    "secondaryColor": "#666666",
    "backgroundColor": "#ffffff"
  },
  "codePrefix": "CH"  // optional
}
```

**Response**: Voucher object

#### List Vouchers

```http
GET /api/merchant/[slug]/vouchers
```

**Auth**: Optional (public sees only published)

**Response**: Array of voucher objects

#### Get Voucher

```http
GET /api/merchant/[slug]/vouchers/[id]
```

**Auth**: Required for non-published vouchers

**Response**: Voucher object

#### Update Voucher

```http
PUT /api/merchant/[slug]/vouchers/[id]
```

**Auth**: Merchant admin required

**Body**: (all fields optional)

```json
{
  "status": "draft" | "published" | "paused" | "ended",
  "type": "percentage" | "fixed_amount" | "credit_amount",
  "value": 1500,
  "currency": "USD",
  "validFrom": "2024-01-01T00:00:00Z",
  "validTo": "2024-01-31T23:59:59Z",
  "usageLimitTotal": 100,
  "usageLimitPerUser": 1,
  "weeklyDropEnabled": false,
  "weeklyDropJson": {...},
  "designJson": {...},
  "codePrefix": "CH"
}
```

**Response**: Updated voucher object

#### Publish Voucher

```http
POST /api/vouchers/[id]/publish
```

**Auth**: Merchant admin required

**Response**: Published voucher object

### Referrals

#### Create Referral

```http
POST /api/referrals/create
```

**Auth**: Required

**Body**:

```json
{
  "voucherId": "clx...",
  "friendHint": "friend@example.com"  // optional
}
```

**Response**:

```json
{
  "referralId": "clx...",
  "shareUrl": "https://app.com/r/clx..."
}
```

### Redemptions

#### Create Redemption

```http
POST /api/redemptions
```

**Auth**: Optional (for tracking)

**Body**:

```json
{
  "voucherId": "clx...",
  "referralId": "clx...",  // optional
  "method": "online" | "in_store",
  "orderReference": "ORD-001",  // optional
  "amountBeforeDiscount": 5000,  // minor units
  "discountApplied": 750,  // minor units
  "currency": "USD"
}
```

**Response**:

```json
{
  "redemptionId": "clx...",
  "requiresConfirmation": false
}
```

#### Confirm Redemption

```http
POST /api/redemptions/[id]/confirm
```

**Auth**: Merchant staff required

**Response**:

```json
{
  "success": true
}
```

### Credits

#### Get Wallet

```http
GET /api/wallet/[merchantSlug]
```

**Auth**: Required

**Response**:

```json
{
  "available": 5000,  // minor units
  "locked": 1000,
  "total": 6000,
  "currency": "USD",
  "credits": [...]
}
```

#### Apply Credit

```http
POST /api/credits/apply
```

**Auth**: Required

**Body**:

```json
{
  "merchantSlug": "coffee-house",
  "amount": 5000,  // minor units
  "orderReference": "ORD-001"  // optional
}
```

**Response**:

```json
{
  "success": true,
  "creditIds": ["clx..."]
}
```

### Weekly Drop

#### Claim Weekly Drop

```http
POST /api/weekly-drop/claim
```

**Auth**: Required

**Body**:

```json
{
  "voucherId": "clx...",
  "friendHint": "friend@example.com"  // optional
}
```

**Response**:

```json
{
  "referralId": "clx...",
  "shareUrl": "https://app.com/r/clx...",
  "remaining": 19
}
```

### Campaigns

#### Create Campaign

```http
POST /api/merchant/[slug]/campaigns
```

**Auth**: Merchant admin required

**Body**:

```json
{
  "name": "Holiday Special",
  "description": "Limited time promotion",  // optional
  "type": "weekly" | "limited",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "price": 5000,  // minor units, nullable for free vouchers
  "maxRedemptions": 100,  // optional
  "maxPurchases": 50,  // optional
  "terms": "Terms and conditions",  // optional
  "creditPercentage": 500  // basis points (0-10000 = 0-100%), optional
}
```

**Response**: Campaign object

#### List Campaigns

```http
GET /api/merchant/[slug]/campaigns
```

**Auth**: Merchant staff required

**Response**: Array of campaign objects with voucher and purchase counts

#### Get Campaign

```http
GET /api/campaigns/[id]
```

**Auth**: Optional (public campaigns)

**Response**: Campaign object with vouchers and counts

#### Update Campaign

```http
PUT /api/campaigns/[id]
```

**Auth**: Merchant admin required

**Body**: (all fields optional)

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "type": "weekly" | "limited",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "price": 5000,
  "maxRedemptions": 100,
  "maxPurchases": 50,
  "terms": "Updated terms",
  "creditPercentage": 500,
  "status": "draft" | "active" | "ended"
}
```

**Response**: Updated campaign object

#### Generate Vouchers from Campaign

```http
POST /api/campaigns/[id]/generate-vouchers
```

**Auth**: Merchant admin required

**Body**:

```json
{
  "count": 10,  // max 100
  "voucherData": {
    "type": "percentage" | "fixed_amount" | "credit_amount",
    "value": 1500,
    "currency": "USD",
    "validFrom": "2024-01-01T00:00:00Z",
    "validTo": "2024-01-31T23:59:59Z",
    "usageLimitTotal": 100,  // optional
    "usageLimitPerUser": 1,  // optional
    "codePrefix": "CH",  // optional
    "designJson": {...}  // optional
  }
}
```

**Response**:

```json
{
  "vouchers": [...],
  "count": 10
}
```

### Voucher Purchase

#### Purchase Voucher

```http
POST /api/vouchers/[id]/purchase
```

**Auth**: Required

**Body**:

```json
{
  "referrerId": "clx..."  // optional, if purchased via referral link
}
```

**Response**:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Redirects to Stripe checkout. On success, webhook handles voucher delivery and credit earning.

#### Grant Free Voucher

```http
POST /api/vouchers/[id]/grant
```

**Auth**: Merchant staff required

**Body**:

```json
{
  "userId": "clx...",  // optional, defaults to current user
  "email": "user@example.com"  // optional, alternative to userId
}
```

**Response**:

```json
{
  "purchase": {...},
  "message": "Voucher granted successfully"
}
```

### Events

#### Create Event

```http
POST /api/merchant/[slug]/events
```

**Auth**: Merchant admin required

**Body**:

```json
{
  "name": "Summer Festival",
  "description": "Annual summer event",  // optional
  "type": "festival" | "internal" | "concert" | "workshop" | "other",
  "eventDate": "2024-07-15T18:00:00Z",
  "eventEndDate": "2024-07-15T22:00:00Z",  // optional
  "location": "Main Hall",  // optional
  "locationAddress": "123 Main St, City",  // optional
  "maxCapacity": 100,
  "price": 2500,  // minor units
  "currency": "USD",
  "ticketTypesJson": [  // optional
    {
      "name": "VIP",
      "price": 5000,
      "capacity": 20
    }
  ],
  "terms": "Event terms and conditions"  // optional
}
```

**Response**: Event object

#### List Events

```http
GET /api/merchant/[slug]/events
```

**Auth**: Merchant staff required

**Response**: Array of event objects with ticket and purchase counts

#### Get Event

```http
GET /api/events/[id]
```

**Auth**: Optional (public events)

**Response**: Event object with sold/available ticket counts

#### Update Event

```http
PUT /api/events/[id]
```

**Auth**: Merchant admin required

**Body**: (all fields optional)

```json
{
  "name": "Updated Event Name",
  "description": "Updated description",
  "type": "festival" | "internal" | "concert" | "workshop" | "other",
  "eventDate": "2024-07-15T18:00:00Z",
  "eventEndDate": "2024-07-15T22:00:00Z",
  "location": "Updated Location",
  "locationAddress": "Updated Address",
  "maxCapacity": 150,
  "price": 3000,
  "currency": "USD",
  "ticketTypesJson": [...],
  "terms": "Updated terms",
  "status": "draft" | "published" | "sold_out" | "cancelled" | "ended"
}
```

**Response**: Updated event object

#### Publish Event

```http
POST /api/events/[id]/publish
```

**Auth**: Merchant admin required

**Response**: Published event object

#### Generate Tickets for Event

```http
POST /api/events/[id]/generate-tickets
```

**Auth**: Merchant admin required

**Body**:

```json
{
  "count": 50,  // number of tickets to generate
  "ticketType": "VIP"  // optional, if event has ticket types
}
```

**Response**:

```json
{
  "tickets": [...],
  "count": 50
}
```

### Ticket Purchase

#### Purchase Ticket

```http
POST /api/tickets/[id]/purchase
```

**Auth**: Required

**Body**:

```json
{
  "attendeeName": "John Doe",  // optional
  "attendeeEmail": "john@example.com"  // optional
}
```

**Response**:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Redirects to Stripe checkout. On success, webhook handles ticket delivery.

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Status codes:

- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., weekly drop sold out)
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
