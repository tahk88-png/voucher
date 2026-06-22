# ADR-NNNN: Short decision title

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Date**: YYYY-MM-DD
- **Deciders**: names / roles
- **Related**: links to issues, PRs, prior ADRs

## Context

What problem are we solving? What constraints matter (cost, latency,
team size, vendor lock-in, compliance, existing investments)?
Write this so a new engineer six months from now can understand
*why the decision was needed*, not just what we chose.

## Decision

The chosen option, stated in one paragraph. Be specific — "we use X
configured with Y, handled by Z module" — not "we looked at options."

## Alternatives considered

Enumerate the real candidates and why each was rejected. If only one
option was on the table, say so — that's also information.

- **Option A (chosen)** — summary.
- **Option B** — rejected because …
- **Option C** — rejected because …

## Consequences

Honest list, good and bad.

- ✅ What this buys us.
- ⚠️ What it costs us.
- 🔄 What will force us to revisit this decision (e.g. "if queue depth
  exceeds 10k/hour we should re-evaluate").

## Implementation notes

Pointers to the code / config that embodies the decision, so future
readers don't have to grep. Keep these short — a handful of file paths.
