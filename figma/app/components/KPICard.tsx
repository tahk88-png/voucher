import { Card, CardContent, CardHeader, CardTitle } from '@app/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
}

export function KPICard({ title, value, icon: Icon, change, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change && (
          <p className={`text-xs mt-1 ${change.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {change.positive ? '+' : ''}{change.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
