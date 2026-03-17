import React, { type ReactNode } from 'react';

export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  gradient?: boolean;
  glow?: boolean;
  className?: string;
}

const levelStyles: Record<number, string> = {
  1: 'text-4xl font-bold tracking-tight',
  2: 'text-3xl font-semibold tracking-tight',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-medium',
  5: 'text-lg font-medium',
  6: 'text-base font-medium',
};

export function Heading({
  level,
  children,
  gradient = false,
  glow = false,
  className = '',
}: HeadingProps) {
  const Tag = `h${level}` as const;

  const gradientStyle: React.CSSProperties = gradient
    ? {
        backgroundImage: 'var(--ds-gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { color: 'var(--ds-text-primary)' };

  const glowStyle: React.CSSProperties = glow
    ? { textShadow: '0 0 24px var(--ds-primary-400), 0 0 48px var(--ds-primary-600)' }
    : {};

  return (
    <Tag
      className={[
        levelStyles[level],
        'font-[var(--ds-font-heading)]',
        className,
      ].join(' ')}
      style={{ ...gradientStyle, ...glowStyle }}
    >
      {children}
    </Tag>
  );
}

export default Heading;
