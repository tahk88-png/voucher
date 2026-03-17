'use client';

interface DataFlowProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function DataFlow({ width = 320, height = 200, className = '' }: DataFlowProps) {
  const nodes = [
    { x: 40, y: 100, label: 'src' },
    { x: 110, y: 50, label: 'proc' },
    { x: 110, y: 150, label: 'proc' },
    { x: 190, y: 100, label: 'merge' },
    { x: 270, y: 60, label: 'out' },
    { x: 270, y: 140, label: 'out' },
  ];

  const paths = [
    'M 40 100 Q 75 50 110 50',
    'M 40 100 Q 75 150 110 150',
    'M 110 50 Q 150 50 190 100',
    'M 110 150 Q 150 150 190 100',
    'M 190 100 Q 230 60 270 60',
    'M 190 100 Q 230 140 270 140',
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="df-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="df-grad-v" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
        </linearGradient>
        <filter id="df-glow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Connection paths with flowing dashes */}
      {paths.map((d, i) => (
        <g key={`path-${i}`}>
          {/* Faint base path */}
          <path
            d={d}
            stroke="url(#df-grad)"
            strokeWidth="1"
            fill="none"
            opacity="0.15"
          />
          {/* Animated dash overlay */}
          <path
            d={d}
            stroke="url(#df-grad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
            strokeDasharray="6 8"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-28"
              dur={`${1.5 + i * 0.2}s`}
              repeatCount="indefinite"
            />
          </path>
        </g>
      ))}

      {/* Data particle dots traveling along paths */}
      {paths.map((d, i) => (
        <circle key={`dot-${i}`} r="2" fill="#06b6d4" opacity="0.7">
          <animateMotion
            dur={`${2 + i * 0.3}s`}
            repeatCount="indefinite"
            path={d}
          />
          <animate
            attributeName="opacity"
            values="0;0.8;0.8;0"
            dur={`${2 + i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={`node-${i}`}>
          {/* Glow */}
          <circle
            cx={node.x}
            cy={node.y}
            r="14"
            fill="url(#df-grad)"
            opacity="0.06"
            filter="url(#df-glow)"
          />
          {/* Outer ring */}
          <circle
            cx={node.x}
            cy={node.y}
            r="10"
            stroke="url(#df-grad)"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
          {/* Inner fill */}
          <circle
            cx={node.x}
            cy={node.y}
            r="4"
            fill="url(#df-grad)"
            opacity="0.7"
          >
            <animate
              attributeName="opacity"
              values="0.5;0.9;0.5"
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Decorative grid dots */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <circle
            key={`grid-${row}-${col}`}
            cx={20 + col * 40}
            cy={20 + row * 40}
            r="0.5"
            fill="white"
            opacity="0.06"
          />
        ))
      )}
    </svg>
  );
}
