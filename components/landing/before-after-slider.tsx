"use client";
import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  beforeTitle: string;
  afterTitle: string;
  beforeItems: string[];
  afterItems: string[];
};

function BeforeList({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h3 className="text-lg font-bold text-[var(--danger)] mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
            <span aria-hidden="true" className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[var(--danger)]/15 flex items-center justify-center text-[var(--danger)] text-xs">✕</span>
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

function AfterList({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h3 className="text-lg font-bold text-[var(--success)] mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
            <span aria-hidden="true" className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[var(--success)]/15 flex items-center justify-center text-[var(--success)] text-xs">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

const MIN_SPLIT = 15;
const MAX_SPLIT = 85;

export function BeforeAfterSlider({ beforeTitle, afterTitle, beforeItems, afterItems }: Props) {
  const t = useTranslations("home.compare");
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  function clamp(value: number) {
    return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));
  }

  function handleMove(clientX: number) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSplit(clamp(((clientX - rect.left) / rect.width) * 100));
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setSplit((value) => clamp(value - 5));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setSplit((value) => clamp(value + 5));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSplit(MIN_SPLIT);
    } else if (event.key === "End") {
      event.preventDefault();
      setSplit(MAX_SPLIT);
    }
  }

  return (
    <>
      {/* Phones: the two columns would overlap inside a drag slider, so they stack. */}
      <div className="sm:hidden space-y-3">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 p-5">
          <BeforeList title={beforeTitle} items={beforeItems} />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#f6e1d7] to-[#efd2c4] dark:from-neutral-800 dark:to-neutral-700 p-5">
          <AfterList title={afterTitle} items={afterItems} />
        </div>
      </div>

      <div
        ref={containerRef}
        className="hidden sm:block relative w-full rounded-2xl overflow-hidden border border-[var(--border)] select-none"
        style={{ height: 320 }}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Before side */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 p-6" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <BeforeList title={beforeTitle} items={beforeItems} />
        </div>

        {/* After side */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f6e1d7] to-[#efd2c4] dark:from-neutral-800 dark:to-neutral-700 p-6 flex flex-col items-end text-right" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <div className="text-left">
            <AfterList title={afterTitle} items={afterItems} />
          </div>
        </div>

        {/* Drag handle */}
        <div
          className="absolute top-0 bottom-0 z-20 cursor-col-resize flex items-center"
          style={{ left: `${split}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <div className="w-[2px] h-full bg-[var(--primary)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label={t("sliderLabel", { before: beforeTitle, after: afterTitle })}
            aria-valuemin={MIN_SPLIT}
            aria-valuemax={MAX_SPLIT}
            aria-valuenow={Math.round(split)}
            onKeyDown={handleKeyDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-10 rounded-lg bg-white border-2 border-[var(--primary)] flex items-center justify-center shadow-lg cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <GripVertical className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
}
