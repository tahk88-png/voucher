import React, { type ReactNode } from 'react';
import * as LucideIcons from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconSystemProps {
  name: string;
  size?: IconSize;
  color?: string;
  glow?: boolean;
  badge?: number;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const badgeSizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3 text-[7px] -top-1 -right-1',
  sm: 'w-3.5 h-3.5 text-[8px] -top-1 -right-1',
  md: 'w-4 h-4 text-[9px] -top-1.5 -right-1.5',
  lg: 'w-4.5 h-4.5 text-[10px] -top-1.5 -right-1.5',
  xl: 'w-5 h-5 text-[11px] -top-2 -right-2',
};

/**
 * Convert a kebab-case or lowercase icon name to PascalCase
 * e.g. "arrow-right" -> "ArrowRight", "home" -> "Home"
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

export function IconSystem({
  name,
  size = 'md',
  color,
  glow = false,
  badge,
  className = '',
}: IconSystemProps) {
  const pascalName = toPascalCase(name);
  const IconComponent = (LucideIcons as Record<string, unknown>)[pascalName] as
    | React.ComponentType<{ size: number; className?: string; style?: React.CSSProperties }>
    | undefined;

  if (!IconComponent) {
    // Fallback: render a placeholder square
    return (
      <span
        className={`inline-block rounded ${className}`}
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          background: 'var(--ds-bg-glass)',
          border: '1px solid var(--ds-border-default)',
        }}
        title={`Icon "${name}" not found`}
      />
    );
  }

  const px = sizeMap[size];
  const colorValue = color || 'currentColor';

  const glowStyle: React.CSSProperties = glow
    ? {
        filter: `drop-shadow(0 0 6px ${color || 'var(--ds-primary)'})`,
      }
    : {};

  const showBadge = badge !== undefined && badge > 0;

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <IconComponent
        size={px}
        style={{ color: colorValue, ...glowStyle }}
      />
      {showBadge && (
        <span
          className={[
            'absolute inline-flex items-center justify-center rounded-full font-bold leading-none',
            badgeSizeMap[size],
          ].join(' ')}
          style={{
            background: 'var(--ds-error)',
            color: '#fff',
          }}
          aria-label={`${badge} notifications`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  );
}

export default IconSystem;
