import { chipTone, dotTone } from '../../lib/tones'

/* design.md § Status Chips & Priority Badges
   4px radius, 20px fixed height, 2px/6px padding, label-sm text. Tinted
   fill with a matching 1px border. No pills. */

export function Chip({ tone = 'neutral', dot = false, icon, className = '', children }) {
  return (
    <span
      className={[
        'inline-flex h-5 items-center gap-1 rounded border px-1.5',
        'text-label-sm uppercase whitespace-nowrap',
        chipTone[tone],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`size-1.5 shrink-0 rounded-full ${dotTone[tone]}`} />
      )}
      {icon}
      {children}
    </span>
  )
}

/* Status chips carry sentence case in the mockups, priority chips uppercase. */
export function StatusChip({ tone = 'neutral', children }) {
  return (
    <span
      className={[
        'inline-flex h-5 items-center rounded border px-1.5',
        'text-label-sm whitespace-nowrap',
        chipTone[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/* design.md § AI Recommendation Tag — solid charcoal, khaki orange text,
   accompanied by a mechanical diamond symbol. */
export function AiTag({ className = '', children }) {
  return (
    <span
      className={[
        'inline-flex h-5 items-center gap-1.5 rounded bg-ink px-1.5',
        'text-label-sm uppercase text-accent whitespace-nowrap',
        className,
      ].join(' ')}
    >
      <span aria-hidden="true">◆</span>
      {children}
    </span>
  )
}

/* Reference codes: MNT-024, SEC-NDLS-04, KM 143.200. The mockups render
   these in a mono face on an alabaster sub-fill. */
export function Ref({ tone = 'default', className = '', children }) {
  const tones = {
    default: 'bg-canvas border-line text-ink',
    ink: 'bg-ink border-ink text-surface',
    accent: 'bg-accent-wash border-accent-line text-accent-deep',
  }
  return (
    <span
      className={[
        'inline-flex h-5 items-center rounded border px-1.5',
        'font-mono text-code-dense',
        tones[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-block size-1.5 shrink-0 rounded-full ${dotTone[tone]} ${className}`}
    />
  )
}
