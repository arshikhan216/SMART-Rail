import { Link } from 'react-router-dom'

/* design.md § Buttons
   - Primary / Commitment: solid khaki orange, charcoal text, 4px radius,
     bold 12px uppercase label. Hover -> #E0A340.
   - Secondary / Tactical: white, 1px solid charcoal border, charcoal text.
   - Destructive / Abort: white, 1px red border, red text; hover fills solid.
   - Compact variant: 28px height for dense table cells and Gantt toolbars.
   Pill shapes are prohibited, so every variant stays on `rounded` (4px). */

const VARIANTS = {
  primary:
    'bg-accent text-ink border border-accent hover:bg-accent-hover hover:border-accent-hover',
  secondary:
    'bg-surface text-ink border border-ink hover:bg-canvas',
  quiet:
    'bg-surface text-ink-muted border border-line hover:bg-canvas hover:text-ink',
  dark: 'bg-ink text-surface border border-ink hover:bg-ink/90',
  destructive:
    'bg-surface text-urgent border border-urgent hover:bg-urgent hover:text-surface',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-canvas',
  deep: 'bg-accent-hover text-ink border border-accent-hover hover:bg-accent',
}

const SIZES = {
  /* 28px compact — high-density table action cells */
  compact: 'h-7 px-2 text-label-sm',
  /* 32px default — matches input height so toolbars align */
  md: 'h-8 px-3 text-label-md',
  lg: 'h-10 px-4 text-label-md',
}

export default function Button({
  as,
  to,
  href,
  variant = 'secondary',
  size = 'md',
  uppercase = false,
  full = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-1.5 rounded whitespace-nowrap',
    'transition-colors duration-100 select-none cursor-pointer',
    'disabled:cursor-not-allowed disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    uppercase && 'uppercase',
    full && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }
  const Tag = as || 'button'
  return (
    <Tag type={Tag === 'button' ? 'button' : undefined} className={classes} {...rest}>
      {children}
    </Tag>
  )
}
