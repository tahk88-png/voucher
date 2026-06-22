"use client";
import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";

type Props = {
  beforeTitle: string;
  afterTitle: string;
  beforeItems: string[];
  afterItems: string[];
};

export function BeforeAfterSlider({ beforeTitle, afterTitle, beforeItems, afterItems }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  function handleMove(clientX: number) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(85, Math.max(15, x)));
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-[var(--border)] select-none"
      style={{ height: 320 }}
      onMouseMove={(e) => isDragging && handleMove(e.clientX)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Before side */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 p-6" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <h3 className="text-lg font-bold text-[var(--danger)] mb-4">{beforeTitle}</h3>
        <ul className="space-y-2">
          {beforeItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="w-5 h-5 rounded-full bg-[var(--danger)]/15 flex items-center justify-center text-[var(--danger)] text-xs">✕</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* After side */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f6e1d7] to-[#efd2c4] dark:from-neutral-800 dark:to-neutral-700 p-6" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <h3 className="text-lg font-bold text-[var(--success)] mb-4">{afterTitle}</h3>
        <ul className="space-y-2">
          {afterItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-[var(--text)]">
              <span className="w-5 h-5 rounded-full bg-[var(--success)]/15 flex items-center justify-center text-[var(--success)] text-xs">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Drag handle */}
      <div
        className="absolute top-0 bottom-0 z-20 cursor-col-resize flex items-center"
        style={{ left: `${split}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="w-[2px] h-full bg-[var(--primary)]" />
        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-10 rounded-lg bg-white border-2 border-[var(--primary)] flex items-center justify-center shadow-lg cursor-col-resize">
          <GripVertical className="h-4 w-4 text-[var(--primary)]" />
        </div>
      </div>
    </div>
  );
}
