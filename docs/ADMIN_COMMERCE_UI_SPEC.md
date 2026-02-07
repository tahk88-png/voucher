# Admin UI Spec: Commerce Integrations

## Goal
Let a merchant connect their e-commerce platform, configure webhook security, and validate the integration end-to-end.

## Screen Layout

### A) Integrations Overview
- Card grid for Shopify, WooCommerce, Magento, Custom.
- Each card shows: status (Connected/Not connected), last webhook time, and a "Manage" CTA.

### B) Integration Detail (per platform)
**Sections:**
1. **Connection**
   - Platform selector (readonly after setup).
   - Shop URL / Store ID.
   - Connect button (OAuth or API key).
2. **Webhook Settings**
   - Webhook URL (copy button).
   - Signing secret (masked, reveal + rotate).
   - Last webhook status (success/error + timestamp).
3. **Referral Param**
   - Referral param name (default: `ref`).
   - "Include on order meta" toggle (if platform supports).
4. **Coupon Sync**
   - Mode: Manual / Auto.
   - If Auto: "Sync now" button and last sync timestamp.
5. **Test Tools**
   - "Send test webhook" (simulated payload).
   - "Validate sample coupon" (calls `/discount/validate`).
6. **Logs**
   - Table: timestamp, event, status, message.

## UI Components
- Card, Button, Input, Select, Badge, Table, Toast.
- Status badge colors: Success (green), Warning (amber), Error (red).

## Primary CTA
- "Connect store" or "Save changes".

## States
- Loading (skeleton).
- Empty (no integrations).
- Error (webhook verification failed).
- Success (connected, test OK).

## Copy/Labels
- "Connect your store to sync discount codes and confirm redemptions."
- "Webhook URL: paste into your platform's webhook settings."
- "Signing secret: used to verify webhook authenticity."

