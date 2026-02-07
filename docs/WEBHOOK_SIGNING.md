# Webhook Signing (HMAC)

All commerce callbacks should include an HMAC signature to verify authenticity.

## 1) Header
`X-Vouchr-Signature: t=<unix>, v1=<hex-hmac>`

## 2) Signing Payload
```
payload = t + "." + raw_body
hmac = HMAC_SHA256(secret, payload)
```

## 3) Example (Node)
```js
import crypto from 'crypto';

export function signPayload(rawBody, secret, timestamp) {
  const payload = `${timestamp}.${rawBody}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(rawBody, secret, header) {
  const parts = Object.fromEntries(
    header.split(',').map((p) => p.trim().split('='))
  );
  const expected = signPayload(rawBody, secret, parts.t);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
```

## 4) Example (Python)
```py
import hmac, hashlib

def sign_payload(raw_body, secret, timestamp):
    payload = f"{timestamp}.{raw_body}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
```

