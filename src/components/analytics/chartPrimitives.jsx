/* Shared chart furniture. Text always wears ink tokens — never the series
   colour; a swatch beside the label carries identity instead. */

/** Legend. Present whenever a chart draws two or more series. */
export function Legend({ items, className = '' }) {
  return (
    <ul className={['flex flex-wrap items-center gap-x-4 gap-y-1.5', className].join(' ')}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-1.5 text-body-sm text-ink-muted"
        >
          <span
            className={[
              'size-3 shrink-0',
              item.dashed ? 'border-b-2 border-dashed' : 'rounded-sm',
            ].join(' ')}
            style={
              item.dashed
                ? { borderColor: item.color }
                : { backgroundColor: item.color }
            }
          />
          <span>{item.label}</span>
          {item.value && (
            <span className="font-dense text-ink">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Renders inside a `data-chart-host` positioned container. */
export function Tooltip({ tip }) {
  if (!tip) return null
  return (
    <div
      className="pointer-events-none absolute z-30 max-w-56 -translate-x-1/2 -translate-y-full rounded-md border border-line-elevated bg-surface px-2.5 py-2 shadow-level2"
      style={{ left: tip.x, top: tip.y - 10 }}
      role="tooltip"
    >
      {tip.content}
    </div>
  )
}

/** Standard tooltip body: a title plus aligned metric rows. */
export function TipBody({ title, rows }) {
  return (
    <>
      <p className="text-label-sm uppercase text-ink-muted">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-3 whitespace-nowrap"
          >
            <span className="flex items-center gap-1.5 text-body-sm text-ink-muted">
              {row.color && (
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                />
              )}
              {row.label}
            </span>
            <span className="font-dense text-body-md font-semibold text-ink">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Provenance marker. Every panel states whether its numbers are computed
 * from the prototype dataset or are an illustrative series.
 */
export function Provenance({ source, title }) {
  const derived = source === 'derived'
  return (
    <span
      title={
        title ??
        (derived
          ? 'Computed from the prototype register, candidates and optimizer'
          : 'Illustrative series — the prototype holds no history for this metric')
      }
      className={[
        'inline-flex h-5 shrink-0 items-center gap-1 rounded border px-1.5 text-label-sm uppercase',
        derived
          ? 'border-nominal-line bg-nominal-tint text-nominal'
          : 'border-line bg-canvas text-ink-muted',
      ].join(' ')}
    >
      {derived ? 'Derived' : 'Demo series'}
    </span>
  )
}
