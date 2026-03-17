'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';

/* ─── Types ─── */
export interface DsSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DsSelectProps {
  options: DsSelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

/* ─── Component ─── */
export function DsSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  searchable = false,
  multiple = false,
  disabled = false,
  loading = false,
  emptyText = 'No options found',
  className = '',
}: DsSelectProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  /* Normalise value to array */
  const selected: string[] = Array.isArray(value) ? value : value ? [value] : [];

  /* Filtered options */
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  /* Selection helpers */
  const toggleOption = useCallback(
    (val: string) => {
      if (multiple) {
        const next = selected.includes(val)
          ? selected.filter((v) => v !== val)
          : [...selected, val];
        onChange?.(next);
      } else {
        onChange?.(val);
        setOpen(false);
        setSearch('');
      }
    },
    [multiple, onChange, selected],
  );

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(selected.filter((v) => v !== val));
  };

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Auto-focus search when opening */
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  /* Reset highlight when filter changes */
  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  /* Scroll highlighted into view */
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  /* Keyboard nav */
  const handleKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIdx] && !filtered[highlightIdx].disabled) {
          toggleOption(filtered[highlightIdx].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSearch('');
        break;
    }
  };

  /* Display label */
  const displayLabel =
    selected.length === 0
      ? null
      : multiple
        ? null /* chips shown instead */
        : options.find((o) => o.value === selected[0])?.label;

  return (
    <div
      ref={containerRef}
      className={`ds-select relative ${className}`}
      onKeyDown={handleKey}
    >
      {label && (
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={[
          'w-full min-h-[2.5rem] flex items-center gap-2 px-3 py-1.5',
          'bg-[var(--glass-bg)] backdrop-blur-lg',
          'border rounded-md transition-all duration-fast ease-smooth',
          'text-left text-sm',
          error
            ? 'border-[var(--danger)]'
            : open
              ? 'border-[var(--primary)] shadow-[0_0_0_3px_var(--ring)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="flex-1 flex flex-wrap gap-1 items-center min-w-0">
          {multiple && selected.length > 0
            ? selected.map((val) => {
                const opt = options.find((o) => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-full px-2 py-0.5"
                  >
                    {opt?.label}
                    <button
                      type="button"
                      onClick={(e) => removeChip(val, e)}
                      className="hover:text-[var(--danger)] transition-colors"
                      aria-label={`Remove ${opt?.label}`}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                );
              })
            : displayLabel
              ? <span className="text-[var(--text)] truncate">{displayLabel}</span>
              : <span className="text-[var(--text-faint)]">{placeholder}</span>}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-[var(--text-faint)] transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={[
          'absolute z-50 left-0 right-0 mt-1',
          'bg-[var(--glass-bg)] backdrop-blur-xl',
          'border border-[var(--glass-border)] rounded-md shadow-lg',
          'transition-all duration-fast ease-spring origin-top',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
        ].join(' ')}
      >
        {/* Search */}
        {searchable && (
          <div className="p-2 border-b border-[var(--border)]">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[var(--surface-dim)] rounded-sm px-2.5 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <svg className="w-5 h-5 animate-spin text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Options */}
        {!loading && (
          <ul
            ref={listRef}
            role="listbox"
            aria-multiselectable={multiple}
            className="max-h-60 overflow-y-auto py-1 scrollbar-thin"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-center text-[var(--text-faint)]">{emptyText}</li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = selected.includes(opt.value);
                const isHighlighted = idx === highlightIdx;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => !opt.disabled && toggleOption(opt.value)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={[
                      'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors duration-fast',
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : '',
                      isHighlighted ? 'bg-[var(--surface-muted)]' : '',
                      isSelected ? 'text-[var(--primary)] font-medium' : 'text-[var(--text)]',
                    ].join(' ')}
                  >
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-[var(--danger)] mt-1 animate-enter-fade">{error}</p>}
    </div>
  );
}

export default DsSelect;
