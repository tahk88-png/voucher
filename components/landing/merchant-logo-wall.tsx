"use client";
import { motion } from "motion/react";

/**
 * Marquee of merchants on the platform.
 *
 * This previously rendered a hardcoded list of invented businesses ("Tallinn
 * Spa", "Nordic Kitchen", …) under a "Trusted by businesses across Europe"
 * heading — a fabricated trust signal. It now renders only real merchant names
 * supplied by the caller, and renders nothing when there are none.
 */
function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function MerchantLogoWall({ merchants = [] }: { merchants?: string[] }) {
  if (merchants.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly.
  const doubled = [...merchants, ...merchants];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />
      <motion.div
        className="flex gap-8 items-center"
        animate={{ x: [0, -50 * merchants.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-white/70 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-xs font-bold text-white">
              {initialsFor(name)}
            </div>
            <span className="text-sm font-medium text-[var(--text)] whitespace-nowrap">{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
