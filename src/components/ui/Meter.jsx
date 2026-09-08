import { corridorState, fillTone } from '../../lib/tones'

/* design.md § Linear Status Indicators — in-cell occupancy bars rendered as
   4px thick continuous horizontal segments. Squared ends, never rounded. */

export function Meter({ value, tone = 'accent', height = 4, track = true, className = '' }) {
  return (
    <div
      className={[
        'w-full overflow-hidden',
        track ? 'bg-surface-sunken' : 'bg-transparent',
        className,
      ].join(' ')}
      style={{ height }}
      role="presentation"
    >
      <div
        className={`h-full ${fillTone[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* Corridor clearance schematic: a run of coloured segments with hairline
   gaps, standing in for track possession state along a section. */
export function CorridorBar({ segments, height = 4 }) {
  const total = segments.reduce((sum, segment) => sum + segment.span, 0)
  return (
    <div className="flex w-full gap-0.5" style={{ height }} role="presentation">
      {segments.map((segment, index) => (
        <div
          key={index}
          className={corridorState[segment.state]}
          style={{ width: `${(segment.span / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

/* Radial progress used by Execution & Monitoring. Drawn with stroked SVG
   arcs so the ring reads crisp rather than gradient-filled. */
export function Gauge({ value, size = 92, label = 'PROGRESS' }) {
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-headline-lg text-ink">{value}%</span>
        <span className="text-label-sm uppercase text-ink-muted">{label}</span>
      </div>
    </div>
  )
}
