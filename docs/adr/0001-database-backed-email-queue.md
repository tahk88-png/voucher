# ADR-0001: Database-backed email queue instead of BullMQ / Redis queue

- **Status**: Accepted
- **Date**: 2026-03
- **Deciders**: platform engineering
- **Related**: `lib/email/service.ts`, `app/api/cron/email-queue/route.ts`, Vercel cron `*/2 * * * *`

## Context

Transactional email on this platform (OTP magic links, receipts,
referral invites, weekly digests, voucher-expiry reminders) runs into
thousands of sends per day across 10+ categories. We need retries,
rate-limited per-provider dispatch, per-recipient suppression on
bounces, and visibility into stuck jobs — but we're deployed on
Vercel with no long-running worker process and a small ops team.

Constraints that shaped the decision:
- **Runtime**: Vercel serverless functions. No persistent process to
  host a Redis-backed worker.
- **Existing infra**: Postgres is already our primary store, Prisma
  is our only DB toolkit, and we already operate several cron jobs.
- **Team size**: one-to-two engineers on-call. Every extra moving
  piece (a Redis cluster, a BullMQ dashboard, a separate deployment)
  is overhead that compounds during incidents.
- **Scale envelope**: current peak ~5k emails/day, projected ~50k/day
  inside two years. Well below the regime where a dedicated queue
  stops being optional.

## Decision

Store every outbound email as an `EmailJob` row in Postgres with
`status`, `priority`, `scheduledAt`, `lockedAt`, `lockedBy`,
`attempts`, `nextRetryAt`. A Vercel cron `/api/cron/email-queue` runs
every 2 minutes, leases a small batch with `SELECT … FOR UPDATE SKIP
LOCKED`, dispatches through the provider abstraction, and writes
status back. Stuck locks are swept every 10 minutes by a separate
cron.

## Alternatives considered

- **Option A — Postgres job table (chosen)**: zero new infra;
  Prisma's `findMany` + `update` is enough; transactional delete of
  the lock on completion; integration tests use the real code path.
- **Option B — BullMQ on Redis**: industry-standard queue with
  retry/backoff/delayed jobs out of the box, but requires a
  persistent worker (not Vercel-native), adds a Redis SPoF distinct
  from our cache Redis, and doubles the "what's broken when nothing
  sends" surface.
- **Option C — Vendor queue (SQS, Pub/Sub, Resend's own batching)**:
  ties delivery observability to a provider dashboard and a separate
  IAM surface; Resend's batch API in particular doesn't offer the
  retry semantics we need.

## Consequences

- ✅ Single source of truth: every email is a queryable row; ops can
  re-drive, cancel, or inspect by SQL.
- ✅ Backups of Postgres implicitly cover the queue — no separate
  backup plan for Redis.
- ✅ Suppression, templates, and provider selection live in the same
  schema as the job, so the full pipeline can be reasoned about
  without crossing systems.
- ⚠️ Postgres is not a queue — at very high rates (tens of thousands
  per minute) `FOR UPDATE SKIP LOCKED` starts to starve and we'd see
  lock contention. Revisit at the scale threshold below.
- ⚠️ Cron-driven dispatch adds up to 2 minutes of latency on
  non-instant categories. Time-critical sends (OTP) call
  `sendEmailDirect()` to bypass the queue.
- 🔄 **Revisit if**: EmailJob table grows past ~500k unsent rows at
  any moment, or if p95 dispatch lag exceeds 5 minutes during a
  normal day.

## Implementation notes

- `lib/email/service.ts` — `queueEmail()` entry point, suppression check.
- `lib/email/providers/factory.ts` — provider selection + failover.
- `prisma/schema.prisma` — `EmailJob` model, indexes.
- `app/api/cron/email-queue/route.ts` — dispatch loop.
- `app/api/cron/email-stale-locks/route.ts` — lock sweeper.
