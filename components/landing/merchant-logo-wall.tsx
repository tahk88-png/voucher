"use client";
import { motion } from "motion/react";

const MERCHANT_LOGOS = [
  { name: "Tallinn Spa", initials: "TS" },
  { name: "Nordic Kitchen", initials: "NK" },
  { name: "Urban Fitness", initials: "UF" },
  { name: "Baltic Fashion", initials: "BF" },
  { name: "Sweet Helsinki", initials: "SH" },
  { name: "Oslo Crafts", initials: "OC" },
  { name: "Stockholm Eats", initials: "SE" },
  { name: "Kyiv Beauty", initials: "KB" },
  { name: "Riga Market", initials: "RM" },
  { name: "Vilnius Tech", initials: "VT" },
  { name: "Turku Wellness", initials: "TW" },
  { name: "Bergen Outdoor", initials: "BO" },
];

export function MerchantLogoWall() {
  const doubled = [...MERCHANT_LOGOS, ...MERCHANT_LOGOS];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />
      <motion.div
        className="flex gap-8 items-center"
        animate={{ x: [0, -50 * MERCHANT_LOGOS.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((merchant, i) => (
          <div
            key={`${merchant.name}-${i}`}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-white/70 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-xs font-bold text-white">
              {merchant.initials}
            </div>
            <span className="text-sm font-medium text-[var(--text)] whitespace-nowrap">{merchant.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
