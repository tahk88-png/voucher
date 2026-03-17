'use client';

interface CloudNetworkProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function CloudNetwork({ width = 300, height = 220, className = '' }: CloudNetworkProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="cn-glow">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Main cloud shape */}
      <g opacity="0.5">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -4; 0 0"
          dur="4s"
          repeatCount="indefinite"
        />

        {/* Cloud body */}
        <path
          d="M90 95 C90 72 108 55 130 55 C138 40 158 30 178 35 C190 25 212 25 225 38 C245 38 260 53 258 72 C270 78 275 95 265 108 L80 108 C68 105 65 92 78 85 C78 85 85 82 90 85 Z"
          stroke="url(#cn-grad)"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Cloud glow */}
        <path
          d="M90 95 C90 72 108 55 130 55 C138 40 158 30 178 35 C190 25 212 25 225 38 C245 38 260 53 258 72 C270 78 275 95 265 108 L80 108 C68 105 65 92 78 85 C78 85 85 82 90 85 Z"
          fill="url(#cn-grad)"
          opacity="0.04"
        />
      </g>

      {/* Connection lines from cloud to servers */}
      {[
        [120, 108, 80, 160],
        [170, 108, 150, 160],
        [220, 108, 220, 160],
      ].map(([x1, y1, x2, y2], i) => (
        <g key={`line-${i}`}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#cn-grad)"
            strokeWidth="0.8"
            opacity="0.2"
            strokeDasharray="3 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-12"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
          {/* Data flow dot */}
          <circle r="1.5" fill="#06b6d4" opacity="0.6">
            <animate
              attributeName="cx"
              values={`${x1};${x2}`}
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${y1};${y2}`}
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.7;0.7;0"
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Server nodes */}
      {[
        { x: 80, y: 165 },
        { x: 150, y: 165 },
        { x: 220, y: 165 },
      ].map((s, i) => (
        <g key={`server-${i}`}>
          {/* Server box */}
          <rect
            x={s.x - 18}
            y={s.y - 12}
            width="36"
            height="24"
            rx="4"
            stroke="url(#cn-grad)"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          {/* Server inner lines */}
          <line
            x1={s.x - 12}
            y1={s.y - 4}
            x2={s.x + 12}
            y2={s.y - 4}
            stroke="url(#cn-grad)"
            strokeWidth="0.6"
            opacity="0.2"
          />
          <line
            x1={s.x - 12}
            y1={s.y + 4}
            x2={s.x + 12}
            y2={s.y + 4}
            stroke="url(#cn-grad)"
            strokeWidth="0.6"
            opacity="0.2"
          />
          {/* Status dot */}
          <circle
            cx={s.x + 10}
            cy={s.y - 4}
            r="1.5"
            fill="#06b6d4"
            opacity="0.7"
          >
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur={`${1.5 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Inter-server connections */}
      <line x1="98" y1="170" x2="132" y2="170" stroke="url(#cn-grad)" strokeWidth="0.6" opacity="0.15" strokeDasharray="2 2" />
      <line x1="168" y1="170" x2="202" y2="170" stroke="url(#cn-grad)" strokeWidth="0.6" opacity="0.15" strokeDasharray="2 2" />

      {/* Floating small clouds */}
      {[
        { x: 35, y: 50, s: 0.3 },
        { x: 265, y: 45, s: 0.25 },
      ].map((c, i) => (
        <g key={`mini-cloud-${i}`} opacity="0.15">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0; 0 ${i % 2 === 0 ? -3 : 3}; 0 0`}
            dur={`${3 + i}s`}
            repeatCount="indefinite"
          />
          <circle cx={c.x} cy={c.y} r={12 * c.s} fill="url(#cn-grad)" />
          <circle cx={c.x + 8 * c.s} cy={c.y - 4 * c.s} r={10 * c.s} fill="url(#cn-grad)" />
          <circle cx={c.x - 6 * c.s} cy={c.y + 2 * c.s} r={8 * c.s} fill="url(#cn-grad)" />
        </g>
      ))}
    </svg>
  );
}
