'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

/* ─── Types ─── */
export interface DsSidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: DsSidebarItem[];
  disabled?: boolean;
}

export interface DsSidebarSection {
  title?: string;
  items: DsSidebarItem[];
}

export interface DsSidebarProps {
  sections: DsSidebarSection[];
  activeId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/* ─── Context for collapse state ─── */
const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

/* ─── Nested Item ─── */
function SidebarItem({
  item,
  activeId,
  depth = 0,
}: {
  item: DsSidebarItem;
  activeId?: string;
  depth?: number;
}) {
  const { collapsed } = useContext(SidebarContext);
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.id === activeId;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded((v) => !v);
    }
    item.onClick?.();
  };

  const Tag = item.href ? 'a' : 'button';
  const tagProps = item.href ? { href: item.href } : { type: 'button' as const };

  return (
    <li>
      <Tag
        {...tagProps}
        onClick={handleClick}
        disabled={item.disabled}
        title={collapsed ? item.label : undefined}
        className={[
          'group relative w-full flex items-center gap-3 rounded-md text-sm font-medium',
          'transition-all duration-fast ease-smooth',
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
          depth > 0 && !collapsed ? 'pl-10' : '',
          isActive
            ? 'bg-[var(--primary)]/12 text-[var(--primary)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
          item.disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-[var(--gradient-brand-from)] to-[var(--gradient-brand-to)]" />
        )}

        {/* Icon */}
        {item.icon && (
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            {item.icon}
          </span>
        )}

        {/* Label */}
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>

            {/* Badge */}
            {item.badge !== undefined && (
              <span className="ml-auto text-[10px] font-bold bg-[var(--primary)]/15 text-[var(--primary)] rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {item.badge}
              </span>
            )}

            {/* Expand arrow */}
            {hasChildren && (
              <svg
                className={`w-4 h-4 text-[var(--text-faint)] transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </>
        )}
      </Tag>

      {/* Children */}
      {hasChildren && expanded && !collapsed && (
        <ul className="mt-0.5">
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} activeId={activeId} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─── Main Sidebar ─── */
export function DsSidebar({
  sections,
  activeId,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  header,
  footer,
  className = '',
}: DsSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    const next = !collapsed;
    if (controlledCollapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }, [collapsed, controlledCollapsed, onCollapsedChange]);

  /* Close mobile drawer on route change / escape */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  const sidebarContent = (
    <SidebarContext.Provider value={{ collapsed }}>
      <nav
        className={[
          'ds-sidebar flex flex-col h-full',
          'bg-[var(--glass-bg)] backdrop-blur-xl',
          'border-r border-[var(--glass-border)]',
          'transition-[width] duration-200 ease-smooth',
          collapsed ? 'w-[68px]' : 'w-[280px]',
          className,
        ].join(' ')}
      >
        {/* Header */}
        {header && (
          <div className={`flex-shrink-0 px-4 py-4 border-b border-[var(--border)] ${collapsed ? 'px-2' : ''}`}>
            {header}
          </div>
        )}

        {/* Collapse toggle */}
        <div className={`flex-shrink-0 px-3 py-2 ${collapsed ? 'px-2' : ''}`}>
          <button
            type="button"
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-md text-[var(--text-faint)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16"
              fill="none"
            >
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 space-y-4 scrollbar-thin">
          {sections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <hr className="border-[var(--border)] my-2" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem key={item.id} item={item} activeId={activeId} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`flex-shrink-0 px-3 py-3 border-t border-[var(--border)] ${collapsed ? 'px-2' : ''}`}>
            {footer}
          </div>
        )}
      </nav>
    </SidebarContext.Provider>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">{sidebarContent}</div>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[9998] p-2 rounded-md bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--glass-border)] shadow-md"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-[var(--text)]" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[9999]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[280px] animate-enter-fade">
            <SidebarContext.Provider value={{ collapsed: false }}>
              <nav className="flex flex-col h-full bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--glass-border)]">
                {/* Close */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  {header || <span />}
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text)]"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-3 space-y-4">
                  {sections.map((section, si) => (
                    <div key={si}>
                      {section.title && (
                        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                          {section.title}
                        </p>
                      )}
                      <ul className="space-y-0.5">
                        {section.items.map((item) => (
                          <SidebarItem key={item.id} item={item} activeId={activeId} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {footer && (
                  <div className="flex-shrink-0 px-3 py-3 border-t border-[var(--border)]">
                    {footer}
                  </div>
                )}
              </nav>
            </SidebarContext.Provider>
          </div>
        </div>
      )}
    </>
  );
}

export default DsSidebar;
