"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GeoMapDatum {
  country: string
  value: number
}

interface GeoMapProps {
  data: GeoMapDatum[]
  colorRange?: [string, string]
  height?: number
  className?: string
}

/*
 * Simplified SVG paths for European countries.
 * Each path is relative to a 1000x700 viewBox centered on Europe.
 * Country codes follow ISO 3166-1 alpha-2.
 */
const EUROPE_PATHS: Record<string, { d: string; cx: number; cy: number; name: string }> = {
  GB: {
    d: "M280,220 L290,200 L300,190 L310,200 L305,220 L310,240 L305,260 L295,270 L280,260 L275,240 Z M285,275 L295,275 L300,285 L290,290 Z",
    cx: 292, cy: 235, name: "United Kingdom",
  },
  IE: {
    d: "M255,225 L270,215 L275,230 L275,250 L265,260 L255,255 L250,240 Z",
    cx: 263, cy: 238, name: "Ireland",
  },
  FR: {
    d: "M320,280 L360,270 L380,290 L390,320 L380,350 L360,365 L335,360 L315,345 L310,320 L305,295 Z",
    cx: 345, cy: 320, name: "France",
  },
  DE: {
    d: "M390,220 L420,215 L435,230 L440,260 L430,285 L410,290 L390,280 L380,255 L385,235 Z",
    cx: 410, cy: 255, name: "Germany",
  },
  ES: {
    d: "M280,370 L325,360 L355,365 L365,390 L355,420 L320,430 L285,425 L270,405 L275,385 Z",
    cx: 318, cy: 395, name: "Spain",
  },
  PT: {
    d: "M260,380 L275,375 L275,405 L270,420 L258,415 L255,395 Z",
    cx: 265, cy: 398, name: "Portugal",
  },
  IT: {
    d: "M410,310 L430,305 L440,320 L445,350 L435,380 L425,400 L415,410 L420,420 L430,430 L425,440 L410,435 L415,405 L405,370 L395,340 L400,320 Z",
    cx: 420, cy: 365, name: "Italy",
  },
  NL: {
    d: "M375,215 L390,210 L395,220 L390,235 L380,235 L375,225 Z",
    cx: 383, cy: 222, name: "Netherlands",
  },
  BE: {
    d: "M365,240 L380,235 L390,240 L388,252 L375,255 L365,248 Z",
    cx: 377, cy: 245, name: "Belgium",
  },
  CH: {
    d: "M385,290 L405,288 L415,295 L410,308 L395,310 L385,303 Z",
    cx: 400, cy: 298, name: "Switzerland",
  },
  AT: {
    d: "M420,280 L450,275 L465,285 L460,298 L440,300 L420,295 Z",
    cx: 442, cy: 288, name: "Austria",
  },
  PL: {
    d: "M445,205 L490,195 L510,210 L510,240 L495,255 L465,255 L445,240 L440,220 Z",
    cx: 478, cy: 225, name: "Poland",
  },
  CZ: {
    d: "M430,255 L455,248 L468,255 L462,268 L440,272 L430,265 Z",
    cx: 448, cy: 260, name: "Czech Republic",
  },
  SE: {
    d: "M430,80 L445,70 L460,80 L465,120 L458,160 L445,180 L435,170 L430,130 L435,100 Z",
    cx: 448, cy: 125, name: "Sweden",
  },
  NO: {
    d: "M390,60 L420,50 L435,70 L430,100 L425,140 L415,165 L405,155 L395,120 L388,85 Z",
    cx: 412, cy: 105, name: "Norway",
  },
  FI: {
    d: "M475,55 L500,50 L515,70 L520,110 L510,145 L495,155 L480,140 L470,100 L468,70 Z",
    cx: 495, cy: 100, name: "Finland",
  },
  DK: {
    d: "M395,185 L415,180 L420,195 L410,205 L398,202 Z M405,175 L412,170 L418,178 L410,182 Z",
    cx: 408, cy: 192, name: "Denmark",
  },
  EE: {
    d: "M495,158 L520,155 L525,168 L515,175 L495,172 Z",
    cx: 510, cy: 165, name: "Estonia",
  },
  LV: {
    d: "M495,175 L520,172 L525,188 L510,195 L495,190 Z",
    cx: 510, cy: 183, name: "Latvia",
  },
  LT: {
    d: "M490,195 L515,192 L520,208 L505,215 L490,210 Z",
    cx: 505, cy: 203, name: "Lithuania",
  },
  HU: {
    d: "M462,280 L495,275 L510,285 L505,300 L485,305 L462,298 Z",
    cx: 485, cy: 290, name: "Hungary",
  },
  RO: {
    d: "M510,275 L550,268 L570,280 L570,305 L550,315 L520,310 L510,295 Z",
    cx: 540, cy: 292, name: "Romania",
  },
  BG: {
    d: "M530,320 L565,315 L580,325 L575,345 L555,350 L530,340 Z",
    cx: 555, cy: 333, name: "Bulgaria",
  },
  GR: {
    d: "M510,370 L535,360 L550,370 L545,395 L530,410 L520,400 L510,390 Z",
    cx: 530, cy: 382, name: "Greece",
  },
  HR: {
    d: "M450,300 L470,295 L480,310 L475,325 L460,330 L445,320 L448,310 Z",
    cx: 462, cy: 312, name: "Croatia",
  },
  SK: {
    d: "M465,262 L495,258 L505,268 L498,278 L475,278 L465,272 Z",
    cx: 485, cy: 268, name: "Slovakia",
  },
  SI: {
    d: "M435,298 L452,295 L458,305 L450,312 L435,308 Z",
    cx: 446, cy: 303, name: "Slovenia",
  },
  RS: {
    d: "M495,305 L520,298 L530,315 L525,335 L510,340 L495,330 Z",
    cx: 512, cy: 318, name: "Serbia",
  },
  UA: {
    d: "M530,210 L590,195 L620,210 L625,245 L610,270 L575,275 L545,265 L525,245 L530,225 Z",
    cx: 575, cy: 238, name: "Ukraine",
  },
  BY: {
    d: "M510,185 L545,178 L560,192 L555,215 L535,222 L510,215 Z",
    cx: 535, cy: 198, name: "Belarus",
  },
}

