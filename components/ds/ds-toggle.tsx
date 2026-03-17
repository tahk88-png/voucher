'use client';

import React, { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';

/* ─── Types ─── */
export type DsToggleSize = 'sm' | 'md' | 'lg';

export interface DsToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: DsToggleSize;
  label?: string;
  labelPosition?: 'left' | 'right';
  onColor?: string;
  offColor?: string;
  className?: string;
}

/* ─── Size config ─── */
const sizeConfig: Record<DsToggleSize, {
  track: { width: number; height: number };
  dot: number;
  translate: number;
}> = {
  sm: { track: { width: 32, height: 18 }, dot: 14, translate: 14 },
  md: { track: { width: 44, height: 24 }, dot: 20, translate: 20 },
  lg: { track: { width: 56, height: 32 }, dot: 24, translate: 24 },
};

/* ─── Component ─── */
export const DsToggle = forwardRef<HTMLInputElement, DsToggleProps>(
  (
    {
      size = 'md',
      label,
      labelPosition = 'right',
      onColor,
      offColor,
      disabled,
      checked: controlledChecked,
      defaultChecked,
      onChange,
      className = '',
      id: externalId,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId || autoId;
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

    const cfg = sizeConfig[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (controlledChecked === undefined) setInternalChecked(e.target.checked);
      onChange?.(e);
    };

    const trackStyle: React.CSSProperties = {
      width: cfg.track.width,
      height: cfg.track.height,
      backgroundColor: isChecked
        ? (onColor || 'var(--primary)')
        : (offColor || 'var(--surface-dim)'),
      borderRadius: 9999,
      transition: 'background-color 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      position: 'relative',
      flexShrink: 0,
    };

    const dotStyle: React.CSSProperties = {
      width: cfg.dot,
      height: cfg.dot,
      borderRadius: 9999,
      backgroundColor: isChecked ? 'var(--primary-foreground)' : 'var(--text-faint)',
      position: 'absolute',
      top: '50%',
      left: 2,
      transform: isChecked
        ? `translateY(-50%) translateX(${cfg.translate}px)`
        : 'translateY(-50%) translateX(0px)',
      transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    };

    return (
      <div
        className={[
          'ds-toggle inline-flex items-center gap-2.5',
          disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
          className,
        ].join(' ')}
      >
        {label && labelPosition === 'left' && (
          <label htmlFor={inputId} className="text-sm text-[var(--text)] cursor-pointer select-none">
            {label}
          </label>
        )}

        <label htmlFor={inputId} className="relative inline-flex cursor-pointer">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={controlledChecked}
            defaultChecked={controlledChecked === undefined ? defaultChecked : undefined}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />

          {/* Track */}
          <span
            style={trackStyle}
            className="peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg)]"
          >
            {/* Dot */}
            <span style={dotStyle} />
          </span>
        </label>

        {label && labelPosition === 'right' && (
          <label htmlFor={inputId} className="text-sm text-[var(--text)] cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    );
  },
);

DsToggle.displayName = 'DsToggle';
export default DsToggle;
