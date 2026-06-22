# ADR-0002: Resend as primary email provider with SES + SMTP fallback

- **Status**: Accepted
- **Date**: 2026-03
- **Deciders**: platform engineering
- **Related**: ADR-0001, `lib/email/providers/`, `RESEND_WEBHOOK_SECRET`

## Context

We need transactional email delivery across the EU (DE/FR/ES/FI/SE/EE/UA)
with good deliverability, a programmable bounce/complaint webhook,
React-based template rendering, and the option to route by category
or sender domain. We also care about not being wedged to a single
vendor if they raise prices or suffer an outage during a campaign
send.

Constraints:
- **React Email** templates already exist in the codebase.
- **Deliverability in DE/FR** is tricky — vendor reputation matters.
- **GDPR**: we prefer EU data residency or at minimum EU processing
  addendum.
- **Price sensitivity**: a single-vendor lock-in scares us because
  email is in the critical path of every signup, password reset, and
  receipt.

## Decision

Use **Resend** as the primary provider. Maintain an `EmailProviderConfig`
table and a provider-factory abstraction that can transparently fail
over to **AWS SES** and then to **generic SMTP** (configured via
`SMTP_*` envs). The provider chain is evaluated per send — a 5xx from
Resend trips the factory to the next provider on that one message.
Circuit-breaker logic downgrades the primary for a cool-off window
after N consecutive failures.

## Alternatives considered

- **Option A — Resend primary + SES + SMTP (chosen)**: excellent
  React Email integration, webhook schema is clean, SES is the
  proven-at-scale backstop, SMTP is the universal escape hatch.
- **Option B — SES only**: cheaper at scale, but React Email rendering,
  webhook schema, and inbound/sending quotas are all more work;
  template management lives in a separate console.
- **Option C — SendGrid**: pricing and UX degraded after Twilio
  acquisition; webhook reliability is the most common complaint in
  the postmortem literature we reviewed.
- **Option D — Postmark**: strong transactional story, but no first-class
  React Email integration and weaker EU presence.

## Consequences

- ✅ Rich React Email workflow: components in `components/emails/`
  render to HTML + text at send time; previews live at `/emailtest`.
- ✅ Automatic failover means a Resend outage degrades to SES/SMTP
  rather than outright blocking signups.
- ✅ Webhook-driven suppression (bounce + complaint) keeps our
  sender reputation portable across providers.
- ⚠️ Three provider credentials to rotate. Covered by a quarterly
  rotation checklist in `SECURITY_CHECKLIST.md`.
- ⚠️ Each provider has slightly different `from` / reply-to semantics;
  normalized by the factory layer but worth knowing during debugging.
- 🔄 **Revisit if**: Resend raises prices materially, changes webhook
  format incompatibly, or if we ever ship a marketing-email surface
  (promotional sends have different requirements).

## Implementation notes

- `lib/email/providers/factory.ts` — provider selection + circuit breaker.
- `lib/email/providers/{resend,ses,smtp}.ts` — individual adapters.
- `lib/email/webhook-handler.ts` — normalizes bounce/complaint events
  to the shared `EmailSuppression` table regardless of provider.
- `prisma/schema.prisma` — `EmailProviderConfig` for per-environment
  primary/fallback selection.
