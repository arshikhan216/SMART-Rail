/* The in-content page header: display title, an optional inline status chip,
   a one-line subtitle and right-aligned commitment actions. */

export default function PageHeader({ title, badge, subtitle, actions, meta }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-lg text-ink">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-body-lg text-ink-muted">{subtitle}</p>
        )}
      </div>
      {(actions || meta) && (
        <div className="flex flex-col items-end gap-2">
          {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
          {meta}
        </div>
      )}
    </div>
  )
}

/** Standard content padding — design.md § screen-edge, relaxed one step.
    No max-width: the staging area uses the full elastic pane so a 1440px
    desktop is not squeezed into a narrow centred column. */
export function PageBody({ className = '', children }) {
  return (
    <div className={['p-5 lg:p-7', className].join(' ')}>{children}</div>
  )
}
