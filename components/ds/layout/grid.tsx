import React, { type ReactNode } from 'react';

export type ResponsiveCols = {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

export interface GridProps {
  cols?: number | ResponsiveCols;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  masonry?: boolean;
  children: ReactNode;
  className?: string;
}

const gapMap = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

const colsClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const smColsClasses: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
};

const mdColsClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

const lgColsClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

const xlColsClasses: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

const masonryGapMap = {
  none: '0',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;

function clamp(n: number): number {
  return Math.max(1, Math.min(6, n));
}

export function Grid({
  cols = 1,
  gap = 'md',
  masonry = false,
  children,
  className = '',
}: GridProps) {
  if (masonry) {
    const responsive = typeof cols === 'object' ? cols : { sm: 1, md: cols, lg: cols };
    const gapVal = masonryGapMap[gap];
    return (
      <div
        className={`[column-gap:var(--mg)] ${className}`}
        style={
          {
            '--mg': gapVal,
            columnCount: responsive.sm ?? 1,
            ...(responsive.md ? {} : {}),
          } as React.CSSProperties
        }
      >
        <style>{`
          @media (min-width: 640px) { .ds-masonry-grid { column-count: ${responsive.sm ?? 1}; } }
          @media (min-width: 768px) { .ds-masonry-grid { column-count: ${responsive.md ?? 2}; } }
          @media (min-width: 1024px) { .ds-masonry-grid { column-count: ${responsive.lg ?? 3}; } }
          @media (min-width: 1280px) { .ds-masonry-grid { column-count: ${responsive.xl ?? responsive.lg ?? 3}; } }
        `}</style>
        <div
          className={`ds-masonry-grid [&>*]:break-inside-avoid [&>*]:mb-[var(--mg)]`}
          style={{ '--mg': gapVal, columnGap: gapVal } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    );
  }

  if (typeof cols === 'number') {
    const c = clamp(cols);
    return (
      <div className={`grid ${colsClasses[c]} ${gapMap[gap]} ${className}`}>
        {children}
      </div>
    );
  }

  const classes = [
    'grid grid-cols-1',
    cols.sm ? smColsClasses[clamp(cols.sm)] : '',
    cols.md ? mdColsClasses[clamp(cols.md)] : '',
    cols.lg ? lgColsClasses[clamp(cols.lg)] : '',
    cols.xl ? xlColsClasses[clamp(cols.xl)] : '',
    gapMap[gap],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}

export default Grid;