function interpolateHex(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => {
    const c = h.replace("#", "")
    return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)]
  }
  const c1 = parse(hex1)
  const c2 = parse(hex2)
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  return `rgb(${r},${g},${b})`
}

export function GeoMap({
  data,
  colorRange = ["#dbeafe", "#2563eb"],
  height = 500,
  className,
}: GeoMapProps) {
  const [tooltip, setTooltip] = React.useState<{
    x: number
    y: number
    name: string
    value: number
  } | null>(null)

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-[var(--text-muted)]">No data available</p>
      </div>
    )
  }

  const valueMap = new Map(data.map((d) => [d.country, d.value]))
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)

  const getColor = (code: string): string => {
    const val = valueMap.get(code)
    if (val === undefined) return "var(--border)"
    const t = max === min ? 0.5 : (val - min) / (max - min)
    return interpolateHex(colorRange[0], colorRange[1], t)
  }

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox="240 40 420 420"
        width="100%"
        height={height}
        className="block"
        preserveAspectRatio="xMidYMid meet"
      >
        {Object.entries(EUROPE_PATHS).map(([code, { d, name }]) => (
          <path
            key={code}
            d={d}
            fill={getColor(code)}
            stroke="var(--surface)"
            strokeWidth={1.5}
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-[var(--text)]"
            onMouseEnter={(e) => {
              const rect = (e.target as SVGPathElement).getBoundingClientRect()
              setTooltip({
                x: rect.left + rect.width / 2,
                y: rect.top,
                name,
                value: valueMap.get(code) ?? 0,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <title>{name}</title>
          </path>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-[var(--r-lg)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-semibold text-[var(--text)]">{tooltip.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Value: <span className="font-medium text-[var(--text)]">{tooltip.value.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  )
}
