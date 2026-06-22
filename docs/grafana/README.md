# Grafana dashboard — Voucher Platform ops

A ready-to-import dashboard for the metrics exposed by
`/api/admin/ops/metrics/prometheus`. Panels map 1:1 to the metric
families defined in [`lib/metrics.ts`](../../lib/metrics.ts) and
[`lib/ops-gauges.ts`](../../lib/ops-gauges.ts) — if you add a new
metric there, extend the dashboard in the same PR.

## One-time setup

1. **Scrape config** on your Prometheus instance:

   ```yaml
   scrape_configs:
     - job_name: voucher-platform
       metrics_path: /api/admin/ops/metrics/prometheus
       scheme: https
       static_configs:
         - targets: ['your-voucher-host.example.com']
       authorization:
         type: Bearer
         credentials_file: /etc/prometheus/voucher-metrics-token
   ```

   The `credentials_file` holds whatever you set `METRICS_TOKEN` to
   in the app env. If `METRICS_TOKEN` is unset (dev), drop the
   `authorization` block.

2. **Data source** in Grafana: add a Prometheus data source pointing
   at the Prometheus you just configured. Name doesn't matter — the
   import step below picks it up via a template variable.

3. **Import the dashboard**:

   - Grafana → Dashboards → New → Import.
   - Upload `voucher-platform.json`.
   - Pick your Prometheus data source for the `DS_PROMETHEUS` input.
   - Save.

## Panels

| Row | Panel | PromQL | Source metric |
|---|---|---|---|
| System | Uptime | `process_uptime_seconds` | `getMetricsPrometheus()` |
| System | Memory RSS vs heap | `process_memory_{rss,heap_used}_bytes` | `getMetricsPrometheus()` |
| System | HTTP request rate by status | `rate(http_requests_total[5m])` by `status` | `recordHttpRequest()` |
| HTTP | Top paths by rate | `topk(10, ... by path)` | `recordHttpRequest()` — paths normalized via `normalizePath()` |
| HTTP | p50 / p95 / p99 latency | `http_request_duration_ms{quantile=...}` | `recordHttpRequest()` |
| DB + cache | DB query rate by model | `rate(db_queries_total[5m])` by `model` | `recordDbQuery()` |
| DB + cache | Cache hit ratio | `rate(hits) / rate(hits + misses)` by `key` | `recordCacheHit` / `recordCacheMiss` |
| Safety | Rate-limit rejections | `rate(rate_limit_rejections_total[5m])` by `scope,backend` | `recordRateLimitRejection()` — [Phase 5] |
| Safety | Circuit breaker transitions | `rate(circuit_breaker_transitions_total[5m])` by `name,to` | `recordCircuitTransition()` |
| Backlogs | Email queue depth | `voucher_email_queue_depth` by `status` | `collectEmailQueueGauge()` — [Phase 5] |
| Backlogs | Payout backlog | `voucher_payout_backlog_count` by `status` | `collectPayoutBacklogGauge()` — [Phase 5] |

## Alerts worth adding

The dashboard intentionally ships without alert rules — every team
picks different thresholds. Good starting points:

| Condition | PromQL | Why |
|---|---|---|
| Email queue jammed | `voucher_email_queue_depth{status="queued"} > 5000 for 15m` | Cron dispatcher is falling behind; check `/api/cron/email-queue` telemetry. |
| Payout hold stuck | `voucher_payout_backlog_count{status="held"} > 0 for 72h` | A merchant is blocked >3 days; escalate to billing ops. |
| 5xx spike | `sum(rate(http_requests_total{status=~"5.."}[5m])) > 1` | Anything above background noise — the unit is req/s. |
| p95 latency regression | `http_request_duration_ms{quantile="0.95"} > 500 for 10m` | User-observable slowness starts around here. |
| Rate-limit flood | `sum(rate(rate_limit_rejections_total{scope=~"auth_.*"}[5m])) > 10` | Credential-stuffing indicator. |
| Circuit stuck open | `sum(rate(circuit_breaker_transitions_total{to="open"}[5m])) > 0 for 10m` | Provider is down. |

## Keeping this in sync

Rule of thumb: if a PR changes a metric name, label set, or bucket
function in `lib/metrics.ts` or `lib/ops-gauges.ts`, the same PR
updates this JSON. The dashboard is source-controlled on purpose —
reviewers should catch metric renames that silently break the
dashboard.
