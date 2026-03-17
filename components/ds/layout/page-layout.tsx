'use client';

import React, { useState, useCallback, useEffect, type ReactNode } from 'react';

export interface PageLayoutProps {
  sidebar?: boolean;
  header?: ReactNode;
  children: ReactNode;
}

export function PageLayout({ sidebar = false, header, children }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--ds-bg-base)' }}
    >
      {/* Gradient mesh background */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'var(--ds-gradient-mesh)' }}
        aria-hidden
      />

      {/* Header */}
      {header && (
        <header
          className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 backdrop-blur-xl border-b"
          style={{
            background: 'var(--ds-bg-glass)',
            borderColor: 'var(--ds-border-default)',
          }}
        >
          {sidebar && (
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors"
              style={{ color: 'var(--ds-text-secondary)' }}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <div className="flex-1">{header}</div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile backdrop */}
            {isMobile && sidebarOpen && (
              <div
                className="fixed inset-0 z-40 transition-opacity duration-300"
                style={{ background: 'var(--ds-bg-overlay)' }}
                onClick={closeSidebar}
                aria-hidden
              />
            )}

            <aside
              className={[
                'shrink-0 overflow-y-auto border-r transition-all',
                isMobile
                  ? 'fixed top-0 left-0 z-50 h-full'
                  : 'sticky top-14 h-[calc(100vh-3.5rem)]',
                sidebarOpen ? 'w-[280px]' : isMobile ? 'w-0 -translate-x-full' : 'w-0',
              ].join(' ')}
              style={{
                background: 'var(--ds-bg-surface)',
                borderColor: 'var(--ds-border-default)',
                transitionDuration: 'var(--ds-duration-normal)',
                transitionTimingFunction: 'var(--ds-ease-default)',
              }}
            >
              <div
                className={[
                  'w-[280px] p-4 transition-opacity',
                  sidebarOpen ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
                style={{
                  transitionDuration: 'var(--ds-duration-fast)',
                }}
              />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PageLayout;
