import { railTone } from '../../lib/tones'

/* design.md § Cards & Module Containers / § Elevation
   Level 1: pure white, mandatory 1px #E5E0D5 border, 6px radius, and zero
   box shadow at rest. Separation comes from the tonal step between the
   alabaster canvas and white. `rail` adds the optional 3px left-accent
   marker indicating block status. */

export function Panel({
  rail,
  elevated = false,
  inset = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <section
      className={[
        'rounded-md border',
        inset ? 'bg-canvas border-line' : 'bg-surface border-line',
        elevated && 'shadow-level2 border-line-elevated',
        rail && `border-l-[3px] ${railTone[rail]}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </section>
  )
}

/* A structural divider separates the header from the body — never a shadow. */
export function PanelHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  divided = true,
  dense = false,
  className = '',
}) {
  return (
    <header
      className={[
        'flex flex-wrap items-start justify-between gap-x-5 gap-y-2.5',
        dense ? 'px-4 py-3.5' : 'px-5 py-4',
        divided && 'border-b border-line',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-label-sm uppercase text-ink-muted mb-1.5">{eyebrow}</p>
        )}
        {title && (
          <h2
            className={
              dense
                ? 'text-label-md uppercase text-ink'
                : 'text-headline-md text-ink'
            }
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-body-md text-ink-muted mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </header>
  )
}

export function PanelBody({ dense = false, className = '', children }) {
  return (
    <div className={[dense ? 'p-4' : 'p-5', className].join(' ')}>{children}</div>
  )
}

/* Uppercase, letter-spaced section label. design.md § Micro Labels. */
export function Eyebrow({ tone = 'muted', className = '', children }) {
  const tones = {
    muted: 'text-ink-muted',
    ink: 'text-ink',
    accent: 'text-accent-deep',
    subtle: 'text-ink-subtle',
  }
  return (
    <p className={['text-label-sm uppercase', tones[tone], className].join(' ')}>
      {children}
    </p>
  )
}
