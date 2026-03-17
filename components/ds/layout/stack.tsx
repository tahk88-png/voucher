import React, { type ReactNode } from 'react';

export interface StackProps {
  direction?: 'horizontal' | 'vertical';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  responsive?: boolean;
  children: ReactNode;
  className?: string;
}

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const;

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const;

export function Stack({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive = false,
  children,
  className = '',
}: StackProps) {
  const dirClass =
    direction === 'horizontal'
      ? responsive
        ? 'flex-col sm:flex-row'
        : 'flex-row'
      : responsive
        ? 'flex-row sm:flex-col'
        : 'flex-col';

  return (
    <div
      className={[
        'flex',
        dirClass,
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        wrap ? 'flex-wrap' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default Stack;
