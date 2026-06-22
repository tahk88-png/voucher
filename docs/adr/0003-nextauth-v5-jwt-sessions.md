# ADR-0003: NextAuth v5 with JWT (stateless) sessions

- **Status**: Accepted
- **Date**: 2026-02
- **Deciders**: platform engineering
- **Related**: `lib/auth.ts`, `middleware.ts`, `auth.config.ts`

## Context

We need authentication that supports multiple factors simultaneously
— **OTP magic link** (primary for low-friction EU users), **password**
(for power users who want it), **OAuth** (Google / Apple / Facebook),
**WebAuthn passkeys**, and **TOTP** (for platform admins). We also
need the session layer to play well with Next.js App Router,
middleware-protected routes, and edge functions.

Constraints:
- **Middleware is edge-runtime only** — it cannot call Prisma. Any
  session check used by `middleware.ts` has to be decodable at the
  edge.
- **Auto-account creation** on first OTP success — the user just
  hands us an email and should land signed-in without a separate
  "create account" step.
- **Rotation without re-login** — we want to be able to change
  session-token shape occasionally (e.g. adding `adminRole` to the
  JWT) without invalidating everyone.

## Decision

Adopt **NextAuth v5 beta** with a **JWT session strategy** (`strategy:
'jwt'`). The JWT is signed with `AUTH_SECRET`, includes stable user
id + email + `adminRole`, and is read in middleware via
`auth()` (edge-compatible). Database-backed sessions are rejected
because middleware would need a DB hop per request.

## Alternatives considered

- **Option A — NextAuth v5 JWT (chosen)**: first-class App Router
  support, built-in providers for every auth method we need,
  middleware-friendly session decode, `encode`/`decode` hooks for
  migration, a large knowledge base for incidents.
- **Option B — NextAuth v4**: proven but its App Router story is
  retrofitted; the v5 migration path is non-trivial later and we'd
  rather eat the beta today than double-migrate.
- **Option C — Clerk / Auth0 / Supabase Auth**: cheaper to build a
  demo with, but every advanced flow we care about (OTP with
  auto-account-creation, TOTP behind RBAC, passkeys tied to our own
  User table) requires webhooks back into our DB anyway, at which
  point we're hosting the complexity without owning it.
- **Option D — Custom auth on top of `jose`**: cheapest code but
  every provider (Apple especially) has enough footguns that rolling
  our own is a forever-tax on the team.

## Consequences

- ✅ Middleware-enforced RBAC is effectively free — decode JWT, check
  `adminRole`, allow/deny. No DB hop.
- ✅ All supported factors coexist in one provider array; users can
  link/unlink OAuth providers against their existing email account.
- ✅ The `jwt` callback is the single place we mint session claims,
  which means one place to audit if a claim misfires.
- ⚠️ JWT can't be invalidated server-side without rotating
  `AUTH_SECRET`. Mitigated by short `maxAge` (30 days) and a
  `sessionVersion` claim we can bump to force everyone to re-sign-in.
- ⚠️ NextAuth v5 is still beta — breaking changes between releases
  are possible. Tracked in `DEPLOYMENT_CHECKLIST.md`.
- 🔄 **Revisit if**: we need true server-side session revocation
  (e.g. a security incident requiring instant logout), or if v5
  stays in beta past mid-2026.

## Implementation notes

- `lib/auth.ts` — NextAuth init, providers, `jwt`/`session` callbacks.
- `auth.config.ts` — edge-safe config for middleware.
- `middleware.ts` — route protection via `auth().user`.
- `app/api/auth/[...nextauth]/route.ts` — standard handler.
