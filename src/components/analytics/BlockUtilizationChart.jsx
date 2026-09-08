import { toClock, toMin } from '../../data/blockPlanning'
import { chart } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Legend, Provenance, TipBody, Tooltip } from './chartPrimitives'
import useTooltip from '../../lib/useTooltip'

/**
 * The same 120-minute window drawn twice: once as the baseline would consume
 * it, once as the optimizer does. Segment timelines make "is the window used
 * efficiently" readable at a glance, and the two rows share one time axis.
 */
export default function BlockUtilizationChart({ data }) {
  const { tip, show, hide } = useTooltip()

  const windowStart = toMin(data.window.from)
  const windowEnd = toMin(data.window.to)
  const span = windowEnd - windowStart

  const pct = (minutes) => ((minutes - windowStart) / span) * 100
  const box = (start, end) => ({
    left: `${pct(start)}%`,
    width: `${((end - start) / span) * 100}%`,
  })

  const ticks = []
  for (let m = windowStart; m <= windowEnd; m += 30) ticks.push(m)

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Block Utilization"
        subtitle={`How the ${data.windowMinutes}-minute window is consumed, baseline against optimized.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Legend
              items={[
                { label: 'Possession', color: chart.possession },
                { label: 'Train movement', color: chart.movement },
                { label: 'Slack held', color: chart.slack },
              ]}
            />
            <Provenance source={data.source} />
          </div>
        }
      />

      <div className="relative flex-1 p-5" data-chart-host>
        <Tooltip tip={tip} />

        {/* Shared time axis */}
        <div className="flex items-end">
          <span className="w-40 shrink-0 pr-3 text-label-sm uppercase text-ink-muted">
            Window
          </span>
          <div className="relative h-5 flex-1">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2 font-mono text-code-dense text-ink-muted"
                style={{ left: `${pct(tick)}%` }}
              >
                {toClock(tick)}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-3">
          {data.plans.map((entry) => {
            const efficiency = Math.round(
              (entry.possessionMinutes / data.windowMinutes) * 100,
            )
            return (
              <div key={entry.key}>
                <div className="flex items-center gap-3">
                  <div className="w-40 shrink-0 pr-3">
                    <p className="text-body-md font-semibold text-ink">
                      {entry.label}
                    </p>
                    <p className="font-dense text-body-sm text-ink-muted">
                      {entry.possessionMinutes}m possession · {efficiency}% of
                      window
                    </p>
                  </div>

                  <div className="relative h-10 flex-1 rounded border border-line bg-surface-sunken/40">
                    {/* Slack held */}
                    {entry.slackGaps.map((gap) => (
                      <span
                        key={`s-${gap.start}`}
                        className="absolute inset-y-1 rounded-[3px]"
                        style={{ ...box(gap.start, gap.end), backgroundColor: chart.slack }}
                        onMouseMove={(event) =>
                          show(
                            event,
                            <TipBody
                              title="Slack held"
                              rows={[
                                {
                                  label: `${toClock(gap.start)}–${toClock(gap.end)}`,
                                  value: `${gap.minutes}m`,
                                  color: chart.slack,
                                },
                              ]}
                            />,
                          )
                        }
                        onMouseLeave={hide}
                      />
                    ))}

                    {/* Timetabled movements — hard constraints */}
                    {entry.movements.map((movement) => (
                      <span
                        key={`m-${movement.id}`}
                        className="absolute inset-y-1 rounded-[3px]"
                        style={{
                          ...box(movement.start, movement.end),
                          backgroundColor: chart.movement,
                        }}
                        onMouseMove={(event) =>
                          show(
                            event,
                            <TipBody
                              title={movement.label}
                              rows={[
                                {
                                  label: `${movement.from}–${movement.to}`,
                                  value: `${movement.end - movement.start}m`,
                                  color: chart.movement,
                                },
                              ]}
                            />,
                          )
                        }
                        onMouseLeave={hide}
                      />
                    ))}

                    {/* Maintenance possessions */}
                    {entry.placements.map((placement) => (
                      <span
                        key={`p-${placement.start}`}
                        className="absolute inset-y-1 flex items-center justify-center overflow-hidden rounded-[3px] px-1"
                        style={{
                          ...box(placement.start, placement.end),
                          backgroundColor: chart.possession,
                          outline: '2px solid var(--color-surface)',
                        }}
                        onMouseMove={(event) =>
                          show(
                            event,
                            <TipBody
                              title={
                                placement.joint
                                  ? 'Joint possession'
                                  : 'Possession'
                              }
                              rows={[
                                ...placement.tasks.map((task) => ({
                                  label: task.id,
                                  value: `${task.minutes}m`,
                                  color: chart.possession,
                                })),
                                {
                                  label: 'Track time',
                                  value: `${placement.envelope}m`,
                                },
                              ]}
                            />,
                          )
                        }
                        onMouseLeave={hide}
                      >
                        <span className="truncate font-mono text-[10px] font-semibold text-ink">
                          {placement.tasks.map((task) => task.id).join(' + ')}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Windows flagged as available but not yet planned */}
        <div className="mt-4 border-t border-line pt-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-label-sm uppercase text-ink-muted">
              Open windows not yet planned
            </p>
            <Provenance source="derived" />
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {data.openOpportunities.map((opportunity) => (
              <li
                key={`${opportunity.window}-${opportunity.section}`}
                className="flex items-center gap-2 rounded border border-line bg-canvas px-2.5 py-1.5"
              >
                <span className="font-mono text-code-dense text-ink">
                  {opportunity.window}
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink-muted">
                  {opportunity.section}
                </span>
                <span className="font-dense text-body-sm text-ink-muted">
                  {opportunity.minutes}m · {opportunity.compatible} compatible
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  )
}
