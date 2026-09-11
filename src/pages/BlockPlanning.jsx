import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref } from '../components/ui/Chip'
import { Label, Select } from '../components/ui/Field'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import {
  controls,
  defaults,
  defaultSelection,
  legend,
  optimizePlan,
  parseWindow,
  pipeline,
  planRationale,
  priorityOrder,
  toClock,
} from '../data/blockPlanning'
import { system } from '../data/smartRail'
import { chipTone } from '../lib/tones'

const PRIORITY_TONE = {
  CRITICAL: 'urgent',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'neutral',
}

/* Gutter width for every lane label, so all lanes share one axis origin. */
const GUTTER = 176

export default function BlockPlanning() {
  useHeader(['Planning Workspace'])

  const [date, setDate] = useState(defaults.date)
  const [section, setSection] = useState(defaults.section)
  const [windowLabel, setWindowLabel] = useState(defaults.window)
  const [mode, setMode] = useState(defaults.mode)

  const [selectedIds, setSelectedIds] = useState(defaultSelection)
  const [version, setVersion] = useState(1)
  const [generatedAt, setGeneratedAt] = useState(defaults.generatedAt)
  const [validation, setValidation] = useState('pending')
  const [showPriority, setShowPriority] = useState(false)

  const navigate = useNavigate()

  /* Hands the plan inputs to the deterministic validation step. */
  const openValidation = () =>
    navigate('/plan-validation', {
      state: { version, generatedAt, date, section, windowLabel, mode, selectedIds },
    })

  const windowSpec = useMemo(() => parseWindow(windowLabel), [windowLabel])

  const plan = useMemo(
    () => optimizePlan({ selectedIds, window: windowSpec }),
    [selectedIds, windowSpec],
  )

  const rationale = useMemo(() => planRationale(plan), [plan])

  /* Any change to the inputs puts the plan back into the pending state. */
  const invalidate = () => setValidation('pending')

  const toggleTask = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    )
    invalidate()
  }

  /* Local optimization refresh — deterministic, no external service. */
  const rerun = () => {
    setVersion((value) => value + 1)
    setGeneratedAt(toClock(new Date().getHours() * 60 + new Date().getMinutes()))
    invalidate()
  }

  const reset = () => {
    setDate(defaults.date)
    setSection(defaults.section)
    setWindowLabel(defaults.window)
    setMode(defaults.mode)
    setSelectedIds(defaultSelection)
    setVersion(1)
    setGeneratedAt(defaults.generatedAt)
    setValidation('pending')
  }

  const stage = validation === 'submitted' ? 3 : 2
  const hasConflicts = plan.conflicts.length > 0

  return (
    <PageBody>
      <PageHeader
        title="Block Planning"
        badge={
          validation === 'submitted' ? (
            <Chip tone="telemetry" dot>
              Submitted for deterministic validation
            </Chip>
          ) : (
            <Chip tone="warning" dot>
              Pending deterministic validation
            </Chip>
          )
        }
        actions={
          <>
            <Button variant="quiet" uppercase onClick={reset}>
              Reset
            </Button>
            <Button variant="primary" uppercase onClick={rerun}>
              <Zap className="size-3.5" strokeWidth={2.25} />
              Re-run Optimization
            </Button>
            <Button
              variant="dark"
              uppercase
              onClick={openValidation}
            >
              Validate Plan
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </Button>
          </>
        }
        meta={
          <p className="flex flex-wrap items-center justify-end gap-x-2.5 text-body-sm">
            <span
              className={[
                'flex items-center gap-1.5',
                hasConflicts ? 'text-warning' : 'text-nominal',
              ].join(' ')}
            >
              <Dot tone={hasConflicts ? 'warning' : 'nominal'} />
              {hasConflicts
                ? 'Optimized plan needs planner review'
                : 'Optimized plan generated'}
            </span>
            <span className="font-mono text-code-dense text-ink-muted">
              · Plan V{version} · Generated {generatedAt}
            </span>
          </p>
        }
      />

      {/* Planning inputs */}
      <Panel className="p-3.5">
        <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
          <Control label="Planning Date">
            <Select
              options={controls.dates}
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                invalidate()
              }}
            />
          </Control>
          <Control label="Section">
            <Select
              options={controls.sections}
              value={section}
              onChange={(event) => {
                setSection(event.target.value)
                invalidate()
              }}
            />
          </Control>
          <Control label="Planning Window">
            <Select
              options={controls.windows}
              value={windowLabel}
              onChange={(event) => {
                setWindowLabel(event.target.value)
                invalidate()
              }}
            />
          </Control>
          <Control
            label="Optimization Mode"
            hint={
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer text-body-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
              >
                Reset
              </button>
            }
          >
            <Select
              options={controls.modes}
              value={mode}
              onChange={(event) => {
                setMode(event.target.value)
                invalidate()
              }}
            />
          </Control>
        </div>
      </Panel>

      {/* Pipeline flow — optimization ends before deterministic validation */}
      <Panel className="mt-2.5 p-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Eyebrow className="shrink-0">Pipeline Flow:</Eyebrow>
          <ol className="flex flex-wrap items-center gap-2">
            {pipeline.map((step, index) => (
              <li key={step.key} className="flex items-center gap-2">
                {step.deterministic && (
                  <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
                )}
                <span
                  className={[
                    'inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-body-md',
                    index === stage
                      ? 'border-accent bg-accent-wash text-accent-deep'
                      : index < stage
                        ? 'border-line bg-surface text-ink'
                        : 'border-line border-dashed bg-canvas text-ink-muted',
                  ].join(' ')}
                >
                  {step.deterministic ? (
                    <ShieldCheck className="size-3.5" strokeWidth={2} />
                  ) : (
                    <Dot tone={index === stage ? 'accent' : 'neutral'} />
                  )}
                  {step.label}
                </span>
                {index < pipeline.length - 1 && !pipeline[index + 1].deterministic && (
                  <ArrowRight className="size-3 text-ink-subtle" strokeWidth={2} />
                )}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setShowPriority((value) => !value)}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink"
          >
            Optimization priority
            <ChevronDown
              className={[
                'size-3.5 transition-transform',
                showPriority && 'rotate-180',
              ]
                .filter(Boolean)
                .join(' ')}
              strokeWidth={2}
            />
          </button>
        </div>

        {showPriority && (
          <ol className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            {priorityOrder.map((item, index) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded border border-line bg-canvas px-2 py-1"
              >
                <span className="font-mono text-[10px] text-ink-subtle">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-body-sm text-ink-muted">{item}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {/* Plan KPIs */}
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Critical Tasks"
          value={String(plan.criticalPlaced)}
          unit={`of ${plan.criticalTotal}`}
          caption="Placed / Candidate"
        />
        <Kpi
          label="Block Time"
          value={`${plan.committedMinutes}m`}
          unit={`/ ${plan.windowMinutes}m`}
          caption={`Committed / Available (${plan.slackMinutes}m slack)`}
          accent
        />
        <Kpi
          label="Joint Multi-Dept Synergy"
          value={plan.jointCount > 0 ? "1.5 hrs" : "0 hrs"}
          unit={plan.jointCount > 0 ? "Saved" : "Solo"}
          caption={plan.jointCount > 0 ? `${plan.jointCount} Joint Bundled (P-Way + TRD)` : `Identified in ${section.split(' · ')[0]}`}
          tone={plan.jointCount > 0 ? "nominal" : "neutral"}
        />
        <Kpi
          label="Safety Invariants"
          value={hasConflicts ? "Review" : "VALID"}
          caption={
            hasConflicts ? 'Requires planner review' : '4 Hard bounds verified'
          }
          tone={hasConflicts ? 'urgent' : 'nominal'}
        />
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        <Eyebrow>Legend:</Eyebrow>
        {legend.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1.5 text-body-sm text-ink-muted"
          >
            <LegendSwatch kind={item.swatch} />
            {item.label}
          </span>
        ))}
      </div>

      {/* ================= THE HERO: time-based planning board ============= */}
      <Panel className="mt-2.5">
        <PanelHeader
          dense
          title="Time-Based Planning Board"
          subtitle="Compare train movements, available maintenance windows and candidate work."
          actions={<Chip tone="neutral">{section} · Selected Section</Chip>}
        />
        <Board plan={plan} windowSpec={windowSpec} />
      </Panel>

      {/* Allocation outcome */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="flex flex-col gap-4">
          {/* Selected for block */}
          <Panel>
            <PanelHeader
              dense
              title={
                <span className="flex items-center gap-2">
                  Selected for Block
                  <Chip tone="neutral">
                    {plan.placedTasks.length} Task
                    {plan.placedTasks.length === 1 ? '' : 's'}
                  </Chip>
                </span>
              }
              subtitle={`Allocated in ${section.split(' · ')[0]} during ${windowSpec.from}–${windowSpec.to}`}
              actions={
                plan.conflicts.length === 0 && plan.placedTasks.length > 0 ? (
                  <Chip tone="nominal">
                    <Check className="size-3" strokeWidth={2.5} />
                    Recommended
                  </Chip>
                ) : null
              }
            />
            <div className="space-y-2.5 p-3.5">
              {plan.placements.map((placement) =>
                placement.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    lead={task.priority === 'CRITICAL'}
                    slot={`${toClock(task.start)} – ${toClock(task.end)} (${task.minutes} min)`}
                    onToggle={() => toggleTask(task.id)}
                    state="selected"
                  />
                )),
              )}

              {plan.placedTasks.length === 0 && (
                <p className="rounded border border-dashed border-line bg-canvas p-4 text-center text-body-md text-ink-muted">
                  No task selected. Choose a candidate below to build a plan.
                </p>
              )}

              {plan.jointCount > 0 && (
                <p className="rounded border border-line border-l-[3px] border-l-accent bg-canvas p-3 text-body-md">
                  <span className="font-semibold text-accent-deep">
                    Joint planning opportunity:
                  </span>{' '}
                  <span className="text-ink-muted">
                    {plan.placements
                      .filter((placement) => placement.joint)
                      .map((placement) =>
                        placement.tasks.map((task) => task.id).join(' + '),
                      )
                      .join(', ')}{' '}
                    share one isolation window — no resource clash.
                  </span>
                </p>
              )}
            </div>
          </Panel>

          {/* Deferred from block */}
          <Panel>
            <PanelHeader
              dense
              title={
                <span className="flex items-center gap-2">
                  Deferred from Block
                  <Chip tone="neutral">
                    {plan.deferred.length} Task
                    {plan.deferred.length === 1 ? '' : 's'}
                  </Chip>
                </span>
              }
              actions={
                <span className="font-mono text-code-dense text-ink-muted">
                  Next Window Available: {windowSpec.to}
                </span>
              }
            />
            <ul className="divide-y divide-line">
              {plan.deferred.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    selected={plan.conflicts.some((item) => item.id === task.id)}
                  />
                </li>
              ))}
              {plan.deferred.length === 0 && (
                <li className="p-4 text-center text-body-md text-ink-muted">
                  Every candidate is allocated to this block.
                </li>
              )}
            </ul>
          </Panel>
        </div>

        {/* Why this plan */}
        <Panel className="flex flex-col">
          <PanelHeader title="Why This Plan?" dense />
          <div className="flex-1 space-y-2 p-3.5">
            {rationale.map((reason) => (
              <div
                key={reason.title}
                className="flex items-start gap-2.5 rounded border border-line bg-canvas p-2.5"
              >
                <span
                  className={[
                    'mt-px grid size-5 shrink-0 place-items-center rounded-full',
                    reason.ok ? 'bg-nominal-tint' : 'bg-warning-tint',
                  ].join(' ')}
                >
                  {reason.ok ? (
                    <Check className="size-3 text-nominal" strokeWidth={2.5} />
                  ) : (
                    <TriangleAlert className="size-3 text-warning" strokeWidth={2.5} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-body-md font-semibold text-ink">
                    {reason.title}
                  </span>
                  <span className="mt-0.5 block font-dense text-body-sm text-ink-muted">
                    {reason.body}
                  </span>
                </span>
              </div>
            ))}

            {/* Utilization is an outcome, not the objective */}
            <div className="rounded border border-line bg-surface p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>Block utilization</Eyebrow>
                <span className="font-dense text-body-md font-semibold text-ink">
                  {Math.round((plan.committedMinutes / plan.windowMinutes) * 100)}%
                </span>
              </div>
              <div className="mt-2 flex h-1.5 w-full gap-0.5 overflow-hidden">
                <span
                  className="bg-accent"
                  style={{
                    width: `${(plan.possessionMinutes / plan.windowMinutes) * 100}%`,
                  }}
                />
                <span
                  className="bg-ink"
                  style={{
                    width: `${(plan.movementMinutes / plan.windowMinutes) * 100}%`,
                  }}
                />
                <span
                  className="bg-surface-sunken"
                  style={{
                    width: `${(plan.slackMinutes / plan.windowMinutes) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-ink-subtle">
                {plan.possessionMinutes}m possession · {plan.movementMinutes}m train
                movements · {plan.slackMinutes}m slack held
              </p>
            </div>

            <div className="rounded border border-warning-line bg-warning-tint p-2.5">
              <p className="flex gap-2 text-body-sm text-warning">
                <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} />
                Decision-support recommendation only. Next step: deterministic
                validation under planner review.
              </p>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-3">
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-1.5 text-body-md text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Back to Maintenance Tasks
            </Link>
            <Button
              variant="primary"
              uppercase
              onClick={openValidation}
            >
              Validate Plan
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </Button>
          </footer>
        </Panel>
      </div>

      {validation === 'submitted' && (
        <Panel className="mt-4 border-telemetry-line bg-telemetry-tint p-3">
          <p className="flex flex-wrap items-center gap-2 text-body-md text-ink">
            <ShieldCheck className="size-4 shrink-0 text-telemetry" strokeWidth={2} />
            <span className="font-semibold">
              Plan V{version} submitted for deterministic validation.
            </span>
            <span className="text-ink-muted">
              Awaiting planner review — no possession is granted by this step.
            </span>
          </p>
        </Panel>
      )}

      <p className="mt-4 text-body-sm text-ink-subtle">
        ◆ {system.disclaimer} · All planning values are simulated for
        demonstration.
      </p>
    </PageBody>
  )
}

/* -------------------------------------------------------------------------- */

function Control({ label, hint, children }) {
  return (
    <div className="grid items-center gap-x-3 gap-y-1.5 sm:grid-cols-[150px_minmax(0,1fr)]">
      <Label hint={hint}>{label}:</Label>
      {children}
    </div>
  )
}

function Kpi({ label, value, unit, caption, accent = false, tone }) {
  return (
    <Panel
      className={[
        'p-3.5',
        accent && 'border-ink',
        tone === 'urgent' && 'border-urgent-line bg-urgent-tint/40',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-label-sm uppercase text-ink-muted">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={[
            'text-display-lg',
            tone === 'nominal'
              ? 'text-nominal'
              : tone === 'urgent'
                ? 'text-urgent'
                : 'text-ink',
          ].join(' ')}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-code-dense text-ink-muted">{unit}</span>
        )}
      </p>
      <p className="mt-2 border-t border-line pt-2 font-dense text-body-sm text-ink-muted">
        {caption}
      </p>
    </Panel>
  )
}

function LegendSwatch({ kind }) {
  if (kind === 'movement') return <span className="size-3 rounded-sm bg-ink" />
  if (kind === 'optimized') return <span className="size-3 rounded-sm bg-accent" />
  if (kind === 'window')
    return (
      <span className="window-hatch size-3 rounded-sm border border-dashed border-accent-hover" />
    )
  if (kind === 'candidate')
    return <span className="size-3 rounded-sm border border-line bg-surface" />
  return (
    <span className="flex items-center gap-1">
      <span className="size-3 rounded-sm border border-warning-line bg-warning-tint" />
      <TriangleAlert className="size-3 text-warning" strokeWidth={2} />
    </span>
  )
}

/* --- Selected / deferred task presentation ------------------------------- */

function TaskCard({ task, lead, slot, onToggle }) {
  return (
    <div
      className={[
        'rounded border p-3',
        lead ? 'border-accent bg-accent-wash/40' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Ref tone={lead ? 'ink' : 'default'}>{task.id}</Ref>
        <span className="text-body-lg font-semibold text-ink">{task.title}</span>
        <span
          className={[
            'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
            chipTone[PRIORITY_TONE[task.priority]],
          ].join(' ')}
        >
          {task.priority}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="group ml-auto inline-flex cursor-pointer items-center gap-1 text-body-md text-nominal hover:text-urgent"
          title="Remove from block"
        >
          Selected
          <Check className="size-3.5 group-hover:hidden" strokeWidth={2.5} />
          <Minus className="hidden size-3.5 group-hover:block" strokeWidth={2.5} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-2">
        <span className="text-body-md text-ink-muted">
          {task.department} · {task.discipline}
        </span>
        <span className="font-dense text-body-md font-semibold text-ink">
          {slot}
        </span>
      </div>
    </div>
  )
}

function TaskRow({ task, onToggle, selected }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-l-[3px] border-l-transparent px-3.5 py-3 transition-colors hover:border-l-accent hover:bg-canvas">
      <Ref>{task.id}</Ref>
      <span className="text-body-md text-ink">{task.title}</span>
      <span
        className={[
          'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
          chipTone[PRIORITY_TONE[task.priority]],
        ].join(' ')}
      >
        {task.priority}
      </span>
      <span className="font-dense text-body-sm text-ink-muted">
        {task.department} · {task.minutes} min
      </span>

      {selected ? (
        <Chip tone="warning" className="ml-auto">
          <TriangleAlert className="size-3" strokeWidth={2} />
          Needs review
        </Chip>
      ) : (
        <Chip tone="neutral" className="ml-auto">
          Deferred
        </Chip>
      )}

      <Button size="compact" variant="secondary" uppercase onClick={onToggle}>
        <Plus className="size-3" strokeWidth={2.5} />
        Add
      </Button>

      {task.reason && (
        <p className="w-full font-dense text-body-sm text-ink-subtle">
          {task.reason}
        </p>
      )}
    </div>
  )
}

/* --- The board ----------------------------------------------------------- */

function Board({ plan, windowSpec }) {
  const { windowStart, windowEnd } = plan
  const span = windowEnd - windowStart

  const pct = (minutes) => ((minutes - windowStart) / span) * 100
  const box = (start, end) => ({
    left: `${pct(start)}%`,
    width: `${((end - start) / span) * 100}%`,
  })

  /* Quarter-hour ticks across the window. */
  const ticks = []
  for (let m = windowStart; m <= windowEnd; m += 15) ticks.push(m)

  return (
    <div className="overflow-x-auto p-3.5 scrollbar-industrial">
      <div className="min-w-[820px]">
        {/* Axis */}
        <div className="flex items-end">
          <span
            className="shrink-0 pr-3 text-label-sm uppercase text-ink-muted"
            style={{ width: GUTTER }}
          >
            Timeline Axis
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

        <div className="mt-2 space-y-2.5">
          {/* Lane 1 — train movements (hard constraints) */}
          <Lane label="Lane 1: Train Movements" height={52}>
            {plan.movements.map((movement) => (
              <div
                key={movement.id}
                className="absolute inset-y-1.5 flex items-center justify-center gap-1.5 rounded bg-ink px-2"
                style={box(movement.start, movement.end)}
                title={`${movement.label} · ${movement.from}–${movement.to}`}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate font-mono text-[10px] text-surface">
                  {movement.from}–{movement.to}
                </span>
              </div>
            ))}
          </Lane>

          {/* Lane 2 — the available maintenance window */}
          <Lane label="Lane 2: Available Window" height={52}>
            <div
              className="window-hatch absolute inset-y-1.5 flex items-center justify-between gap-2 rounded border border-dashed border-accent-hover px-2.5"
              style={box(windowStart, windowEnd)}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Dot tone="accent" />
                <span className="truncate text-label-sm uppercase text-accent-deep">
                  Available Maintenance Window
                </span>
                <span className="hidden font-mono text-code-dense text-ink-muted lg:inline">
                  ({windowSpec.from} – {windowSpec.to})
                </span>
              </span>
              <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-body-sm text-ink">
                Available · {plan.windowMinutes} min opportunity
              </span>
            </div>
          </Lane>

          {/* Lane 3 — candidate and optimized maintenance */}
          <Lane
            label="Lane 3: Candidate & Optimized"
            height={128}
            note={
              <span className="mt-2 block rounded border border-line bg-surface p-2">
                <span className="block text-label-sm uppercase text-ink">
                  Buffer Slack Logic
                </span>
                <span className="mt-1 block text-body-sm text-ink-muted">
                  Slack is calculated around hard train movements.
                </span>
              </span>
            }
          >
            {/* Preserved slack, drawn behind the allocations */}
            {plan.slackGaps.map((gap) => (
              <div
                key={`slack-${gap.start}`}
                className="absolute inset-y-2 flex flex-col items-center justify-center gap-0.5 rounded border border-dashed border-line bg-canvas/70 px-1 text-center"
                style={box(gap.start, gap.end)}
                title={`Unused window / buffer slack: ${gap.minutes} min`}
              >
                {gap.minutes >= 15 ? (
                  <>
                    <span className="truncate text-[10px] leading-tight text-ink-muted">
                      Unused Window / Buffer Slack
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-ink">
                      {gap.minutes} min
                    </span>
                    <span className="font-mono text-[9px] text-ink-subtle">
                      ({toClock(gap.start)}–{toClock(gap.end)})
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-[9px] leading-tight text-ink-subtle">
                    {gap.minutes}m
                    <br />
                    slack
                  </span>
                )}
              </div>
            ))}

            {/* Optimized allocations */}
            {plan.placements.map((placement) => (
              <div
                key={`placement-${placement.start}`}
                className={[
                  'absolute inset-y-2 rounded',
                  placement.joint
                    ? 'border-2 border-accent bg-accent-wash/70'
                    : 'border border-accent-hover bg-accent-wash/50',
                ].join(' ')}
                style={box(placement.start, placement.end)}
              >
                {placement.joint && (
                  <span className="absolute -top-2 left-1.5 flex items-center gap-1.5 rounded border border-accent-line bg-surface px-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-accent-deep">
                    <span className="size-1 rounded-full bg-accent" />
                    Joint Maintenance · Compatible Window &amp; Resources
                  </span>
                )}

                <div className="flex h-full flex-col justify-center gap-1.5 px-1.5 pt-2">
                  {placement.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex h-7 items-center gap-1.5 overflow-hidden rounded border border-accent-hover bg-accent px-1.5"
                      style={{
                        width: `${(task.minutes / placement.envelope) * 100}%`,
                      }}
                      title={`${task.id} · ${task.title} · ${toClock(task.start)}–${toClock(task.end)}`}
                    >
                      <span className="shrink-0 rounded bg-surface/90 px-1 font-mono text-[10px] text-ink">
                        {task.id}
                      </span>
                      <span className="shrink-0 rounded bg-ink px-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-accent">
                        Optimized
                      </span>
                      <span className="truncate font-mono text-[10px] text-ink">
                        {toClock(task.start)}–{toClock(task.end)} ({task.minutes}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Lane>

          {/* Contention row — candidates that did not fit */}
          <div className="flex items-start">
            <span className="shrink-0 pr-3" style={{ width: GUTTER }} />
            <div className="flex flex-1 flex-wrap items-center gap-2 rounded border border-line bg-canvas px-2.5 py-2">
              {plan.deferred.slice(0, 2).map((task) => (
                <span key={task.id} className="flex items-center gap-1.5">
                  <Ref>{task.id}</Ref>
                  <span className="text-body-sm text-ink">
                    {task.title} · {task.minutes} min
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-warning-line bg-warning-tint px-1.5 py-0.5 text-body-sm text-warning">
                    <TriangleAlert className="size-3" strokeWidth={2} />
                    Constraint contention
                  </span>
                </span>
              ))}
              {plan.deferred.length === 0 && (
                <span className="flex items-center gap-1.5 text-body-sm text-nominal">
                  <CircleCheck className="size-3.5" strokeWidth={2} />
                  All candidates allocated
                </span>
              )}
              <span className="ml-auto font-mono text-code-dense text-ink-muted">
                Total unused window:{' '}
                <span className="font-semibold text-ink">
                  {plan.slackMinutes} min
                </span>{' '}
                slack buffer preserved
              </span>
            </div>
          </div>
        </div>

        {/* Feasibility footnote */}
        <p className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-body-sm text-ink-muted">
            <CircleCheck className="size-3.5 shrink-0 text-nominal" strokeWidth={2} />
            Allocations sit clear of every timetabled movement — slack is held,
            not filled.
          </span>
          <span className="font-mono text-code-dense text-ink-subtle">
            {plan.possessionMinutes}m possession · {plan.slackMinutes}m slack ·{' '}
            {plan.conflicts.length} conflict
            {plan.conflicts.length === 1 ? '' : 's'}
          </span>
        </p>
      </div>
    </div>
  )
}

function Lane({ label, height = 52, note, children }) {
  return (
    <div className="flex items-stretch">
      <div className="shrink-0 pr-3" style={{ width: GUTTER }}>
        <span className="block pt-1.5 text-body-md font-semibold text-ink">
          {label}
        </span>
        {note}
      </div>
      <div
        className="relative flex-1 rounded border border-line bg-surface"
        style={{ height }}
      >
        {/* Quarter-hour gridlines */}
        <div
          className="pointer-events-none absolute inset-0 rounded"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--color-line) 0 1px, transparent 1px 12.5%)',
          }}
        />
        {children}
      </div>
    </div>
  )
}
