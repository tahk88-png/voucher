# ADR-0005: Warm design tokens with custom WarmCard / WarmButton on top of Radix

- **Status**: Accepted
- **Date**: 2026-02
- **Deciders**: platform engineering, design
- **Related**: `tailwind.config.ts`, `components/ui/`, `components/warm/`

## Context

Voucher / gift / reward platforms live or die on "feels
trustworthy" — the competitor set (discount aggregators, coupon
sites, generic card shops) looks cheap and spammy. We wanted a
visual identity warmer than the usual blue-corporate SaaS palette,
consistent across 15 locales and 150+ routes, and built on an
accessible component base.

Constraints:
- **Accessibility**: keyboard + screen-reader behaviour for
  dialogs, popovers, menus, tabs. We're not rebuilding that from
  zero.
- **Dark mode**: must be clean, not a simple colour inversion.
- **Design debt**: one brand shift mid-project would touch every
  page; tokens must be centralised.
- **Team size**: 1-2 engineers, no dedicated design system owner.

## Decision

Layer the design system in three tiers:

1. **Tokens** (Tailwind theme in `tailwind.config.ts`): colour ramps
   `warm-50` → `warm-950`, `cream`, `amber`, `terracotta`,
   `sage`; semantic aliases (`bg-surface`, `bg-elevated`,
   `border-subtle`); radii, shadows, and font scales. All dark-mode
   variants co-located.
2. **Primitives** (`components/ui/`): Radix-based atoms — button,
   dialog, popover, tabs, select, tooltip — styled via CVA (class-
   variance-authority) against the tokens. These are unchanged from
   shadcn patterns and stay upstream-compatible.
3. **Warm variants** (`components/warm/`): `WarmCard`, `WarmButton`,
   `WarmHeader`, etc. These are *brand* surfaces — elevated, cream-
   background, softer radii. They wrap the primitives rather than
   replace them.

## Alternatives considered

- **Option A — Warm tokens + Radix + CVA (chosen)**: keep all Radix
  a11y, get our brand voice via a thin warm layer.
- **Option B — Pure shadcn/ui as-is**: generic and it shows. Too
  similar to every other SaaS in the space.
- **Option C — Material / Chakra / Mantine**: each has strong primitives
  but all three force a whole visual vocabulary on us that we'd
  spend the same effort overriding.
- **Option D — Roll our own primitives**: a no. Keyboard focus
  management in menus and dialogs alone is months of edge cases.

## Consequences

- ✅ Any colour rebalance happens in one config file — no search-and-
  replace across components.
- ✅ Warm brand surfaces (`WarmCard`) are visually distinct where
  they matter (landing, dashboards, receipts) without polluting
  admin tables that want neutral density.
- ✅ Dark mode is first-class: every token has a dark variant, no
  runtime colour-inversion tricks.
- ⚠️ Two button systems (`components/ui/button` and `WarmButton`)
  need a clear "use X on consumer surfaces, Y in admin"
  convention — documented in component JSDoc.
- ⚠️ Adding a new token means touching `tailwind.config.ts`, which
  triggers a full Tailwind rebuild. Not a problem at current scale
  but worth noting.
- 🔄 **Revisit if**: we bring on a dedicated design-systems owner
  who wants to push into Figma-driven token export, or if Radix
  ever stops being the accessibility baseline we trust.

## Implementation notes

- `tailwind.config.ts` — token scale + semantic aliases.
- `components/ui/*` — Radix-based primitives.
- `components/warm/*` — branded surfaces.
- `app/globals.css` — CSS variables for any token consumed outside
  Tailwind (e.g. inline `style={{...}}` on a chart).
