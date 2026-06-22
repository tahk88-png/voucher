'use client';

import * as React from 'react';

/**
 * Imperative confirmation dialog.
 *
 * `showConfirm(message, onConfirm, options?)` opens a PERSISTENT modal
 * (backed by ConfirmationDialog / Radix Dialog) and runs `onConfirm` only
 * when the user explicitly confirms. This replaces the earlier toast-based
 * implementation, whose action button auto-dismissed after ~5s and could
 * silently drop a destructive action (revoke key, disconnect payouts, delete)
 * if the user didn't click in time.
 *
 * The store lives at module scope and is consumed by a single mounted
 * <ConfirmHost /> (see components/ui/confirm-host.tsx, rendered in the root
 * layout next to <Toaster />). This mirrors the use-toast.ts pattern so
 * callers can fire confirmations imperatively from event handlers without
 * threading a hook through every component.
 */

export type ConfirmVariant = 'default' | 'destructive' | 'warning';

export interface ConfirmOptions {
  title?: string;
  /** Overrides the body text (defaults to the `message` argument). */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
  onConfirm: (() => void | Promise<void>) | null;
}

const initialState: ConfirmState = {
  open: false,
  title: 'Confirm',
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  onConfirm: null,
};

let memoryState: ConfirmState = initialState;
const listeners = new Set<(s: ConfirmState) => void>();

function setState(patch: Partial<ConfirmState>) {
  memoryState = { ...memoryState, ...patch };
  listeners.forEach((l) => l(memoryState));
}

/**
 * Open the confirmation modal. Backwards-compatible signature:
 *   showConfirm(message, onConfirm, { title?, confirmLabel?, ... })
 */
export function showConfirm(
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmOptions,
) {
  setState({
    open: true,
    title: options?.title ?? 'Confirm',
    description: options?.description ?? message,
    confirmLabel: options?.confirmLabel ?? 'Confirm',
    cancelLabel: options?.cancelLabel ?? 'Cancel',
    variant: options?.variant ?? 'default',
    onConfirm,
  });
}

/**
 * Subscribe to confirm-dialog state. Used only by <ConfirmHost />.
 * `runConfirm` invokes the stored action and is awaited by the dialog so it
 * can show its processing spinner; `close` resets state on cancel/dismiss.
 */
export function useConfirmStore() {
  const [state, set] = React.useState<ConfirmState>(memoryState);

  React.useEffect(() => {
    listeners.add(set);
    set(memoryState);
    return () => {
      listeners.delete(set);
    };
  }, []);

  const close = React.useCallback(() => {
    setState({ open: false, onConfirm: null });
  }, []);

  const runConfirm = React.useCallback(async () => {
    await memoryState.onConfirm?.();
    // ConfirmationDialog closes itself via onOpenChange(false) after this
    // resolves; clear the stale callback so it can't be re-run.
    setState({ onConfirm: null });
  }, []);

  return { state, close, runConfirm };
}
