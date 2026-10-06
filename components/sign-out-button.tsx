'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';
import { cn } from '@/lib/utils';

type SignOutButtonProps = {
  /** Render as a WarmButton with this variant; omit for a plain button styled by `className`. */
  variant?: 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  /** Hide the text label (collapsed sidebar). The label stays available to screen readers. */
  iconOnly?: boolean;
  showIcon?: boolean;
};

/**
 * Signs the user out through Auth.js (POST with CSRF) and returns them to the
 * home page, instead of linking to the raw /api/auth/signout confirmation page.
 * A button, not a <Link>, so nothing is prefetched on every page view.
 */
export function SignOutButton({
  variant,
  size = 'sm',
  fullWidth,
  className,
  iconOnly = false,
  showIcon = true,
}: SignOutButtonProps) {
  const tNav = useTranslations('nav');
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await signOut({ redirectTo: '/' });
    } catch (error) {
      console.error('Sign-out failed', error);
      showError(tNav('logoutFailed'));
      setPending(false);
    }
  }

  const label = tNav('logout');
  const content = (
    <>
      {showIcon && <LogOut className={cn('h-4 w-4 shrink-0', !iconOnly && 'mr-2')} aria-hidden="true" />}
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </>
  );

  if (variant) {
    return (
      <WarmButton
        type="button"
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        title={iconOnly ? label : undefined}
      >
        {content}
      </WarmButton>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className={cn('disabled:opacity-60', className)}
      title={iconOnly ? label : undefined}
    >
      {content}
    </button>
  );
}
