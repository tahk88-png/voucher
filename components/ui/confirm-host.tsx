'use client';

import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useConfirmStore } from '@/lib/confirm-helpers';

/**
 * Single global mount for the imperative confirm dialog. Rendered once in the
 * root layout (next to <Toaster />); every showConfirm() call drives this
 * instance. Keeps confirmations as a persistent modal rather than an
 * auto-dismissing toast.
 */
export function ConfirmHost() {
  const { state, close, runConfirm } = useConfirmStore();

  return (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={runConfirm}
    />
  );
}
