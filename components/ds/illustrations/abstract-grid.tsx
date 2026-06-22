'use client';

interface AbstractGridProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function AbstractGrid({ width = 300, height = 200, className = '' }: AbstractGridProps) {
  const cols = 15;
  const rows = 10;
  const spacingX = 20;
  const spacingY = 20;

  // Highlighted cluster centers
  const clusters = [
    { cx: 5, cy: 3, r: 2.5 },
    { cx: 10, cy: 6, r: 2 },
    { cx: 3, cy: 7, r: 1.8 },
  ];

  function getIntensity(col: number, row: number): number {
    let maxIntensity = 0;
    for (const cluster of clusters) {
      const dist = Math.sqrt(
        Math.pow(col - cluster.cx, 2) + Math.pow(row - cluster.cy, 2)
      );
      const intensity = Math.max(0, 1 - dist / cluster.r);
      maxIntensity = Math.max(maxIntensity, intensity);
    }
    return maxIntensity;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ag-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cc785c" />
          <stop offset="100%" stopColor="#5e7e92" />
        </linearGradient>
        <radialGradient id="ag-glow-1" cx="33%" cy="30%" r="25%">
          <stop offset="0%" stopColor="#cc785c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#cc785c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ag-glow-2" cx="67%" cy="60%" r="20%">
          <stop offset="0%" stopColor="#5e7e92" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#5e7e92" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ag-glow-3" cx="20%" cy="70%" r="18%">
          <stop offset="0%" stopColor="#cc785c" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#cc785c" stopOpacity="0" />
        </radialGradient>
        <filter id="ag-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Background glow layers */}
      <rect width="300" height="200" fill="url(#ag-glow-1)" />
      <rect width="300" height="200" fill="url(#ag-glow-2)" />
      <rect width="300" height="200" fill="url(#ag-glow-3)" />

      {/* Grid dots */}
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const x = col * spacingX + 10;
          const y = row * spacingY + 10;
          const intensity = getIntensity(col, row);
          const baseOpacity = 0.08;
          const highlightOpacity = intensity * 0.6;
          const dotOpacity = baseOpacity + highlightOpacity;
          const dotR = 1 + intensity * 1.5;

          return (
            <g key={`${row}-${col}`}>
              {intensity > 0.3 && (
                <circle
                  cx={x}
                  cy={y}
                  r={dotR * 4}
                  fill="url(#ag-grad)"
                  opacity={intensity * 0.06}
                  filter="url(#ag-blur)"
                >
                  <animate
                    attributeName="opacity"
                    values={`${intensity * 0.03};${intensity * 0.08};${intensity * 0.03}`}
                    dur={`${3 + (col + row) * 0.1}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={dotR}
                fill={intensity > 0.2 ? 'url(#ag-grad)' : 'white'}
                opacity={dotOpacity}
              >
                {intensity > 0.4 && (
                  <animate
                    attributeName="opacity"
                    values={`${dotOpacity * 0.7};${dotOpacity};${dotOpacity * 0.7}`}
                    dur={`${2 + (col * row) % 3}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </g>
          );
        })
      )}

      {/* Connection lines between highlighted nodes */}
      {[
        [90, 50, 110, 70],
        [110, 70, 130, 50],
        [130, 50, 110, 50],
        [190, 110, 210, 130],
        [210, 130, 210, 110],
        [50, 130, 70, 150],
        [70, 150, 70, 130],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={`conn-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#ag-grad)"
          strokeWidth="0.5"
          opacity="0.2"
        >
          <animate
            attributeName="opacity"
            values="0.1;0.3;0.1"
            dur={`${3 + i * 0.5}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  );
}
