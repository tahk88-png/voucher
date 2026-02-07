'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { Download } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast-helpers';

interface QRDownloadProps {
  qrCodeDataUrl: string;
  filename?: string;
}

export default function QRDownload({ qrCodeDataUrl, filename = 'voucher-qr' }: QRDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('QR code downloaded successfully!');
    } catch (error) {
      showError('Failed to download QR code');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <WarmButton
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading || !qrCodeDataUrl}
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? 'Downloading...' : 'Download QR'}
    </WarmButton>
  );
}
