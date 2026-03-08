interface CashbackBadgeProps {
  creditPercentage: number; // basis points
  currency?: string;
}

export function CashbackBadge({ creditPercentage, currency = 'EUR' }: CashbackBadgeProps) {
  if (!creditPercentage || creditPercentage <= 0) return null;
  const percent = (creditPercentage / 100).toFixed(0);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '9999px',
      padding: '0.2rem 0.6rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#16a34a',
    }}>
      {percent}% cashback
    </span>
  );
}
