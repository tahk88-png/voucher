# Monitoring & Observability

## Metrics to Monitor

### Application Metrics

- **Response Times**
  - API endpoint response times
  - Page load times
  - Database query times

- **Error Rates**
  - 4xx errors (client errors)
  - 5xx errors (server errors)
  - Error rate by endpoint

- **Throughput**
  - Requests per second
  - API calls per minute
  - Database queries per second

### Business Metrics

- **Voucher Operations**
  - Vouchers created per day
  - Vouchers published per day
  - Redemptions per day
  - Redemption success rate

- **User Activity**
  - Active users per day
  - New users per day
  - Referrals created per day

- **Financial**
  - Revenue per day
  - Outstanding liability
  - Credit issued per day

### Infrastructure Metrics

- **Database**
  - Connection pool usage
  - Query performance
  - Database size
  - Replication lag (if applicable)

- **Server**
  - CPU usage
  - Memory usage
  - Disk usage
  - Network traffic

## Monitoring Tools

### Error Tracking

- **Sentry** (recommended)
  - Error tracking
  - Performance monitoring
  - Release tracking

### Application Performance

- **Vercel Analytics** (if using Vercel)
- **Sentry Performance**
- **New Relic** (alternative)

### Uptime Monitoring

- **UptimeRobot**
- **Pingdom**
- **StatusCake**

### Log Aggregation

- **Vercel Logs** (if using Vercel)
- **Datadog**
- **LogRocket**

## Implementation

### Sentry Setup

1. Install:

   ```bash
   npm install @sentry/nextjs
   ```

2. Initialize in `sentry.client.config.ts` and `sentry.server.config.ts`

3. Set environment variables:

   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
   SENTRY_ORG=your_org
   SENTRY_PROJECT=your_project
   SENTRY_AUTH_TOKEN=your_token
   ```

### Custom Metrics

Track custom business metrics:

```typescript
import { captureMessage } from '@/lib/error-tracking';

// Track voucher creation
captureMessage('voucher.created', 'info', {
  merchantId: merchant.id,
  voucherType: voucher.type,
});
```

## Alerts

### Critical Alerts

- **Application Down**: 5xx error rate > 5%
- **Database Down**: Connection failures
- **High Error Rate**: Error rate > 1%
- **Slow Response**: P95 > 2 seconds

### Warning Alerts

- **High Latency**: P95 > 1 second
- **Low Throughput**: Requests < expected
- **Disk Space**: > 80% full
- **Memory Usage**: > 80%

## Dashboards

### Operations Dashboard

- Real-time error rate
- Response time percentiles
- Request rate
- Active users

### Business Dashboard

- Vouchers created today
- Redemptions today
- Revenue today
- Active merchants

## Logging

### Structured Logging

```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'Voucher created',
  merchantId: merchant.id,
  voucherId: voucher.id,
  timestamp: new Date().toISOString(),
}));
```

### Log Levels

- **ERROR**: Application errors
- **WARN**: Warning conditions
- **INFO**: Informational messages
- **DEBUG**: Debug information (dev only)

## Health Checks

### API Health Endpoint

Create `/api/health`:

```typescript
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    stripe: await checkStripe(),
  };

  const healthy = Object.values(checks).every(c => c === true);

  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
  }, { status: healthy ? 200 : 503 });
}
```

## Best Practices

1. **Monitor Everything**
   - Application metrics
   - Business metrics
   - Infrastructure metrics

2. **Set Appropriate Alerts**
   - Not too sensitive (alert fatigue)
   - Not too lenient (miss issues)

3. **Regular Reviews**
   - Review dashboards weekly
   - Adjust alerts based on patterns
   - Document incidents

4. **Performance Baselines**
   - Establish baselines
   - Track trends
   - Set goals
