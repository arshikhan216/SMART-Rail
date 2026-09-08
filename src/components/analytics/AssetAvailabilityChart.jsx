import { chart, departmentColor } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Legend, Provenance, TipBody, Tooltip } from './chartPrimitives'
import useTooltip from '../../lib/useTooltip'

const W = 620
const H = 200
const PAD = { top: 14, right: 10, bottom: 28, left: 40 }

/**
 * Availability trend (two series, one % axis) beside the register's real
 * asset load, so the panel answers both "how is availability moving" and
 * "which assets are consuming the maintenance time".
 */
export default function AssetAvailabilityChart({ trend, assets }) {
  const { tip, show, hide } = useTooltip()
  const series = trend.series

  const min = 80
  const max = 100
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const step = series.length > 1 ? plotW / (series.length - 1) : 0

  const x = (index) => PAD.left + step * index
  const y = (value) => PAD.top + plotH - ((value - min) / (max - min)) * plotH

  const line = (key) =>
    series.map((point, index) => `${x(index)},${y(point[key])}`).join(' ')

  const area = `${PAD.left},${y(min)} ${line('smart')} ${x(series.length - 1)},${y(min)}`

  const ticks = [80, 85, 90, 95, 100]
  const maxLoad = Math.max(...assets.map((asset) => asset.minutes), 1)

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Asset Availability"
        subtitle="Corridor availability trend and the assets consuming maintenance time."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Legend
              items={[
                { label: 'Baseline', color: chart.baseline, dashed: true },
                { label: 'SMART-Rail', color: chart.optimized },
              ]}
            />
            <Provenance source={trend.source} />
          </div>
        }
      />

      <div className="relative p-5" data-chart-host>
        <Tooltip tip={tip} />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
          role="img"
          aria-label="Corridor availability percentage per planning cycle"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y(tick)}
                x2={W - PAD.right}
                y2={y(tick)}
                stroke="var(--color-line)"
                strokeWidth="1"
                strokeDasharray={tick === 80 ? undefined : '3 4'}
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--color-ink-subtle)"
                style={{ fontSize: 11 }}
              >
                {tick}%
              </text>
            </g>
          ))}

          <polygon points={area} fill={chart.optimized} opacity="0.12" />

          <polyline
            points={line('baseline')}
            fill="none"
            stroke={chart.baseline}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <polyline
            points={line('smart')}
            fill="none"
            stroke={chart.optimized}
            strokeWidth="2"
          />

          {series.map((point, index) => (
            <g
              key={point.label}
              onMouseMove={(event) =>
                show(
                  event,
                  <TipBody
                    title={`Cycle ${point.label}`}
                    rows={[
                      {
                        label: 'Baseline',
                        value: `${point.baseline.toFixed(1)}%`,
                        color: chart.baseline,
                      },
                      {
                        label: 'SMART-Rail',
                        value: `${point.smart.toFixed(1)}%`,
                        color: chart.optimized,
                      },
                    ]}
                  />,
                )
              }
              onMouseLeave={hide}
            >
              <rect
                x={x(index) - step / 2}
                y={PAD.top}
                width={step || plotW}
                height={plotH}
                fill="transparent"
              />
              {/* 2px surface ring so markers stay legible over the area */}
              <circle
                cx={x(index)}
                cy={y(point.smart)}
                r="4.5"
                fill={chart.optimized}
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
              <text
                x={x(index)}
                y={H - 8}
                textAnchor="middle"
                fill="var(--color-ink-muted)"
                style={{ fontSize: 11 }}
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Real asset load from the register */}
        <div className="mt-4 border-t border-line pt-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-label-sm uppercase text-ink-muted">
              Maintenance time by asset
            </p>
            <Provenance source="derived" />
          </div>
          <ul className="space-y-1.5">
            {assets.slice(0, 5).map((asset) => (
              <li key={asset.id} className="flex items-center gap-2.5">
                <span className="w-16 shrink-0 font-mono text-code-dense text-ink-muted">
                  {asset.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-body-md text-ink">
                  {asset.asset}
                </span>
                <span className="hidden h-3 w-32 shrink-0 bg-surface-sunken/60 sm:block">
                  <span
                    className="block h-full rounded-r-[3px]"
                    style={{
                      width: `${(asset.minutes / maxLoad) * 100}%`,
                      backgroundColor: departmentColor(asset.department),
                    }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right font-dense text-body-md text-ink">
                  {asset.minutes}m
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  )
}
