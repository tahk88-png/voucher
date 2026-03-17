'use client';

interface AiBrainProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function AiBrain({ width = 280, height = 280, className = '' }: AiBrainProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ai-brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="ai-brain-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="ai-brain-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="140" cy="140" r="100" fill="url(#ai-brain-glow)" />

      {/* Brain outline — abstract hemispheres */}
      <path
        d="M140 60
           C105 60 78 80 75 110
           C72 135 82 155 100 168
           C108 174 115 185 118 200
           L130 200
           C130 185 128 175 122 168"
        stroke="url(#ai-brain-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M140 60
           C175 60 202 80 205 110
           C208 135 198 155 180 168
           C172 174 165 185 162 200
           L150 200
           C150 185 152 175 158 168"
        stroke="url(#ai-brain-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Central spine */}
      <line x1="140" y1="60" x2="140" y2="200" stroke="url(#ai-brain-grad)" strokeWidth="1" opacity="0.3" />

      {/* Connection lines */}
      {[
        [90, 95, 140, 90],
        [140, 90, 190, 95],
        [85, 120, 140, 115],
        [140, 115, 195, 120],
        [95, 145, 140, 140],
        [140, 140, 185, 145],
        [105, 170, 140, 165],
        [140, 165, 175, 170],
        [90, 95, 85, 120],
        [85, 120, 95, 145],
        [95, 145, 105, 170],
        [190, 95, 195, 120],
        [195, 120, 185, 145],
        [185, 145, 175, 170],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={`conn-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#ai-brain-grad)"
          strokeWidth="0.8"
          opacity="0.25"
        />
      ))}

      {/* Neural nodes — pulsing */}
      {[
        [140, 90],
        [90, 95],
        [190, 95],
        [140, 115],
        [85, 120],
        [195, 120],
        [140, 140],
        [95, 145],
        [185, 145],
        [140, 165],
        [105, 170],
        [175, 170],
      ].map(([cx, cy], i) => (
        <g key={`node-${i}`}>
          {/* Glow behind node */}
          <circle
            cx={cx}
            cy={cy}
            r="8"
            fill="url(#ai-brain-grad)"
            opacity="0.08"
            filter="url(#ai-brain-blur)"
          >
            <animate
              attributeName="opacity"
              values="0.04;0.12;0.04"
              dur={`${2 + (i % 3) * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
          {/* Node dot */}
          <circle
            cx={cx}
            cy={cy}
            r="3"
            fill="url(#ai-brain-grad)"
          >
            <animate
              attributeName="r"
              values="2.5;4;2.5"
              dur={`${2 + (i % 4) * 0.4}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur={`${2 + (i % 4) * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Outer floating particles */}
      {[
        [55, 80, 1.5],
        [225, 85, 1.2],
        [50, 155, 1.8],
        [230, 150, 1.3],
        [70, 195, 1.1],
        [210, 195, 1.6],
      ].map(([cx, cy, r], i) => (
        <circle
          key={`particle-${i}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="#06b6d4"
          opacity="0.3"
        >
          <animate
            attributeName="opacity"
            values="0.15;0.45;0.15"
            dur={`${3 + i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
