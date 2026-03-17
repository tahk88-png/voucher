'use client';

import React, { type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Premium CSS Grid layout with named areas
   Responsive: 1 col mobile -> 2 col tablet -> 3-4 col desktop
   ═══════════════════════════════════════════════════════════════ */

export type DashboardTemplate = 'default' | 'analytics' | 'overview';

export interface DashboardLayoutProps {
  children: ReactNode;
  /** Layout template */
  template?: DashboardTemplate;
  /** Additional CSS classes */
  className?: string;
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

export interface DashboardAreaProps {
  children: ReactNode;
  /** Grid area name */
  area: 'metrics' | 'chart1' | 'chart2' | 'details' | 'feed' | 'sidebar' | string;
  /** Additional CSS classes */
  className?: string;
}

const gapMap = { sm: '12px', md: '20px', lg: '28px' };

/*
  Template grid definitions:
  - default:   4-col metrics row, 2 large charts, table + feed
  - analytics: 4-col metrics, 1 wide chart + sidebar, table
  - overview:  3-col metrics, 2 charts side-by-side, sidebar + details
*/

const templates: Record<DashboardTemplate, { areas: string; cols: string; rows: string }> = {
  default: {
    areas: `
      "metrics metrics metrics metrics"
      "chart1  chart1  chart2  chart2"
      "details details feed    feed"
    `,
    cols: 'repeat(4, 1fr)',
    rows: 'auto auto auto',
  },
  analytics: {
    areas: `
      "metrics metrics metrics metrics"
      "chart1  chart1  chart1  sidebar"
      "details details details sidebar"
    `,
    cols: 'repeat(4, 1fr)',
    rows: 'auto 1fr auto',
  },
  overview: {
    areas: `
      "metrics metrics metrics"
      "chart1  chart2  sidebar"
      "details details sidebar"
    `,
    cols: 'repeat(3, 1fr)',
    rows: 'auto 1fr auto',
  },
};

export function DashboardLayout({
  children,
  template = 'default',
  className = '',
  gap = 'md',
}: DashboardLayoutProps) {
  const tmpl = templates[template];

  return (
    <div
      className={`ds-dashboard-layout ${className}`}
      style={{
        display: 'grid',
        gap: gapMap[gap],
        gridTemplateAreas: tmpl.areas,
        gridTemplateColumns: tmpl.cols,
        gridTemplateRows: tmpl.rows,
        minHeight: 0,
        transition: 'gap var(--ds-duration-slow, 400ms) var(--ds-ease-default)',
      }}
    >
      {children}

      <style jsx>{`
        /* Tablet: 2 columns */
        @media (max-width: 1024px) {
          .ds-dashboard-layout {
            grid-template-areas:
              "metrics metrics"
              "chart1  chart2"
              "details feed"
              "sidebar sidebar" !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto auto auto auto !important;
          }
        }
        /* Mobile: 1 column */
        @media (max-width: 640px) {
          .ds-dashboard-layout {
            grid-template-areas:
              "metrics"
              "chart1"
              "chart2"
              "details"
              "feed"
              "sidebar" !important;
            grid-template-columns: 1fr !important;
            grid-template-rows: repeat(6, auto) !important;
          }
        }
      `}</style>
    </div>
  );
}

export function DashboardArea({ children, area, className = '' }: DashboardAreaProps) {
  return (
    <div
      className={className}
      style={{ gridArea: area, minWidth: 0, minHeight: 0 }}
    >
      {children}
    </div>
  );
}

export default DashboardLayout;
