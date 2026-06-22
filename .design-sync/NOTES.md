# design-sync notes — voucher-platform

Repo-specific gotchas for syncing this design system to claude.ai/design.
Read this before any re-sync.

## Shape & scope
- **shape = `package`** (no Storybook anywhere in the repo).
- This is a **Next.js app, not a packaged component library** — `package.json` has
  no `main`/`module`/`exports` and there's no `dist/`. The converter runs in
  **synth-from-source** mode.
- Synced surface is scoped to **`components/ds/`** (the purpose-built design-system
  barrel `components/ds/index.ts`). It is 100% client-safe: no `next/*`, no
  `@/lib/prisma`, no `@/lib/logger`. 11 components discovered:
  DsButton, DsCard, DsInput, DsBadge, DsAlert, DsModal, DsSelect, DsTabs,
  DsToggle, DsTooltip, DsSidebar.
- `components/ui/` is a clean optional expansion (~40 shadcn-style primitives).
  Exclude the 4 `next/*`-coupled ones (image-upload, voucher-card, stats-card,
  charts/index) and the heavy-data ones (data-table, calendar, form, charts/*).

## Converter invocation (this repo)
- Build command that works:
  ```
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules ./node_modules --entry ./components/ds/index.ts --out ./ds-bundle
  ```
- **`--entry ./components/ds/index.ts` is REQUIRED.** Without it, `PKG_DIR` resolves
  to `node_modules/voucher-platform` (which doesn't exist — the app never
  self-installs) and the build crashes in `dts.mjs` reading a missing
  `package.json`. `--entry` makes it walk up to the repo's real `package.json`.
- **`componentSrcMap` is REQUIRED** to discover components. Synth discovery scanned
  the repo's ambient `types/` dir (4 `.d.ts`) and found 0 PascalCase exports
  (`[ZERO_MATCH]`). Pinning each `Ds*` → its `components/ds/*.tsx` path fixed it.

## Known gaps to resolve before a QUALITY published sync
- **`.d.ts` prop contracts are STUBS** — every component emits
  `interface XProps { [key: string]: unknown }` instead of the real
  `variant`/`size`/etc. Synth mode + the ambient `types/` parse can't extract the
  source prop interfaces. The barrel DOES re-export real typed props
  (`DsButtonProps` etc.), so options: (a) add a real `tsc` emit of `.d.ts` for the
  `ds/` components and point `--entry` at that, or (b) hand-write `cfg.dtsPropsFor.<Name>`
  bodies. This matters: the `.d.ts` is the API contract the design agent codes against.
- **Preview styling** — `cfg.cssEntry = styles/design-tokens.css` ships 170 CSS
  custom properties (the tokens) but NOT the Tailwind utility classes the
  components use (`bg-[...]`, `rounded-[...]`, etc.). Previews will render
  unstyled-ish without the Tailwind-compiled CSS. Need to compile the project's
  Tailwind output for the `ds/` class surface and point `cssEntry` at it (or add
  it to the styles.css import closure).
- **`[FONT_MISSING]`** — `--ds-font-mono` chain (JetBrains Mono / Fira Code /
  Cascadia Code) has no shipped `@font-face`. Cosmetic; system mono substitutes.
  Wire via `cfg.extraFonts` or accept the substitute.

## Resolved (2026-06-22) — full build complete, verified, UPLOAD-READY
- **Prop contracts fixed** via `cfg.dtsPropsFor` (all 11 real prop interfaces,
  unions + sub-types inlined). The synth-mode auto-extract emitted `{[key]: unknown}`
  stubs; dtsPropsFor overrides them. Keep these — re-sync reuses them.
- **Styling solved.** `cfg.cssEntry = .design-sync/.cache/ds-tailwind.css` — a
  THREE-layer concatenation rebuilt by:
  1. `tailwindcss -c tailwind.config.ts -i <globals stripped of @import> -o globals-compiled.css --content './components/ds/**/*.tsx' --minify`
  2. `cat styles/design-tokens.css styles/animations.css globals-compiled.css > .cache/ds-tailwind.css`
  The components use SEMANTIC vars (`--primary`,`--text`,`--glass-bg`,`--gradient-brand-*`)
  defined in `app/globals.css` `:root`/`.dark` — NOT the `--ds-*` scale. All three
  layers must ship or previews render unstyled. **Re-run this compile whenever
  globals.css / design-tokens.css / the ds components change.**
- **11 previews authored** in `.design-sync/previews/` (DsButton solo-calibrated,
  rest fanned out). All render on-brand; all graded `good`. Render check 11/11 clean.
- **Overrides:** DsModal `cardMode:single` (fixed portal), DsAlert/DsTabs `cardMode:column`
  (wide), DsTooltip `cardMode:single primaryStory:Triggers` (hover-only bubble).
- **Conventions header** at `.design-sync/conventions.md` (wired via `readmeHeader`).
- **`[FONT_MISSING]` mono fonts** (JetBrains Mono / Fira Code / Cascadia Code, `--ds-font-mono`)
  — accepted: system mono substitutes. Record in "Known render warns" if formalizing.

## Status / next step
- **Local build is COMPLETE and verified, NOT yet uploaded.** Final driver run
  (`resync.mjs`, no `--remote`) exits 0; verdict `upload.any:true`, all 11 ready,
  `pendingGrade:[]`, `deletePaths:[]`. No `projectId` yet.
- **Upload blocked on auth only:** `DesignSync` returned "needs design-system
  authorization — run /design-login". Once the user authorizes, resume at base
  SKILL.md §1 (first sync → create new project → incremental upload). The bundle in
  `ds-bundle/` is final; just needs the project created + files pushed.
- Keep the `--entry ./components/ds/index.ts` invocation (srcDir alone crashes on PKG_DIR).
