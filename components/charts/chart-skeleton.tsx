"use client"

/**
 * Placeholder shown while a recharts-heavy chart chunk downloads.
 *
 * Every recharts-based chart in this folder is re-exported from
 * `index.ts` via `next/dynamic()` — on first render the chunk is
 * fetched async, and this skeleton fills the space until it
 * mounts. Kept deliberately lightweight (no deps beyond Tailwind)
 * so it doesn't defeat the code-split.
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-alt)]"
      style={{ height }}
      aria-hidden="true"
    />
  )
}
