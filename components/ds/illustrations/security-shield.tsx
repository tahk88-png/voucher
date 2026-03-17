'use client';

interface SecurityShieldProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function SecurityShield({ width = 240, height = 280, className = '' }: SecurityShieldProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ss-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="ss-grad-fill" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
        <clipPath id="ss-shield-clip">
          <path d="M120 35 L195 70 C195 70 200 155 170 200 C150 228 120 245 120 245 C120 245 90 228 70 200 C40 155 45 70 45 70 Z" />
        </clipPath>
        <filter id="ss-glow">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Shield glow */}
      <path
        d="M120 35 L195 70 C195 70 200 155 170 200 C150 228 120 245 120 245 C120 245 90 228 70 200 C40 155 45 70 45 70 Z"
        fill="url(#ss-grad)"
        opacity="0.06"
        filter="url(#ss-glow)"
      />

      {/* Shield body - gradient fill */}
      <path
        d="M120 35 L195 70 C195 70 200 155 170 200 C150 228 120 245 120 245 C120 245 90 228 70 200 C40 155 45 70 45 70 Z"
        fill="url(#ss-grad-fill)"
      />

      {/* Shield outline */}
      <path
        d="M120 35 L195 70 C195 70 200 155 170 200 C150 228 120 245 120 245 C120 245 90 228 70 200 C40 155 45 70 45 70 Z"
        stroke="url(#ss-grad)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />

      {/* Inner shield line */}
      <path
        d="M120 55 L180 82 C180 82 184 148 160 185 C145 207 120 220 120 220 C120 220 95 207 80 185 C56 148 60 82 60 82 Z"
        stroke="url(#ss-grad)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.15"
      />

      {/* Lock icon */}
      <g opacity="0.6">
        {/* Lock body */}
        <rect
          x="103"
          y="130"
          width="34"
          height="28"
          rx="4"
          stroke="url(#ss-grad)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Lock shackle */}
        <path
          d="M110 130 V118 C110 110 115 105 120 105 C125 105 130 110 130 118 V130"
          stroke="url(#ss-grad)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Keyhole */}
        <circle cx="120" cy="142" r="3" fill="url(#ss-grad)" opacity="0.8" />
        <rect x="119" y="144" width="2" height="5" rx="1" fill="url(#ss-grad)" opacity="0.8" />
      </g>

      {/* Scanning line animation */}
      <g clipPath="url(#ss-shield-clip)">
        <line
          x1="40"
          y1="0"
          x2="200"
          y2="0"
          stroke="url(#ss-grad)"
          strokeWidth="1"
          opacity="0.3"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 50; 0 240; 0 50"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.35;0.35;0"
            dur="4s"
            repeatCount="indefinite"
          />
        </line>
        {/* Scan glow band */}
        <rect
          x="40"
          y="-6"
          width="160"
          height="12"
          fill="url(#ss-grad)"
          opacity="0.04"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 50; 0 240; 0 50"
            dur="4s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Decorative corner brackets */}
      {[
        'M55 55 L55 65 M55 55 L65 55',
        'M185 55 L185 65 M185 55 L175 55',
        'M65 230 L55 230 M55 230 L55 220',
        'M175 230 L185 230 M185 230 L185 220',
      ].map((d, i) => (
        <path
          key={`bracket-${i}`}
          d={d}
          stroke="url(#ss-grad)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
        />
      ))}

      {/* Status dots */}
      {[
        { x: 120, y: 80, delay: '0s' },
        { x: 90, y: 100, delay: '0.5s' },
        { x: 150, y: 100, delay: '1s' },
      ].map((dot, i) => (
        <circle
          key={`status-${i}`}
          cx={dot.x}
          cy={dot.y}
          r="2"
          fill="#06b6d4"
          opacity="0.4"
        >
          <animate
            attributeName="opacity"
            values="0.2;0.6;0.2"
            dur="2.5s"
            begin={dot.delay}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
