import { AIInsight } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, Lightbulb, Info } from 'lucide-react';

interface AIInsightCardProps {
  insight: AIInsight;
  onAction?: (actionValue: string) => void;
}

export function AIInsightCard({ insight, onAction }: AIInsightCardProps) {
  const iconMap = {
    warning: AlertTriangle,
    suggestion: Lightbulb,
    info: Info,
  };

  const colorMap = {
    warning: 'border-amber-200 bg-amber-50',
    suggestion: 'border-blue-200 bg-blue-50',
    info: 'border-gray-200 bg-gray-50',
  };

  const Icon = iconMap[insight.type];

  return (
    <Card className={`${colorMap[insight.type]} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 text-foreground/70" />
          <div className="flex-1 space-y-1">
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
            <CardDescription className="text-sm">{insight.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {insight.action && (
        <CardContent className="pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction?.(insight.action!.value)}
            className="bg-white"
          >
            {insight.action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
