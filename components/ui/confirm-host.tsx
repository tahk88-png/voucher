'use client';

import { useTranslations } from 'next-intl';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useConfirmStore } from '@/lib/confirm-helpers';

/**
 * Single global mount for the imperative confirm dialog. Rendered once in the
 * root layout (next to <Toaster />); every showConfirm() call drives this
 * instance. Keeps confirmations as a persistent modal rather than an
 * auto-dismissing toast.
 */
export function ConfirmHost() {
  const t = useTranslations('ui');
  const { state, close, runConfirm } = useConfirmStore();

  // lib/confirm-helpers fills in the English defaults 'Confirm' / 'Cancel' when a
  // caller passes none; show those defaults in the viewer's language.
  const confirmText = t('confirmDialog.confirm');
  const cancelText = t('confirmDialog.cancel');
  const localizeDefault = (value: string, english: string, translated: string) =>
    value === english ? translated : value;

  return (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={localizeDefault(state.title, 'Confirm', confirmText)}
      description={state.description}
      confirmLabel={localizeDefault(state.confirmLabel, 'Confirm', confirmText)}
      cancelLabel={localizeDefault(state.cancelLabel, 'Cancel', cancelText)}
      variant={state.variant}
      onConfirm={runConfirm}
    />
  );
}
