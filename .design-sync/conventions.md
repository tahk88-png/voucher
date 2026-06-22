# VoucherDS — usage conventions

A small React design system in the **Claude / Anthropic** visual language: warm clay-coral (`#cc785c`) on soft ivory, editorial and calm. Every component is exported from `window.VoucherDS` and styled entirely by CSS custom properties — there is **no provider to wrap and no theme object to pass**.

## Setup

Components are self-contained. Render them directly:

```jsx
<DsButton variant="primary">Get started</DsButton>
```

The look comes entirely from the bound `styles.css` (already loaded alongside the bundle). It defines the token layer the components read; nothing else is required for them to appear on-brand. Dark mode: add `class="dark"` to a root element — every token has a warm-charcoal dark value, so all components adapt with no per-component work.

## Styling idiom — CSS variables, not utility classes

This is a **token-driven** system. Components do not expose a Tailwind class API; they style themselves from CSS custom properties, and **your own layout glue should reach for the same variables** so it sits in the same palette. Do not invent hex colors — use these tokens.

Semantic tokens (use these for app layout):
- Text: `var(--text)`, `var(--text-muted)`
- Surfaces: `var(--surface)`, `var(--surface-muted)`, `var(--glass-bg)` (frosted)
- Lines: `var(--border)`
- Brand: `var(--primary)` (clay), the gradient `var(--gradient-brand-from)` → `var(--gradient-brand-to)`
- Status: `var(--danger)` (plus success/warning carried on component `variant`/`color` props)
- Radius: `var(--ds-radius-md)`

Raw scale (when a semantic token isn't enough): `var(--ds-primary-50 … --ds-primary-900)` and the neutral/secondary scales in the same `--ds-*` family.

Component appearance is driven by **props**, never by passing classes:
- `DsButton` / `DsCard` / `DsBadge` / `DsAlert` — `variant` (and `DsBadge` `color`) select the look
- sizes are `size` (`DsButton`, `DsBadge`) or `inputSize` (`DsInput`)

## Components

`DsButton`, `DsCard`, `DsInput`, `DsBadge`, `DsAlert`, `DsModal`, `DsSelect`, `DsTabs`, `DsToggle`, `DsTooltip`, `DsSidebar`. Each has a `.d.ts` (the prop contract — read it before composing) and a `.prompt.md` (usage + examples). Read the bound `styles.css` for the full token list before styling your own elements.

## One idiomatic example

```jsx
<DsCard variant="elevated" padding="lg" style={{ maxWidth: 360 }}>
  <h3 style={{ color: 'var(--text)', margin: 0 }}>Summer launch</h3>
  <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
    Your campaign is live and reaching its first customers.
  </p>
  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
    <DsButton variant="primary">View dashboard</DsButton>
    <DsButton variant="ghost">Dismiss</DsButton>
  </div>
</DsCard>
```

Library components carry the brand; your wrapper markup uses the same `var(--*)` tokens so the whole composition stays on-brand.
