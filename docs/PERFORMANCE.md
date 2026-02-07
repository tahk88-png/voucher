# Performance Optimization Guide

## Database Optimization

### Query Optimization

- [ ] Review slow queries (enable query logging)
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Use database connection pooling

### Indexes

Current indexes in schema:

- Merchant: `isActive`
- Voucher: `merchantId`, `campaignId`, `status`, `validFrom/validTo`
- Referral: `voucherId`, `merchantId`, `referrerUserId`, `friendHash`, `status`
- Redemption: `voucherId`, `merchantId`, `referralId`, `confirmedAt`
- CreditLedger: `merchantId`, `userId`, `status`, `expiresAt`

### Connection Pooling

Configure Prisma connection pool:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
}
```

Or in connection string:

```text
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

## Caching Strategy

### What to Cache

- **Public voucher pages**: Cache for 1 hour
- **Merchant data**: Cache for 5 minutes
- **Campaign data**: Cache for 5 minutes
- **User wallet**: Cache for 30 seconds

### Cache Invalidation

- Invalidate on write operations
- Use cache tags for related data
- Set appropriate TTLs

## Frontend Optimization

### Bundle Size

- [ ] Analyze bundle size: `npm run build -- --analyze`
- [ ] Code splitting for routes
- [ ] Lazy load heavy components
- [ ] Tree shaking unused code

### Image Optimization

- [ ] Use Next.js Image component
- [ ] Optimize brand logos
- [ ] Use appropriate formats (WebP)
- [ ] Lazy load images

### Code Splitting

```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

## API Optimization

### Response Times

- [ ] Target: < 200ms for most endpoints
- [ ] Use database indexes
- [ ] Implement pagination
- [ ] Cache frequently accessed data

### Batch Operations

- [ ] Batch database queries where possible
- [ ] Use `Promise.all()` for parallel operations
- [ ] Avoid sequential awaits

## Monitoring Performance

### Metrics to Track

- API response times (P50, P95, P99)
- Database query times
- Page load times
- Time to First Byte (TTFB)
- Largest Contentful Paint (LCP)

### Tools

- Vercel Analytics
- Sentry Performance
- Chrome DevTools
- Lighthouse

## Best Practices

1. **Measure First**
   - Don't optimize prematurely
   - Profile before optimizing
   - Measure impact

2. **Database First**
   - Optimize queries before caching
   - Add indexes strategically
   - Monitor slow queries

3. **Cache Strategically**
   - Cache expensive operations
   - Invalidate properly
   - Don't over-cache

4. **Monitor Continuously**
   - Track performance metrics
   - Set up alerts
   - Review regularly
