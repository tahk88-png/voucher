# Contributing

Thank you for working on the voucher platform. This document is the
short version of how we keep the codebase sane — read it once and
you're good.

## Local setup

Requirements: Node 22.x, pnpm (preferred) or npm, Docker (for local
Postgres), a `.env.local` (copy from `.env.example`).

```bash
pnpm install
pnpm db:setup       # starts Docker Postgres, runs migrations, seeds
pnpm dev            # http://localhost:3000
```

If `pnpm dev` fails with an `EISDIR` error on Windows, see
[`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — there's a
known Node 22 + Windows bug we patch via `fix-eisdir.js`.

## Branch and commit conventions

- **Branch names**: `feat/<short-slug>`, `fix/<short-slug>`,
  `chore/<short-slug>`, `docs/<short-slug>`. Keep the slug under ~40
  chars.
- **Commit messages**: one short imperative subject line, optional
  body. We do not enforce Conventional Commits but prefer the
  prefixes `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`,
  `perf:`, `build:`.
- **One logical change per commit.** If your PR has 12 commits of
  "wip", squash before merge.

## Before you open a PR

- [ ] `pnpm tsc --noEmit` — zero type errors. Do **not** set
      `ignoreBuildErrors: true` to paper over an error (see ADR-free
      decision in `next.config.js:55`).
- [ ] `pnpm test:run` — full unit-test suite green.
- [ ] `pnpm lint` — no new lint warnings from your diff.
- [ ] If you touched the schema: `pnpm prisma migrate dev` locally
      and include the generated migration in the commit.
- [ ] If you added an env var: update `.env.example` and the relevant
      section of `docs/CONFIGURATION_GUIDE.md`.
- [ ] If you added or changed a public API route: update
      `docs/API.md`.
- [ ] If the change is architecturally significant, write an ADR in
      `docs/adr/` (see [`docs/adr/README.md`](./docs/adr/README.md)
      for when to write one).

## Tests we care about

- **Unit tests** (`lib/__tests__/*.test.ts`) — pure business logic
  only. Mock the DB with `vi.mock('@/lib/prisma', ...)`.
- **Integration tests** (`pnpm test:integration`) — exercise API
  routes against a real test Postgres. Slower; opt-in via env flag.
- **E2E tests** (`e2e/*.spec.ts`) — Playwright, full browser
  flows. Run with `pnpm test:e2e`.

Add at least one unit test for every new pure helper in `lib/`. For
API routes, prefer an integration test unless the handler really is
trivial.

## Code style

- **TypeScript strict**. No `any` in checked-in code unless there's a
  comment explaining why.
- **No default exports** for named modules (pages / route handlers
  are the exception — Next.js requires them).
- **File names**: kebab-case for modules, PascalCase for
  React components.
- **Imports**: absolute from `@/` root (configured in `tsconfig.json`).
- **Comments explain *why*, not *what*.** If a function needs a
  comment explaining what it does, rename it.

## Database changes

- Always via a migration — never `db push` against a shared DB.
- Migration names are timestamp-prefixed (`prisma migrate dev`
  handles this).
- Irreversible migrations (dropping a column with data) need sign-off
  from a second engineer. Add a note in the PR description.
- If your migration backfills data on a large table, write the
  backfill as a separate, idempotent cron or script — not inline in
  the migration.

## Secrets

**Do not commit `.env` or `.env.local`.** The `.env.example` file is
the only committed env reference and should only contain dummy
values. If you believe a secret has been committed, contact a
maintainer immediately — rotation first, history rewrite second.

## Review etiquette

- Small PRs merge faster. If your PR is over ~500 lines of diff
  (excluding lockfiles and migrations), split it.
- Request review on GitHub — don't DM.
- If CI is red, fix CI before asking for a human review.
- Reviewers: disagreements are "nit:" or "blocking:" — be explicit
  which one a comment is.

## Release process

- PRs merge to `main` via squash-merge.
- Vercel auto-deploys `main` to production.
- Database migrations run automatically in the deploy workflow
  (`.github/workflows/deploy.yml`).
- If you need to roll back, revert the merge commit and let the next
  deploy propagate — do not force-push `main`.
