import { chart } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Legend, Provenance, TipBody, Tooltip } from './chartPrimitives'
import useTooltip from '../../lib/useTooltip'

const W = 640
const H = 220
const PAD = { top: 12, right: 8, bottom: 30, left: 34 }

/**
 * Grouped columns: planned vs completed per planning cycle, with critical
 * completions marked. One value axis — counts of tasks.
 */
export default function MaintenanceTrend({ data }) {
  const { tip, show, hide } = useTooltip()
  const series = data.series

  const max = Math.ceil(
    Math.max(...series.map((point) => point.planned)) / 2,
  ) * 2
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const step = plotW / series.length
  const barW = Math.min(18, step * 0.3)

  const y = (value) => PAD.top + plotH - (value / max) * plotH
  const ticks = [0, max / 2, max].map((value) => ({ value, y: y(value) }))

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Maintenance Performance"
        subtitle="Planned against completed work per planning cycle."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Legend
              items={[
                { label: 'Planned', color: chart.slack },
                { label: 'Completed', color: chart.optimized },
                { label: 'Critical completed', color: chart.movement },
              ]}
            />
            <Provenance source={data.source} />
          </div>
        }
      />

      <div className="relative flex-1 p-5" data-chart-host>
        <Tooltip tip={tip} />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
          role="img"
          aria-label="Planned versus completed maintenance tasks per planning cycle"
        >
          {/* Recessive grid */}
          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PAD.left}
                y1={tick.y}
                x2={W - PAD.right}
                y2={tick.y}
                stroke="var(--color-line)"
                strokeWidth="1"
                strokeDasharray={tick.value === 0 ? undefined : '3 4'}
              />
              <text
                x={PAD.left - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--color-ink-subtle)"
                style={{ fontSize: 11 }}
              >
                {tick.value}
              </text>
            </g>
          ))}

          {series.map((point, index) => {
            const groupX = PAD.left + step * index + step / 2
            const plannedX = groupX - barW - 1
            const completedX = groupX + 1
            const rows = [
              { label: 'Planned', value: point.planned, color: chart.slack },
              { label: 'Completed', value: point.completed, color: chart.optimized },
              { label: 'Critical', value: point.critical, color: chart.movement },
            ]

            return (
              <g
                key={point.label}
                onMouseMove={(event) =>
                  show(
                    event,
                    <TipBody title={`Cycle ${point.label}`} rows={rows} />,
                  )
                }
                onMouseLeave={hide}
              >
                {/* Hit target wider than the marks */}
                <rect
                  x={PAD.left + step * index}
                  y={PAD.top}
                  width={step}
                  height={plotH}
                  fill="transparent"
                />

                <rect
                  x={plannedX}
                  y={y(point.planned)}
                  width={barW}
                  height={plotH - (y(point.planned) - PAD.top)}
                  fill={chart.slack}
                  rx="3"
                />
                <rect
                  x={completedX}
                  y={y(point.completed)}
                  width={barW}
                  height={plotH - (y(point.completed) - PAD.top)}
                  fill={chart.optimized}
                  rx="3"
                />
                {/* Critical share sits inside the completed column */}
                <rect
                  x={completedX}
                  y={y(point.critical)}
                  width={barW}
                  height={plotH - (y(point.critical) - PAD.top)}
                  fill={chart.movement}
                  rx="3"
                />

                <text
                  x={groupX}
                  y={H - 10}
                  textAnchor="middle"
                  fill="var(--color-ink-muted)"
                  style={{ fontSize: 11 }}
                >
                  {point.label}
                </text>
              </g>
            )
          })}
        </svg>

        <p className="mt-2 text-body-sm text-ink-subtle">{data.note}</p>
      </div>
    </Panel>
  )
}
