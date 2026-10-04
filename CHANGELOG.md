# Changelog

All notable changes to this project. Versions match the git tags; each tag
builds and publishes `ghcr.io/tahk88-png/voucher-platform:<tag>`.

## [Unreleased]

### Privacy
- Analytics now honour cookie consent. `/api/analytics/track` and
  `/api/analytics/pageview` record nothing unless the visitor opted in to
  analytics, and Vercel Analytics renders only after consent (switching on
  immediately when the visitor accepts, without a reload). Previously consent
  was collected but never read back.
- `/api/analytics/pageview` is rate limited per IP (it is public and writes a
  row per request).

### Fixed
- `/campaigns` loading skeleton had a fixed 384px bar, wider than a 375px
  phone: the page scrolled sideways for about a second on every load
  (measured on voucher.synx.ee).
- `/gifts` queried the gift feed twice on every visit: the filter component
  reported its unchanged initial state on mount, which re-ran the feed query.

### SEO
- Demo content (`scripts/demo-content.cjs`, merchants with the `demo-` slug
  prefix) is excluded from the sitemap and its campaign and merchant pages are
  `noindex`. The live sitemap listed all eight "NÄIDIS" sample campaigns in
  every locale, inviting search engines to index them as real offers.

## [1.1.2] - 2026-09-26

### Changed
- The server rollout in the Deploy workflow is opt-in via the repository
  variable `AUTO_DEPLOY=true`; tags still build and push the image.
- `deploy/update.sh <tag>` updates a server by hand in one command.

## [1.1.1] - 2026-09-26

### Added
- `scripts/demo-content.cjs add|remove`: clearly labelled demo merchants and
  campaigns for an otherwise empty deployment (vouchers created paused).

### Fixed
- Campaign "Buy Now" opens the voucher page instead of looping back to the
  same page; "Verified partner" requires completed onboarding.

## [1.1.0] - 2026-09-26

### Added
- Self-hosted production stack: hardened compose files (no public database or
  Redis ports, password-protected Redis), `deploy/deploy.sh` with migrations,
  health gate and rollback, cron runner, backup/restore scripts, and a
  HestiaCP path for shared servers.
- `lib/app-url.ts` as the single source for the public origin and e-mail
  addresses; production fails loudly without a configured URL.

### Fixed
- The Docker image builds in `/srv/voucher`: with `WORKDIR /app`, webpack
  resolved the root layout to `app/app/layout.tsx` and every page redirected
  to `/login`.
- The image installs `openssl` so Prisma loads its OpenSSL 3 engine.

### Removed
- Hardcoded third-party domains, invented landing-page figures, the fake live
  purchase feed, and the unsigned wallet-pass stub.

## [1.0.0] - 2026-09-13

First release with the full CI pipeline green.

### Fixed
- CI and the Docker build installed with an unresolvable npm lockfile; the
  project now uses pnpm only.
- The migration chain could not build a fresh database (80 of 121 models were
  never created by any migration). `prisma migrate deploy` now works from
  scratch, verified by CI on every push.
- Unauthenticated read access on three admin gift-taxonomy endpoints.
- Fabricated traction figures and testimonials on the landing page.
- The Deploy workflow could not push the image (missing `packages: write`).

### Added
- Trusted client-IP helper used by every rate limiter; API guard and
  consent regression tests; command palette (Ctrl/Cmd+K).

### Stack
- Next.js 15 (App Router), NextAuth v5 (JWT sessions), Prisma + PostgreSQL,
  Tailwind CSS, next-intl (25 locales), Stripe, Resend.
