import React, { type ReactNode, type ElementType } from 'react';

export interface GradientTextProps {
  gradient?: 'primary' | 'secondary' | 'accent' | (string & {});
  animated?: boolean;
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

const presetGradients: Record<string, string> = {
  primary: 'var(--ds-gradient-primary)',
  secondary: 'var(--ds-gradient-secondary)',
  accent: 'var(--ds-gradient-accent)',
};

export function GradientText({
  gradient = 'primary',
  animated = false,
  children,
  as: Tag = 'span',
  className = '',
}: GradientTextProps) {
  const bg = presetGradients[gradient] || gradient;

  return (
    <>
      {animated && (
        <style>{`
          @keyframes ds-gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      )}
      <Tag
        className={`inline-block ${className}`}
        style={{
          backgroundImage: bg,
          backgroundSize: animated ? '200% 200%' : undefined,
          animation: animated
            ? 'ds-gradient-shift 4s ease infinite'
            : undefined,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {children}
      </Tag>
    </>
  );
}

export default GradientText;
