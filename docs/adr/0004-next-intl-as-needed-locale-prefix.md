# ADR-0004: next-intl with "as-needed" locale prefix

- **Status**: Accepted
- **Date**: 2026-02
- **Deciders**: platform engineering
- **Related**: `i18n.ts`, `middleware.ts`, `messages/*.json`

## Context

The platform ships in **15 locales** spanning the EU plus Ukrainian
and a few others (EN, ET, FI, SV, DE, FR, ES, UK, RU, NL, NO, DK, PL,
IT, PT). We want:

- SEO-friendly URLs (Google treats `/de/...` as German pages).
- A non-ugly English URL — `/campaigns/...` not `/en/campaigns/...`.
- A single page component that works for any locale (no per-locale
  duplication of routes).
- Type-safe message keys, so missing-key bugs fail at build, not at
  render.

Constraints:
- **EN is the default and must stay unprefixed**. Marketing has
  inbound links to `/` and `/campaigns` that we're not going to break.
- **Locale detection must work at the edge** for correct redirects
  on first visit (Accept-Language → set cookie → redirect).
- **Server components need translations too**, not just client.

## Decision

Use **`next-intl`** with `localePrefix: 'as-needed'`:

- EN (default) routes are unprefixed: `/`, `/campaigns`, `/login`.
- All other locales carry the prefix: `/de/`, `/fi/`, `/uk/`, etc.
- `middleware.ts` composes with the next-intl middleware to redirect
  based on the `NEXT_LOCALE` cookie or Accept-Language.
- `messages/<locale>.json` per locale, all sharing the same key tree.

## Alternatives considered

- **Option A — next-intl `as-needed` (chosen)**: first-class App
  Router support, async server-component translations, typed
  messages, works with our middleware stack.
- **Option B — next-intl `always`**: every URL prefixed (`/en/...`).
  SEO-clean but breaks the existing inbound link base and feels
  over-prefixed for a default-English product.
- **Option C — next-i18next**: strong Pages Router story, but its App
  Router support lagged when we evaluated, and the maintained fork
  story has been noisy.
- **Option D — Custom with Intl API**: viable but we'd rebuild the
  message-loading, locale-detection, and type-safety layers by hand.

## Consequences

- ✅ EN URLs unchanged — no redirect churn on marketing campaigns.
- ✅ Type-safe message keys via next-intl's TS plugin: a missing
  key fails the build in the editor.
- ✅ `getTranslations()` works in server components; client
  components use `useTranslations()` — one mental model.
- ⚠️ The "as-needed" policy means our router and canonical-URL
  helpers have to understand "EN has no prefix, others do" — see
  `lib/locale-url.ts`.
- ⚠️ Middleware composition order matters: auth → locale. Inverted
  once, caused a redirect loop.
- 🔄 **Revisit if**: we add a second default-eligible locale (e.g.
  a region where we want a non-prefixed Ukrainian for `.ua`), or if
  next-intl changes its middleware API incompatibly.

## Implementation notes

- `i18n.ts` — locale list, fallback, message loader.
- `middleware.ts` — composition with `createIntlMiddleware`.
- `messages/<locale>.json` — 15 files, one per locale.
- `lib/locale-url.ts` — helpers for building canonical hrefs.
