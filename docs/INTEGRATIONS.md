# Integration Guides

This document describes how to use the integrated services in Vouchr.

## Stripe

### Setup

1. Add to `.env`:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### Usage

#### Create Checkout Session

```typescript
import { createCheckoutSession } from '@/lib/stripe';

const session = await createCheckoutSession({
  lineItems: [{
    price_data: {
      currency: 'eur',
      product_data: { name: 'Voucher €50' },
      unit_amount: 5000, // €50.00 in cents
    },
    quantity: 1,
  }],
  successUrl: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://yourapp.com/cancel',
  metadata: {
    voucherId: 'voucher-123',
    merchantId: 'merchant-456',
  },
  customerEmail: 'user@example.com',
});

// Redirect to session.url
```

#### API Route Example

```typescript
// POST /api/stripe/checkout
const res = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lineItems: [/* ... */],
    successUrl: '...',
    cancelUrl: '...',
    metadata: { /* ... */ },
  }),
});
const { url } = await res.json();
window.location.href = url;
```

#### Webhook Handler

The webhook handler at `/api/stripe/webhook` automatically processes:

- `checkout.session.completed` — successful payment
- `payment_intent.succeeded` — payment succeeded
- `payment_intent.payment_failed` — payment failed

Add your business logic in `app/api/stripe/webhook/route.ts` based on metadata.

## Resend

### Resend Setup

1. Add to `.env`:

   ```bash
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@yourdomain.com  # Optional
   ```

2. Verify your domain in Resend dashboard

### Resend Usage

```typescript
import { sendEmail } from '@/lib/resend';

await sendEmail({
  to: 'user@example.com',
  subject: 'Your voucher is ready',
  html: '<h1>Thank you!</h1><p>Your voucher code is: ABC123</p>',
  text: 'Thank you! Your voucher code is: ABC123',
  tags: [{ name: 'category', value: 'voucher' }],
});
```

### Check Configuration

```typescript
import { isResendConfigured } from '@/lib/resend';

if (isResendConfigured()) {
  await sendEmail({ /* ... */ });
} else {
  console.warn('Resend not configured, skipping email');
}
```

## PDF Export

### PDF Usage

```typescript
import { createVoucherPDF, generatePDFBuffer } from '@/lib/pdf';

// Create PDF document
const doc = createVoucherPDF({
  merchantName: 'Coffee House',
  voucherCode: 'ABC123',
  value: '€50.00',
  validUntil: '2024-12-31',
});

// Generate buffer for download or storage
const buffer = await generatePDFBuffer(doc);

// Return as download in API route
return new Response(buffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="voucher.pdf"',
  },
});
```

### PDF API Route Example

```typescript
// app/api/vouchers/[id]/pdf/route.ts
import { createVoucherPDF, generatePDFBuffer } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const voucher = await prisma.voucher.findUnique({
    where: { id: params.id },
    include: { merchant: true },
  });

  if (!voucher) {
    return new Response('Not found', { status: 404 });
  }

  const doc = createVoucherPDF({
    merchantName: voucher.merchant.name,
    voucherCode: voucher.code,
    value: `${voucher.currency} ${voucher.discountAmount}`,
    validUntil: voucher.validTo.toISOString().split('T')[0],
  });

  const buffer = await generatePDFBuffer(doc);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="voucher-${voucher.code}.pdf"`,
    },
  });
}
```

## Development vs Production

### Development

- Stripe and Resend can be omitted from `.env`
- Errors will be thrown with clear messages when services are used
- App will start without these services configured

### Production

- All required environment variables must be set
- Test webhooks using Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verify email delivery in Resend dashboard
