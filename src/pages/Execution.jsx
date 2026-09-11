import {
  Check,
  ChartLine,
  CircleCheck,
  CircleDot,
  History,
  Info,
  Play,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref, StatusChip } from '../components/ui/Chip'
import { Gauge, Meter } from '../components/ui/Meter'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import { execution, offsetPct, system, toMinutes } from '../data/smartRail'
import { dotTone, textTone } from '../lib/tones'

import { useState } from 'react'
import { executeDynamicReplan } from '../services/optimizationService'

export default function Execution() {
  useHeader(['Execution Console', execution.task.id])

  const [showReplanModal, setShowReplanModal] = useState(false)
  const [replanData, setReplanData] = useState(null)
  const [replanRunning, setReplanRunning] = useState(false)

  const handleTriggerReplan = async (type = 'OVERRUN') => {
    setReplanRunning(true)
    setShowReplanModal(true)
    try {
      const res = await executeDynamicReplan(type, { deltaMinutes: 45 })
      setReplanData(res.data)
    } finally {
      setReplanRunning(false)
    }
  }

  return (
    <PageBody>
      <PageHeader
        title="Execution & Monitoring"
        subtitle="Track maintenance progress against the approved plan and trigger dynamic re-optimization during field disruptions."
        actions={
          <>
            <Chip tone="accent" dot>
              {system.disclaimer}
            </Chip>
            <Button
              variant="secondary"
              onClick={() => handleTriggerReplan('OVERRUN')}
            >
              <ChartLine className="size-3.5" strokeWidth={2} />
              Simulate Disruption &amp; Re-optimize
            </Button>
            <Button variant="primary" uppercase onClick={() => handleTriggerReplan('OVERRUN')}>
              <RefreshCw className="size-3.5" strokeWidth={2.25} />
              Review Re-optimization
            </Button>
          </>
        }
      />

      {/* Task identity + lifecycle */}
      <Panel>
        <div className="border-b border-line p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Ref>{execution.task.id}</Ref>
            <span className="h-5 w-px bg-line" />
            <h2 className="text-headline-lg text-ink">{execution.headline}</h2>
            <span className="text-body-lg text-ink-muted">
              · {execution.subtitle}
            </span>
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Fact label="Department">
              <Chip tone="neutral">{execution.task.department}</Chip>
            </Fact>
            <Fact label="Section">
              <span className="text-body-md font-semibold text-ink">
                {execution.section}
              </span>
            </Fact>
            <Fact label="Priority">
              <StatusChip tone="urgent">{execution.priority}</StatusChip>
            </Fact>
            <Fact label="Status">
              <Chip tone="warning" dot>
                {execution.status}
              </Chip>
            </Fact>
          </dl>
        </div>

        <LifecycleTimeline />
        <Milestones />
      </Panel>

      {/* Telemetry triptych */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelHeader
            dense
            title="Current Progress"
            actions={
              <span className="text-body-sm text-ink-subtle">Telemetry est.</span>
            }
          />
          <div className="p-4">
            <div className="flex items-center gap-4">
              <Gauge value={execution.actual.progress} />
              <dl className="min-w-0 flex-1 space-y-2">
                <div>
                  <dt className="text-label-sm uppercase text-ink-muted">
                    Current Milestone
                  </dt>
                  <dd className="text-body-lg font-semibold text-ink">
                    Main Maintenance
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
                  <dt className="text-label-sm uppercase text-ink-muted">
                    Expected Completion
                  </dt>
                  <dd className="font-dense text-body-lg font-semibold text-ink">
                    {execution.forecast.to}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-label-sm uppercase text-warning">
                    Forecast Delay
                  </dt>
                  <dd className="font-dense text-body-lg font-semibold text-warning">
                    +{execution.forecast.overrun} min
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <Meter value={execution.actual.progress} tone="accent" height={6} />
              <p className="mt-2 font-mono text-code-dense text-ink-muted">
                Updated:{' '}
                <span className="font-semibold text-ink">
                  {execution.updatedAt}
                </span>
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            dense
            title="Forecast Intelligence"
            actions={<Chip tone="accent">Dynamic Model</Chip>}
          />
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Planned" value={`${execution.planned.minutes} min`} />
              <Stat label="Elapsed" value={`${execution.elapsed} min`} />
              <Stat
                label="Remaining"
                value={`${execution.remaining} min`}
                highlight
              />
            </div>

            <div className="mt-3 rounded border border-line bg-canvas p-3">
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>Forecast Completion</Eyebrow>
                <span className="font-mono text-code-dense text-ink-muted">
                  Planned: {execution.planned.to}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <span className="font-dense text-headline-lg text-ink">
                  {execution.forecast.to}
                </span>
                <span className="font-dense text-body-md font-semibold text-warning">
                  +{execution.forecast.overrun} min variance
                </span>
              </div>
            </div>

            <p className="mt-3 border-t border-line pt-3 text-body-sm text-ink-muted">
              Dynamic model re-forecasts on each progress update, using observed
              milestone rates against the P90 duration envelope.
            </p>
          </div>
        </Panel>

        {/* Conflict inspector — the one Level 2 surface on this screen */}
        <Panel className="border-accent bg-accent-wash/40">
          <PanelHeader
            dense
            title={
              <span className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded bg-warning-tint">
                  <TriangleAlert className="size-3.5 text-warning" strokeWidth={2} />
                </span>
                Projected Conflict
              </span>
            }
            actions={<Chip tone="warning">Review Required</Chip>}
          />
          <div className="p-4">
            <dl className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 rounded border border-line bg-surface px-2.5 py-2">
                <dt className="text-body-md text-ink-muted">
                  Maintenance forecast:
                </dt>
                <dd className="font-dense text-body-md font-semibold text-ink">
                  {execution.forecast.to}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded border border-line bg-surface px-2.5 py-2">
                <dt className="text-body-md text-ink-muted">
                  Upcoming operational constraint:
                </dt>
                <dd className="text-right font-dense text-body-md font-semibold text-urgent">
                  {execution.constraint.at} ({execution.constraint.label})
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <span className="text-body-md text-ink-muted">Conflict Buffer:</span>
              <span className="font-dense text-body-md font-semibold text-urgent">
                {execution.constraint.buffer} minutes (Exceeds safety margin)
              </span>
            </div>

            <Button
              variant="deep"
              full
              uppercase
              className="mt-3.5"
              onClick={() => handleTriggerReplan('OVERRUN')}
            >
              <RefreshCw className="size-3.5" strokeWidth={2.25} />
              Review Re-optimization
            </Button>
          </div>
        </Panel>
      </div>

      {/* Dynamic Re-optimization Panel (Surfacing Backend /api/v1/plan/replan) */}
      {showReplanModal && (
        <Panel className="mt-4 border-accent-line bg-surface p-4 animate-in fade-in-50">
          <PanelHeader
            title="Dynamic Schedule Re-optimization (Disruption Resolved)"
            subtitle="Real-time CP-SAT solver adjusted maintenance slot to accommodate field overrun without violating passenger train headways."
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  dense
                  onClick={() => handleTriggerReplan('EMERGENCY_DEFECT')}
                >
                  Simulate Urgent Track Defect
                </Button>
                <Button
                  variant="secondary"
                  dense
                  onClick={() => setShowReplanModal(false)}
                >
                  Dismiss
                </Button>
              </div>
            }
          />
          <div className="p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-line bg-canvas p-3">
                <Eyebrow>Tasks Preserved</Eyebrow>
                <p className="mt-1 text-display-lg text-ink font-semibold">
                  {replanData?.impact_summary?.tasks_preserved ?? 16} / 18
                </p>
                <p className="text-body-sm text-ink-muted">89% Schedule Stability</p>
              </div>
              <div className="rounded border border-line bg-canvas p-3">
                <Eyebrow>Tasks Rescheduled</Eyebrow>
                <p className="mt-1 text-display-lg text-warning font-semibold">
                  {replanData?.impact_summary?.tasks_rescheduled ?? 2}
                </p>
                <p className="text-body-sm text-ink-muted">Shifted to night window</p>
              </div>
              <div className="rounded border border-line bg-canvas p-3">
                <Eyebrow>Passenger Train Delay</Eyebrow>
                <p className="mt-1 text-display-lg text-nominal font-semibold">
                  +{replanData?.impact_summary?.max_passenger_delay_minutes ?? 8} min
                </p>
                <p className="text-body-sm text-ink-muted">Minimal corridor regulation</p>
              </div>
              <div className="rounded border border-line bg-canvas p-3">
                <Eyebrow>Safety Invariants</Eyebrow>
                <p className="mt-1 text-display-lg text-nominal font-semibold">PASSED</p>
                <p className="text-body-sm text-ink-muted">Zero track overlap clash</p>
              </div>
            </div>

            <div>
              <Eyebrow className="mb-2">Slot Adjustments</Eyebrow>
              <div className="space-y-2">
                {(replanData?.reassigned_slots || [
                  {
                    task_id: 'TSK-2024-001',
                    title: 'Ultrasonic Rail Weld Repair',
                    original_slot: '14:00 - 17:30 IST',
                    revised_slot: '14:00 - 18:15 IST (+45m overrun accommodated)',
                    status: 'EXTENDED'
                  },
                  {
                    task_id: 'TSK-2024-004',
                    title: 'Track Ballast Tamping',
                    original_slot: '17:45 - 19:15 IST',
                    revised_slot: 'Shifted to Night Window 01:15 - 02:45 IST',
                    status: 'RESCHEDULED'
                  }
                ]).map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-canvas p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Ref>{slot.task_id}</Ref>
                        <span className="font-semibold text-ink">{slot.title}</span>
                      </div>
                      <p className="mt-1 text-body-sm text-ink-muted">
                        Original: <span className="line-through">{slot.original_slot}</span> &rarr; Revised: <span className="font-semibold text-nominal">{slot.revised_slot}</span>
                      </p>
                    </div>
                    <Chip tone={slot.status === 'EXTENDED' ? 'warning' : 'neutral'}>
                      {slot.status}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Progress log */}
      <Panel className="mt-4">
        <PanelHeader
          dense
          title={
            <span className="flex items-center gap-2">
              <History className="size-4 text-ink-muted" strokeWidth={2} />
              Recent Progress Updates
            </span>
          }
        />
        <div className="grid gap-2.5 p-3.5 lg:grid-cols-3">
          {execution.updates.map((update) => (
            <article
              key={update.at + update.title}
              className={[
                'rounded border p-3',
                update.tone === 'warning'
                  ? 'border-warning-line bg-warning-tint'
                  : 'border-line bg-canvas',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'grid size-6 shrink-0 place-items-center rounded-full',
                    update.tone === 'nominal'
                      ? 'bg-nominal-tint'
                      : update.tone === 'telemetry'
                        ? 'bg-telemetry-tint'
                        : 'bg-warning-tint',
                  ].join(' ')}
                >
                  {update.tone === 'nominal' && (
                    <CircleCheck className="size-3.5 text-nominal" strokeWidth={2} />
                  )}
                  {update.tone === 'telemetry' && (
                    <Play className="size-3 text-telemetry" strokeWidth={2.5} />
                  )}
                  {update.tone === 'warning' && (
                    <RefreshCw className="size-3 text-warning" strokeWidth={2.5} />
                  )}
                </span>
                <span className="font-dense text-body-md font-semibold text-ink">
                  {update.at}
                </span>
                <StatusChip tone={update.tone}>{update.tag}</StatusChip>
              </div>
              <p className="mt-2 text-body-lg font-semibold text-ink">
                {update.title}
              </p>
              {update.body && (
                <p className="mt-1 text-body-md text-ink-muted">{update.body}</p>
              )}
            </article>
          ))}
        </div>
      </Panel>

      {/* Release status bar */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-line bg-surface px-4 py-3">
        {execution.footer.map((item) => (
          <p key={item.label} className="flex items-center gap-2 text-body-md">
            <span className={`size-1.5 rounded-full ${dotTone[item.tone]}`} />
            <span className="text-ink-muted">{item.label}:</span>
            <span className={`font-semibold ${textTone[item.tone]}`}>
              {item.value}
            </span>
          </p>
        ))}
      </div>
    </PageBody>
  )
}

/* -------------------------------------------------------------------------- */

function Fact({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-label-sm uppercase text-ink-muted">{label}:</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Stat({ label, value, highlight = false }) {
  return (
    <div
      className={[
        'rounded border p-2.5 text-center',
        highlight
          ? 'border-accent bg-accent-wash'
          : 'border-line bg-canvas',
      ].join(' ')}
    >
      <p className="text-label-sm uppercase text-ink-muted">{label}</p>
      <p
        className={[
          'mt-1 font-dense text-headline-md',
          highlight ? 'text-accent-deep' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

/* Planned / Actual / Forecast lanes against a shared axis, with a hard red
   constraint line at the operational threshold. */
function LifecycleTimeline() {
  const start = toMinutes(execution.ticks[0])
  const end = toMinutes(execution.ticks[execution.ticks.length - 1])
  const at = (clock) => `${offsetPct(clock, start, end)}%`
  const between = (from, to) =>
    `${offsetPct(to, start, end) - offsetPct(from, start, end)}%`

  /* Actual bar stops at the observed progress point rather than the forecast. */
  const actualEndMinutes =
    toMinutes(execution.actual.from) +
    (execution.planned.minutes * execution.actual.progress) / 100
  const actualEnd = `${((actualEndMinutes - start) / (end - start)) * 100}%`

  return (
    <div className="border-b border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="ink">Execution Lifecycle Timeline</Eyebrow>
        <ul className="flex flex-wrap items-center gap-4">
          <LegendItem swatch="bg-ink-subtle/50">
            Planned ({execution.planned.minutes}m)
          </LegendItem>
          <LegendItem swatch="bg-accent">Actual Execution</LegendItem>
          <LegendItem swatch="bg-accent-hover">
            Forecast Overrun (+{execution.forecast.overrun}m)
          </LegendItem>
        </ul>
      </div>

      <div className="mt-3 overflow-x-auto scrollbar-industrial">
        <div className="min-w-[680px] rounded border border-line bg-canvas p-3">
          {/* Axis */}
          <div className="relative ml-[86px] h-4">
            {execution.ticks.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2 font-mono text-code-dense text-ink-muted"
                style={{ left: at(tick) }}
              >
                {tick}
              </span>
            ))}
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-code-dense text-ink-subtle"
              style={{ left: at(execution.planLimit), top: 0 }}
            />
          </div>
          <div className="ml-[86px] flex justify-between">
            <span />
            <span className="font-mono text-[10px] text-ink-subtle">
              (Plan Limit {execution.planLimit}) · (Constraint{' '}
              {execution.constraint.at})
            </span>
          </div>

          {/* Lanes */}
          <div className="relative mt-2 space-y-2">
            {/* Constraint threshold — a hard red line, never a soft wash */}
            <span
              className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-urgent"
              style={{ left: `calc(86px + ${at(execution.constraint.at)})` }}
              aria-hidden="true"
            />
            {/* Plan limit marker */}
            <span
              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-ink"
              style={{ left: `calc(86px + ${at(execution.planLimit)})` }}
              aria-hidden="true"
            />

            <TimelineLane label="Planned">
              <div
                className="absolute inset-y-1 flex items-center justify-between rounded bg-ink-subtle/45 px-2"
                style={{
                  left: at(execution.planned.from),
                  width: between(execution.planned.from, execution.planned.to),
                }}
              >
                <span className="font-mono text-[10px] text-ink">
                  {execution.planned.from}
                </span>
                <span className="hidden text-label-sm uppercase text-ink sm:inline">
                  Planned Window ({execution.planned.minutes} min)
                </span>
                <span className="font-mono text-[10px] text-ink">
                  {execution.planned.to}
                </span>
              </div>
            </TimelineLane>

            <TimelineLane label="Actual">
              <div
                className="absolute inset-y-1 flex items-center justify-between rounded bg-accent px-2"
                style={{
                  left: at(execution.actual.from),
                  width: `calc(${actualEnd} - ${at(execution.actual.from)})`,
                }}
              >
                <span className="font-mono text-[10px] text-ink">
                  {execution.actual.from}
                </span>
                <span className="flex items-center gap-1.5 rounded bg-surface/85 px-1.5 text-[10px] font-semibold text-ink">
                  <Dot tone="ink" />
                  {execution.actual.progress}% Progress
                </span>
              </div>
              {/* Live progress head */}
              <span
                className="absolute top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent-hover"
                style={{ left: actualEnd }}
                aria-hidden="true"
              />
            </TimelineLane>

            <TimelineLane label="Forecast" tone="warning">
              <div
                className="absolute inset-y-1 flex items-center justify-end gap-1.5 rounded border border-accent-hover bg-warning-tint px-2"
                style={{
                  left: at(execution.forecast.from),
                  width: between(execution.forecast.from, execution.forecast.to),
                }}
              >
                <span className="absolute left-2 font-mono text-[10px] text-ink">
                  {execution.forecast.from}
                </span>
                <span className="flex items-center gap-1 rounded bg-accent px-1.5 text-[10px] font-semibold uppercase text-ink">
                  <TriangleAlert className="size-3" strokeWidth={2.25} />
                  Forecast Overrun (+{execution.forecast.overrun} min)
                </span>
                <span className="font-mono text-[10px] text-ink">
                  {execution.forecast.to}
                </span>
              </div>
            </TimelineLane>
          </div>

          {/* Buffer note */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
            <p className="flex items-center gap-1.5 text-body-sm text-ink-muted">
              <Info className="size-3.5" strokeWidth={2} />
              Start: +5 min | Forecast: +{execution.forecast.overrun} min
            </p>
            <p className="font-mono text-code-dense text-urgent">
              Constraint buffer remaining: {execution.constraint.buffer} min (
              {execution.constraint.at} threshold)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineLane({ label, tone = 'neutral', children }) {
  return (
    <div className="flex items-stretch">
      <span
        className={[
          'flex w-[86px] shrink-0 items-center pr-2 text-label-sm uppercase',
          tone === 'warning' ? 'text-warning' : 'text-ink-muted',
        ].join(' ')}
      >
        {label}
      </span>
      <div className="relative h-8 flex-1 rounded bg-surface-sunken/70">
        {children}
      </div>
    </div>
  )
}

function LegendItem({ swatch, children }) {
  return (
    <li className="flex items-center gap-1.5 text-body-sm text-ink-muted">
      <span className={`size-3 rounded-sm ${swatch}`} />
      {children}
    </li>
  )
}

/* Five-stage milestone strip: completed, active, pending. */
function Milestones() {
  const total = execution.milestones.length
  const stage = execution.milestones.findIndex((m) => m.state === 'active') + 1

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="ink">Maintenance Milestones</Eyebrow>
        <p className="text-body-md text-ink-muted">
          Stage {stage} of {total} in progress
        </p>
      </div>

      <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {execution.milestones.map((milestone) => {
          const done = milestone.state === 'done'
          const active = milestone.state === 'active'
          return (
            <li
              key={milestone.name}
              className={[
                'rounded border p-3',
                done && 'border-nominal-line bg-nominal-tint',
                active && 'border-accent bg-accent-wash',
                milestone.state === 'pending' && 'border-line bg-canvas',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={[
                    'grid size-6 shrink-0 place-items-center rounded-full',
                    done && 'bg-nominal',
                    active && 'bg-ink',
                    milestone.state === 'pending' && 'bg-surface-sunken',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {done && <Check className="size-3.5 text-surface" strokeWidth={3} />}
                  {active && <span className="size-2 rounded-full bg-accent" />}
                  {milestone.state === 'pending' && (
                    <CircleDot className="size-3 text-ink-subtle" strokeWidth={2} />
                  )}
                </span>
                {milestone.at ? (
                  <span className="font-mono text-code-dense text-ink-muted">
                    {milestone.at}
                  </span>
                ) : (
                  <span className="text-label-sm uppercase text-ink-subtle">
                    {active ? 'Active' : 'Pending'}
                  </span>
                )}
              </div>
              <p
                className={[
                  'mt-2 text-body-lg font-semibold',
                  milestone.state === 'pending' ? 'text-ink-muted' : 'text-ink',
                ].join(' ')}
              >
                {milestone.name}
              </p>
              {milestone.detail && (
                <p
                  className={[
                    'mt-0.5 text-body-sm',
                    done ? 'text-nominal' : 'text-ink-muted',
                  ].join(' ')}
                >
                  {milestone.detail}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
