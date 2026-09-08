import { ChevronDown } from 'lucide-react'

/* design.md § Input Fields & Selects
   Resting: white, 1px #E5E0D5, 32px height, 8px horizontal padding.
   Focused: 1px charcoal border plus an immediate non-diffuse 1px outer ring
   in khaki orange — a ring, never a glow. */

const FIELD_BASE = [
  'h-8 w-full rounded border border-line bg-surface px-2',
  'text-body-md text-ink placeholder:text-ink-subtle',
  'outline-none transition-colors',
  'focus:border-ink focus:ring-1 focus:ring-accent focus:ring-offset-0',
].join(' ')

export function Label({ htmlFor, hint, className = '', children }) {
  return (
    <div className={['flex items-baseline justify-between gap-2', className].join(' ')}>
      <label htmlFor={htmlFor} className="text-label-sm uppercase text-ink-muted">
        {children}
      </label>
      {hint}
    </div>
  )
}

export function TextInput({ unit, className = '', ...rest }) {
  if (unit) {
    /* Integrated unit badge: fixed right-aligned mechanical block in muted
       ink on an alabaster sub-fill. */
    return (
      <div
        className={[
          'flex h-8 items-stretch rounded border border-line bg-surface',
          'focus-within:border-ink focus-within:ring-1 focus-within:ring-accent',
          className,
        ].join(' ')}
      >
        <input
          className="min-w-0 flex-1 rounded-l bg-transparent px-2 text-body-md text-ink outline-none placeholder:text-ink-subtle"
          {...rest}
        />
        <span className="flex items-center border-l border-line bg-canvas px-2 text-label-sm uppercase text-ink-muted">
          {unit}
        </span>
      </div>
    )
  }
  return <input className={[FIELD_BASE, className].join(' ')} {...rest} />
}

export function Select({ options = [], className = '', ...rest }) {
  return (
    <div className={['relative', className].join(' ')}>
      <select
        className={[
          FIELD_BASE,
          'cursor-pointer appearance-none pr-7',
        ].join(' ')}
        {...rest}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
        strokeWidth={2}
      />
    </div>
  )
}

/* design.md § Selection Controls — 16x16px square, 2px radius, 1px charcoal
   border; checked fills solid charcoal with a white check. */
export function Checkbox({ label, id, className = '', ...rest }) {
  return (
    <label
      htmlFor={id}
      className={['inline-flex cursor-pointer items-center gap-2', className].join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        className="size-4 shrink-0 cursor-pointer appearance-none rounded-sm border border-ink bg-surface checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22square%22%3E%3Cpath%20d%3D%22M3.5%208.5l3%203%206-6%22%2F%3E%3C%2Fsvg%3E')] checked:bg-center checked:bg-no-repeat"
        {...rest}
      />
      {label && <span className="text-body-md text-ink">{label}</span>}
    </label>
  )
}

/* 16x16px circle, solid charcoal perimeter, inner 8px dot when active. */
export function Radio({ label, id, className = '', ...rest }) {
  return (
    <label
      htmlFor={id}
      className={['inline-flex cursor-pointer items-center gap-2', className].join(' ')}
    >
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="radio"
          className="peer size-4 cursor-pointer appearance-none rounded-full border border-ink bg-surface"
          {...rest}
        />
        <span className="pointer-events-none absolute size-2 rounded-full bg-ink opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="text-body-md text-ink">{label}</span>}
    </label>
  )
}
