'use client';

/**
 * Visual funnel chart with tapered bars.
 *
 * Shows count + conversion % at each stage, color-coded.
 */

interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
  overallRate: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">
        No funnel data available
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const widthPercent = Math.max((stage.count / maxCount) * 100, 8); // minimum 8% width for visibility

        return (
          <div key={stage.name} className="flex items-center gap-3">
            {/* Stage label */}
            <div className="w-28 shrink-0 text-right">
              <span className="text-sm font-medium text-[var(--text)]">{stage.name}</span>
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className="w-full bg-[var(--surface-dim)] rounded-lg h-10 overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center justify-between px-3 transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color,
                    opacity: 0.85,
                  }}
                >
                  <span className="text-white text-sm font-bold whitespace-nowrap">
                    {stage.count.toLocaleString()}
                  </span>
                  {widthPercent > 25 && (
                    <span className="text-white/80 text-xs whitespace-nowrap">
                      {stage.overallRate}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion indicator */}
            <div className="w-20 shrink-0 text-right">
              {idx === 0 ? (
                <span className="text-xs text-[var(--text-muted)]">Top</span>
              ) : (
                <div>
                  <span
                    className={`text-sm font-semibold ${
                      stage.conversionRate >= 50
                        ? 'text-green-600'
                        : stage.conversionRate >= 20
                        ? 'text-yellow-600'
                        : 'text-red-500'
                    }`}
                  >
                    {stage.conversionRate}%
                  </span>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    -{stage.dropOffRate}% drop
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
