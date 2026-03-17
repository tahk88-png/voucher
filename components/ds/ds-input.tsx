'use client';

import React, {
  forwardRef,
  useState,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

/* ─── Types ─── */
export type DsInputSize = 'sm' | 'md' | 'lg';
export type DsInputVariant = 'default' | 'glass';

export interface DsInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: DsInputVariant;
  inputSize?: DsInputSize;
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  addonLeft?: string;
  addonRight?: string;
  showCount?: boolean;
  className?: string;
}

/* ─── Size maps ─── */
const sizeClasses: Record<DsInputSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-3.5',
  lg: 'h-12 text-base px-4',
};

const labelSizes: Record<DsInputSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

/* ─── Component ─── */
export const DsInput = forwardRef<HTMLInputElement, DsInputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      label,
      error,
      helperText,
      iconLeft,
      iconRight,
      addonLeft,
      addonRight,
      showCount = false,
      maxLength,
      className = '',
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      disabled,
      id: externalId,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = externalId || autoId;
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '');

    const currentValue = value !== undefined ? String(value) : internalValue;
    const hasValue = currentValue.length > 0;
    const isFloating = focused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const baseBg =
      variant === 'glass'
        ? 'bg-[var(--glass-bg)] backdrop-blur-lg'
        : 'bg-[var(--surface)]';

    const borderColor = error
      ? 'border-[var(--danger)] shadow-[var(--shadow-danger)]'
      : focused
        ? 'border-[var(--primary)] shadow-[0_0_0_3px_var(--ring)]'
        : 'border-[var(--border)] hover:border-[var(--border-strong)]';

    return (
      <div className={`ds-input-root flex flex-col gap-1 ${className}`}>
        <div className="relative flex items-stretch">
          {/* Left addon */}
          {addonLeft && (
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-[var(--border)] bg-[var(--surface-dim)] px-3 text-sm text-[var(--text-muted)]">
              {addonLeft}
            </span>
          )}

          <div
            className={[
              'relative flex-1 flex items-center',
              baseBg,
              'border transition-all duration-fast ease-smooth',
              borderColor,
              addonLeft && !addonRight ? 'rounded-r-md' : '',
              addonRight && !addonLeft ? 'rounded-l-md' : '',
              addonLeft && addonRight ? '' : '',
              !addonLeft && !addonRight ? 'rounded-md' : '',
              disabled ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            {/* Left icon */}
            {iconLeft && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none">
                {iconLeft}
              </span>
            )}

            {/* Floating label */}
            {label && (
              <label
                htmlFor={inputId}
                className={[
                  'absolute left-3.5 transition-all duration-fast ease-smooth pointer-events-none',
                  iconLeft ? 'left-9' : '',
                  isFloating
                    ? `${labelSizes[inputSize]} -top-2.5 px-1 bg-[var(--surface)] text-[var(--primary)]`
                    : `${sizeClasses[inputSize].includes('text-sm') ? 'text-sm' : 'text-base'} top-1/2 -translate-y-1/2 text-[var(--text-faint)]`,
                  error && isFloating ? 'text-[var(--danger)]' : '',
                ].join(' ')}
              >
                {label}
              </label>
            )}

            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              maxLength={maxLength}
              value={value}
              defaultValue={value === undefined ? defaultValue : undefined}
              onChange={handleChange}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                onBlur?.(e);
              }}
              className={[
                'w-full bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-faint)]',
                sizeClasses[inputSize],
                iconLeft ? 'pl-9' : '',
                iconRight || showCount ? 'pr-9' : '',
                label ? 'pt-2' : '',
              ].join(' ')}
              {...props}
            />

            {/* Right icon */}
            {iconRight && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
                {iconRight}
              </span>
            )}
          </div>

          {/* Right addon */}
          {addonRight && (
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-[var(--border)] bg-[var(--surface-dim)] px-3 text-sm text-[var(--text-muted)]">
              {addonRight}
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between px-1">
          {error && (
            <p className="text-xs text-[var(--danger)] animate-enter-fade">{error}</p>
          )}
          {!error && helperText && (
            <p className="text-xs text-[var(--text-faint)]">{helperText}</p>
          )}
          {showCount && maxLength && (
            <p className="text-xs text-[var(--text-faint)] ml-auto tabular-nums">
              {currentValue.length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

DsInput.displayName = 'DsInput';
export default DsInput;
