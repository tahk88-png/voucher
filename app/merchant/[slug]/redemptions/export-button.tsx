'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { showSuccess, showError } from '@/lib/toast-helpers';

export default function ExportRedemptionsButton({ merchantSlug }: { merchantSlug: string }) {
  const t = useTranslations('merchantStore.redemptions.export');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/redemptions?merchantSlug=${merchantSlug}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `redemptions-${merchantSlug}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(t('success'));
    } catch (error) {
      showError(t('error'));
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <WarmButton variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? t('exporting') : t('button')}
    </WarmButton>
  );
}
