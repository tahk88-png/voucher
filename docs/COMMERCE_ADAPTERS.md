# Commerce Adapters (Sample Handlers)

This file shows minimal handler logic for common platforms. Each handler should:
1) Validate HMAC signature.
2) Normalize payload into the universal schema.
3) Call `/api/commerce/redemption/confirm`.

## Shopify (orders/paid webhook)
```js
export async function shopifyOrderPaidHandler(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-vouchr-signature');
  verifySignature(rawBody, process.env.SHOPIFY_WEBHOOK_SECRET, signature);

  const order = JSON.parse(rawBody);
  const payload = {
    voucherId: order.discount_codes?.[0]?.code ? await resolveVoucherId(order.discount_codes[0].code) : null,
    referralId: order.note_attributes?.find(a => a.name === 'ref')?.value || null,
    orderReference: String(order.id),
    amountBeforeDiscount: Math.round(order.total_line_items_price * 100),
    discountApplied: Math.round(order.total_discounts * 100),
    currency: order.currency,
    customerEmail: order.email,
    metadata: {
      platform: 'shopify',
      shopId: order.app_id || 'unknown',
      orderId: String(order.id),
      customerId: order.customer?.id ? String(order.customer.id) : null,
      refSource: 'share',
      refParam: order.note_attributes?.find(a => a.name === 'ref')?.value || null,
      couponCode: order.discount_codes?.[0]?.code || null
    }
  };

  return fetch(`${process.env.VOUCHR_BASE_URL}/api/commerce/redemption/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

## WooCommerce (order completed webhook)
```js
export async function wooOrderCompletedHandler(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-vouchr-signature');
  verifySignature(rawBody, process.env.WOO_WEBHOOK_SECRET, signature);

  const order = JSON.parse(rawBody);
  const referralMeta = order.meta_data?.find(m => m.key === '_referral_id');
  const coupon = order.coupon_lines?.[0]?.code || null;

  const payload = {
    voucherId: coupon ? await resolveVoucherId(coupon) : null,
    referralId: referralMeta?.value || null,
    orderReference: String(order.id),
    amountBeforeDiscount: Math.round(Number(order.total) * 100 + Number(order.discount_total) * 100),
    discountApplied: Math.round(Number(order.discount_total) * 100),
    currency: order.currency,
    customerEmail: order.billing?.email,
    metadata: {
      platform: 'woocommerce',
      shopId: order.store_id || 'unknown',
      orderId: String(order.id),
      customerId: order.customer_id ? String(order.customer_id) : null,
      refSource: 'share',
      refParam: referralMeta?.value || null,
      couponCode: coupon
    }
  };

  return fetch(`${process.env.VOUCHR_BASE_URL}/api/commerce/redemption/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

## Magento (invoice paid)
```js
export async function magentoInvoicePaidHandler(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-vouchr-signature');
  verifySignature(rawBody, process.env.MAGENTO_WEBHOOK_SECRET, signature);

  const invoice = JSON.parse(rawBody);
  const coupon = invoice.order?.coupon_code || null;
  const referral = invoice.order?.extension_attributes?.referral_id || null;

  const payload = {
    voucherId: coupon ? await resolveVoucherId(coupon) : null,
    referralId: referral || null,
    orderReference: String(invoice.order?.increment_id || invoice.order?.entity_id),
    amountBeforeDiscount: Math.round(Number(invoice.order?.subtotal) * 100),
    discountApplied: Math.round(Math.abs(Number(invoice.order?.discount_amount || 0)) * 100),
    currency: invoice.order?.order_currency_code,
    customerEmail: invoice.order?.customer_email,
    metadata: {
      platform: 'magento',
      shopId: invoice.order?.store_id ? String(invoice.order.store_id) : 'unknown',
      orderId: String(invoice.order?.entity_id),
      customerId: invoice.order?.customer_id ? String(invoice.order.customer_id) : null,
      refSource: 'share',
      refParam: referral || null,
      couponCode: coupon
    }
  };

  return fetch(`${process.env.VOUCHR_BASE_URL}/api/commerce/redemption/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

## Custom Store (checkout + paid)
```js
export async function customCheckoutValidate(req) {
  const body = await req.json();
  return fetch(`${process.env.VOUCHR_BASE_URL}/api/commerce/discount/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function customPaidHandler(order) {
  return fetch(`${process.env.VOUCHR_BASE_URL}/api/commerce/redemption/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
}
```
