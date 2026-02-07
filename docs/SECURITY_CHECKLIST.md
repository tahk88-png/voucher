# Security Audit Checklist

## Headers

- [ ] Content Security Policy (CSP) configured
- [ ] HTTP Strict Transport Security (HSTS) enabled
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured

## Input Validation

- [ ] All API endpoints validate input with Zod
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React escapes by default, but verify)
- [ ] File upload validation (if applicable)
- [ ] URL validation for external links

## Authentication & Authorization

- [ ] RBAC checks on all protected routes
- [ ] Session management secure
- [ ] Password reset tokens expire
- [ ] OAuth redirect URIs validated
- [ ] Magic link tokens expire

## API Security

- [ ] Rate limiting on all public endpoints
- [ ] CORS configured correctly
- [ ] API keys stored in environment variables
- [ ] Webhook signatures verified (Stripe)
- [ ] No sensitive data in error messages

## Data Protection

- [ ] PII hashed (friend identifiers)
- [ ] Credit card data never stored
- [ ] Database credentials in environment variables
- [ ] Audit logs for sensitive operations
- [ ] GDPR compliance (if applicable)

## Dependencies

- [ ] Regular `npm audit` runs
- [ ] Dependencies up to date
- [ ] No known critical vulnerabilities
- [ ] Lock file committed

## Infrastructure

- [ ] HTTPS enforced
- [ ] Database backups encrypted
- [ ] Secrets in secure storage (not in code)
- [ ] Environment variables documented
- [ ] Access logs monitored

## Testing

- [ ] Security tests in CI/CD
- [ ] Penetration testing (if applicable)
- [ ] Dependency scanning automated

## Implementation Notes

### Next.js Security Headers

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### CSP Configuration

For Content Security Policy, configure based on your needs:

```javascript
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.stripe.com;
  `.replace(/\s{2,}/g, ' ').trim()
}
```
