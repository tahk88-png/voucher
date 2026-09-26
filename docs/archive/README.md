# Archived documentation

These files are **historical snapshots** from earlier phases of the
project — MVP planning, launch audits, compliance checks, and
implementation status reports taken at a specific point in time.

They are kept for the audit trail but are **not** a reliable guide to
the current codebase. For anything operational, start at the top-level
[`../README.md`](../../README.md) and the active docs under `docs/`:

- `API.md` — current REST/webhook surface
- `DEPLOYMENT_CHECKLIST.md` — what to verify before a release
- `CONFIGURATION_GUIDE.md` — env vars and runtime config
- `MONITORING.md` — Sentry, metrics, cron telemetry
- `SECURITY_CHECKLIST.md` — live checklist
- `BACKUP_STRATEGY.md` — DB backup + restore runbook
- `adr/` — architecture decision records (the "why")

## What's in here

| File | Kind | Era |
|---|---|---|
| `MVP_*.md` | MVP planning / gap analysis / completion reports | MVP phase |
| `AUDIT.md`, `AUDIT_2026-01-24.md` | Platform audits | 2026-Q1 |
| `COMPLETION_REPORT.md` | Implementation wrap-up | MVP phase |
| `IMPLEMENTATION_STATUS.md`, `IMPLEMENTATION_SUMMARY.md` | Build progress | MVP phase |
| `DESIGN_ROUTE_AUDIT.md` | Route/UX review | 2026-Q1 |
| `I18N_PAGE_AUDIT.md` | Per-page i18n coverage snapshot | 2026-Q1 |
| `LAUNCH_MODE_IMPLEMENTATION.md` | Launch-mode feature build notes | MVP phase |
| `SETUP_VERIFICATION.md` | One-time setup smoke-test results | MVP phase |
| `TROUBLESHOOTING_BUILD.md` | Superseded by `../TROUBLESHOOTING.md` | MVP phase |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md`, `IMPLEMENTATION_ROADMAP.md`, `EXECUTIVE_SUMMARY.md`, `PRODUCTION_READINESS.md`, `PRODUCTION_READINESS_REPORT.md` | Production-readiness reviews and plans (Vercel-era deploy steps); superseded by `../../DEPLOYMENT.md` and `../../RUNBOOK.md` | 2026-Q1 |
| `QUICK_START.md` | "Production improvements" setup notes; superseded by `../../QUICKSTART.md` | 2026-Q1 |
| `UI_SKELETON_*.md` | UI skeleton build status and test notes | MVP phase |
| `IMPROVEMENTS.md`, `IMPROVEMENTS_SUMMARY.md`, `SUMMARY.md` | Improvement plans and summaries | 2026-Q1 |
| `I18N_STATUS.md`, `I18N_COMPLETE.md` | i18n progress snapshots; current guide is `../I18N.md` | 2026-Q1 |

## Do not update files here

If something in an archived doc is still relevant, **copy** it forward
into the appropriate current-state doc and leave the archive entry
alone so the trail stays intact.
