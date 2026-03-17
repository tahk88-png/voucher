import React, { type ReactNode } from 'react';

export interface TextProps {
  variant?: 'body' | 'small' | 'caption' | 'label' | 'code';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'error';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'label';
}

const variantStyles: Record<string, string> = {
  body: 'text-base leading-relaxed',
  small: 'text-sm leading-normal',
  caption: 'text-xs leading-normal',
  label: 'text-sm font-medium leading-none',
  code: 'text-sm font-mono',
};

const colorMap: Record<string, string> = {
  primary: 'var(--ds-text-primary)',
  secondary: 'var(--ds-text-secondary)',
  tertiary: 'var(--ds-text-tertiary)',
  success: 'var(--ds-success)',
  error: 'var(--ds-error)',
};

const weightMap: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  children,
  className = '',
  as,
}: TextProps) {
  const Tag = as || (variant === 'code' ? 'code' : variant === 'label' ? 'label' : 'p');

  const isCode = variant === 'code';
  const codeStyle: React.CSSProperties = isCode
    ? {
        fontFamily: 'var(--ds-font-mono)',
        background: 'var(--ds-bg-glass)',
        padding: '0.125rem 0.375rem',
        borderRadius: 'var(--ds-radius-sm)',
        border: '1px solid var(--ds-border-default)',
      }
    : {};

  return (
    <Tag
      className={[
        variantStyles[variant],
        weight ? weightMap[weight] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        color: colorMap[color],
        ...codeStyle,
      }}
    >
      {children}
    </Tag>
  );
}

export default Text;
