# Architecture Decision Records (ADRs)

This folder records the **"why"** behind choices that shaped the
codebase — the kind of thing you'd otherwise have to reconstruct by
archaeology through commit history and Slack.

## How to read an ADR

Start with **Context**, skim **Decision**, then read **Consequences**
and **Implementation notes** — those are the fields most useful at
debugging-time.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-database-backed-email-queue.md) | Database-backed email queue instead of BullMQ / Redis | Accepted |
| [0002](0002-resend-primary-email-provider.md) | Resend primary + SES / SMTP fallback | Accepted |
| [0003](0003-nextauth-v5-jwt-sessions.md) | NextAuth v5 JWT (stateless) sessions | Accepted |
| [0004](0004-next-intl-as-needed-locale-prefix.md) | next-intl with "as-needed" locale prefix | Accepted |
| [0005](0005-warm-design-tokens.md) | Warm design tokens + Radix + WarmCard layer | Accepted |

## Writing a new ADR

1. Copy [`0000-template.md`](0000-template.md) to `000N-short-slug.md`
   (next sequential number).
2. Fill every field — if a section doesn't apply, delete it (don't
   leave placeholders).
3. Add an entry to the index above in the same PR.
4. Once merged, do not edit the ADR in place to reverse a decision —
   write a new ADR that supersedes it and flip the old one's status
   to `Superseded by ADR-XXXX`.

## When to write one

Write an ADR when you're about to make a choice that:

- Would be painful to reverse (schema, auth, billing).
- Has non-obvious tradeoffs.
- You're going to explain more than twice.

Skip an ADR for routine choices that any competent teammate would
make the same way.
