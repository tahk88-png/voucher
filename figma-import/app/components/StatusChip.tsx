import { VoucherStatus } from '@/app/types';
import { Badge } from '@/app/components/ui/badge';

interface StatusChipProps {
  status: VoucherStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const variants = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
    paused: { label: 'Paused', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  };

  const variant = variants[status];

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}
