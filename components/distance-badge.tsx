"use client";

import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface DistanceBadgeProps {
  distanceKm: number;
  className?: string;
}

/**
 * Compact badge showing distance in km or m.
 * Under 1 km shows meters, otherwise shows km with 1 decimal.
 */
export function DistanceBadge({ distanceKm, className }: DistanceBadgeProps) {
  const label =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--r-full)] px-2.5 py-0.5 text-xs font-medium",
        "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20",
        className
      )}
    >
      <MapPin className="h-3 w-3" />
      {label}
    </span>
  );
}
