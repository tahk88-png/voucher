'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const themeOrder = ['light', 'dark', 'system'] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length];
    setTheme(next);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label =
    theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System theme';

  return (
    <button
      onClick={cycle}
      aria-label={label}
      title={label}
      className="
        relative inline-flex items-center justify-center
        w-9 h-9 rounded-full
        transition-all duration-200 ease-smooth
        hover:scale-105 active:scale-95
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]
      "
      style={{
        color: 'var(--text-muted)',
        backgroundColor: 'var(--surface-dim)',
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
