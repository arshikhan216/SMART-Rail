import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { chart } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Legend, Provenance, TipBody, Tooltip } from './chartPrimitives'
import useTooltip from '../../lib/useTooltip'

/**
 * Paired horizontal bars, one row per planning metric.
 *
 * Each row is its own small multiple normalised to its own maximum, because
 * the metrics carry different units (minutes, counts, ratios). Every bar is
 * directly labelled, so no row depends on a shared axis to be read — and
 * there is no dual-scale chart anywhere.
 */
export default function BaselineComparison({
  metrics,
  workDelivered,
  showBaseline = true,
}) {
  const { tip, show, hide } = useTooltip()

  return (
    <Panel>
      <PanelHeader
        title="Baseline vs SMART-Rail Optimized"
        subtitle="Same candidates, same window, same train movements — with and without cross-department pairing."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Legend
              items={[
                ...(showBaseline
                  ? [{ label: 'Baseline (single-department)', color: chart.baseline }]
                  : []),
                { label: 'SMART-Rail optimized', color: chart.optimized },
              ]}
            />
            <Provenance source="derived" />
          </div>
        }
      />

      <div className="relative p-5" data-chart-host>
        <Tooltip tip={tip} />

        <ul className="divide-y divide-line">
          {metrics.map((metric) => {
            const max = Math.max(metric.baseline, metric.optimized, 1)
            const delta = metric.optimized - metric.baseline
            const improved =
              metric.better === 'lower' ? delta < 0 : delta > 0
            const unchanged = delta === 0

            const pct =
              metric.baseline === 0
                ? null
                : Math.round((delta / metric.baseline) * 100)

            const DeltaIcon = unchanged
              ? Minus
              : delta < 0
                ? ArrowDown
                : ArrowUp

            const rows = [
              ...(showBaseline
                ? [
                    {
                      label: 'Baseline',
                      value: `${metric.baseline}${metric.unit}`,
                      color: chart.baseline,
                    },
                  ]
                : []),
              {
                label: 'SMART-Rail',
                value: `${metric.optimized}${metric.unit}`,
                color: chart.optimized,
              },
            ]

            return (
              <li key={metric.key} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <h3 className="text-body-lg font-semibold text-ink">
                      {metric.label}
                    </h3>
                    <p className="text-body-sm text-ink-muted">
                      {metric.qualifier}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="font-dense text-body-md text-ink-muted">
                      {showBaseline && (
                        <>
                          {metric.baseline}
                          {metric.unit}
                          <span className="mx-1.5 text-ink-subtle">→</span>
                        </>
                      )}
                      <span className="font-semibold text-ink">
                        {metric.optimized}
                        {metric.unit}
                      </span>
                    </span>

                    <span
                      className={[
                        'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-label-sm',
                        unchanged
                          ? 'border-line bg-canvas text-ink-muted'
                          : improved
                            ? 'border-nominal-line bg-nominal-tint text-nominal'
                            : 'border-warning-line bg-warning-tint text-warning',
                      ].join(' ')}
                    >
                      <DeltaIcon className="size-3" strokeWidth={2.5} />
                      {unchanged
                        ? 'No change'
                        : pct === null
                          ? `${delta > 0 ? '+' : ''}${delta}${metric.unit}`
                          : `${pct > 0 ? '+' : ''}${pct}%`}
                    </span>
                  </div>
                </div>

                {/* Bars — 2px surface gap between them, squared ends */}
                <div
                  className="mt-2.5 space-y-1"
                  onMouseLeave={hide}
                  onMouseMove={(event) =>
                    show(event, <TipBody title={metric.label} rows={rows} />)
                  }
                >
                  {showBaseline && (
                    <Bar
                      value={metric.baseline}
                      max={max}
                      unit={metric.unit}
                      color={chart.baseline}
                    />
                  )}
                  <Bar
                    value={metric.optimized}
                    max={max}
                    unit={metric.unit}
                    color={chart.optimized}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {/* The honest caveat: total work delivered does not change */}
        {workDelivered?.identical && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3.5 text-body-sm text-ink-muted">
            <Minus className="size-3.5 shrink-0" strokeWidth={2} />
            <span>
              Both plans deliver the identical{' '}
              <span className="font-dense font-semibold text-ink">
                {workDelivered.optimized} task-minutes
              </span>{' '}
              of maintenance. The gain is in track time consumed, not work
              volume.
            </span>
          </p>
        )}
      </div>
    </Panel>
  )
}

function Bar({ value, max, unit, color }) {
  const width = Math.max((value / max) * 100, value > 0 ? 1.5 : 0)
  return (
    <div className="flex h-4 items-center gap-2">
      <div className="relative h-full flex-1 bg-surface-sunken/60">
        <div
          className="absolute inset-y-0 left-0 rounded-r-[3px]"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-14 shrink-0 font-dense text-body-sm text-ink-muted">
        {value}
        {unit}
      </span>
    </div>
  )
}
