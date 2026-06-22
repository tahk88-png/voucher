'use client';

/**
 * Simple SVG line chart component — no chart library needed.
 *
 * Renders a smooth line with an optional fill gradient beneath it.
 */

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  width?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
}

export function TrendChart({
  data,
  height = 120,
  width: propWidth,
  color = '#cc785c',
  showLabels = false,
  showGrid = false,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const width = propWidth ?? 400;
  const padding = showLabels ? { top: 10, right: 10, bottom: 30, left: 50 } : { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Map data to coordinates
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
  }));

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill path (close at bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartHeight} L ${points[0].x.toFixed(1)} ${padding.top + chartHeight} Z`;

  const gradientId = `grad-${color.replace('#', '')}`;

  // Grid lines
  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = padding.top + chartHeight * (1 - pct);
    const label = (minVal + range * pct).toFixed(0);
    return { y, label };
  }) : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {showGrid && gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={padding.left + chartWidth}
            y2={line.y}
            stroke="var(--border, #e5e7eb)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {showLabels && (
            <text
              x={padding.left - 6}
              y={line.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted, #9ca3af)"
            >
              {line.label}
            </text>
          )}
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.length <= 31 && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2.5"
          fill="white"
          stroke={color}
          strokeWidth="1.5"
        />
      ))}

      {/* X-axis labels */}
      {showLabels && data.length <= 14 && data.map((d, i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 5}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted, #9ca3af)"
        >
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}
