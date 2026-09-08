import {
  ArrowLeft,
  Check,
  CircleCheck,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref } from '../components/ui/Chip'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import {
  defaultSelection,
  defaults,
  optimizePlan,
  parseWindow,
  toClock,
} from '../data/blockPlanning'
import { MIN_BUFFER_MIN, validatePlan } from '../data/planValidation'
import { system } from '../data/smartRail'

const GUTTER = 148

/* Diagonal red hatch marking a genuine overlap. Local to this screen. */
const CONFLICT_HATCH = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(217,56,58,0.35) 0 5px, rgba(217,56,58,0.12) 5px 10px)',
}

export default function PlanValidation() {
  useHeader(['Planning Workspace', 'Plan Validation'])

  const { state } = useLocation()

  /* Inputs arrive from Block Planning. Re-running the same deterministic
     optimizer here reproduces the identical plan — nothing is re-decided. */
  const inputs = useMemo(
    () => ({
      version: state?.version ?? 1,
      generatedAt: state?.generatedAt ?? defaults.generatedAt,
      section: state?.section ?? defaults.section,
      windowLabel: state?.windowLabel ?? defaults.window,
      mode: state?.mode ?? defaults.mode,
      date: state?.date ?? defaults.date,
      selectedIds: state?.selectedIds ?? defaultSelection,
    }),
    [state],
  )

  const plan = useMemo(
    () =>
      optimizePlan({
        selectedIds: inputs.selectedIds,
        window: parseWindow(inputs.windowLabel),
      }),
    [inputs],
  )

  const result = useMemo(() => validatePlan(plan), [plan])
  const [routed, setRouted] = useState(false)

  return (
    <PageBody>
      {/* 1 — Plan header */}
      <PageHeader
        title="Plan Validation"
        badge={
          <>
            <Ref tone="ink">Plan V{inputs.version}</Ref>
            <Chip tone="neutral">◆ {system.disclaimer}</Chip>
          </>
        }
        subtitle="Deterministic feasibility checks on the generated optimized plan."
        actions={
          <>
            <Button to="/app/planning" variant="secondary">
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Back to Block Planning
            </Button>
            <Button
              variant="primary"
              uppercase
              disabled={!result.passed || routed}
              onClick={() => setRouted(true)}
            >
              <ShieldCheck className="size-3.5" strokeWidth={2.25} />
              Review Plan
            </Button>
          </>
        }
        meta={
          <p className="flex flex-wrap items-center justify-end gap-x-2.5 text-body-sm">
            <span className="text-ink-muted">
              Generated from SMART-Rail optimization
            </span>
            <span className="font-mono text-code-dense text-ink-muted">
              · {inputs.date} · {result.windowLabel} · {inputs.mode}
            </span>
          </p>
        }
      />

      {/* 3 — Visual timeline (the hero) */}
      <Panel>
        <PanelHeader
          dense
          title="Validation Timeline"
          subtitle="Maintenance allocation against timetabled movements and safety buffers."
          actions={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <LegendItem swatch={<span className="size-3 rounded-sm bg-accent" />}>
                Maintenance
              </LegendItem>
              <LegendItem swatch={<span className="size-3 rounded-sm bg-ink" />}>
                Train Movement
              </LegendItem>
              <LegendItem
                swatch={
                  <span className="window-hatch size-3 rounded-sm border border-dashed border-accent-hover" />
                }
              >
                Safety Buffer
              </LegendItem>
              {result.conflicts.length > 0 && (
                <LegendItem
                  swatch={
                    <span
                      className="size-3 rounded-sm border border-urgent"
                      style={CONFLICT_HATCH}
                    />
                  }
                >
                  Conflict
                </LegendItem>
              )}
            </div>
          }
        />
        <ValidationTimeline plan={plan} result={result} />
      </Panel>

      {/* 4 — Validation result */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <ResultBanner result={result} version={inputs.version} routed={routed} />

        {/* 5 — Validation details, compact indicators */}
        <Panel>
          <PanelHeader dense title="Validation Details" />
          <ul className="grid gap-2 p-3.5 sm:grid-cols-2">
            {result.checks.map((check) => (
              <li
                key={check.key}
                className={[
                  'flex items-start gap-2.5 rounded border p-2.5',
                  check.ok
                    ? 'border-nominal-line bg-nominal-tint'
                    : 'border-urgent-line bg-urgent-tint',
                ].join(' ')}
              >
                <span
                  className={[
                    'mt-px grid size-5 shrink-0 place-items-center rounded-full',
                    check.ok ? 'bg-nominal' : 'bg-urgent',
                  ].join(' ')}
                >
                  {check.ok ? (
                    <Check className="size-3 text-surface" strokeWidth={3} />
                  ) : (
                    <X className="size-3 text-surface" strokeWidth={3} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-label-sm uppercase text-ink-muted">
                      {check.label}
                    </span>
                    <span
                      className={[
                        'text-body-md font-semibold',
                        check.ok ? 'text-nominal' : 'text-urgent',
                      ].join(' ')}
                    >
                      {check.ok ? check.pass : check.fail}
                    </span>
                  </span>
                  <span className="mt-0.5 block font-dense text-body-sm text-ink-muted">
                    {check.metric}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* 6 — Supporting information */}
      <Panel className="mt-4">
        <PanelHeader dense title="Plan Under Validation" />
        <div className="grid gap-x-6 gap-y-3 p-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Eyebrow className="mb-2">Allocated Work</Eyebrow>
            <ul className="space-y-1.5">
              {plan.placements.map((placement) =>
                placement.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center gap-2 rounded border border-line bg-canvas px-2.5 py-2"
                  >
                    <Ref>{task.id}</Ref>
                    <span className="text-body-md text-ink">{task.title}</span>
                    {placement.joint && (
                      <Chip tone="accent">Joint</Chip>
                    )}
                    <span className="ml-auto font-dense text-body-md text-ink-muted">
                      {task.department} · {toClock(task.start)}–
                      {toClock(task.end)} ({task.minutes}m)
                    </span>
                  </li>
                )),
              )}
              {plan.placedTasks.length === 0 && (
                <li className="rounded border border-dashed border-line bg-canvas px-2.5 py-3 text-center text-body-md text-ink-muted">
                  No work allocated in this plan.
                </li>
              )}
            </ul>
          </div>

          <div>
            <Eyebrow className="mb-2">Window Accounting</Eyebrow>
            <dl className="divide-y divide-line rounded border border-line bg-canvas px-2.5">
              <Row label="Block window" value={`${plan.windowMinutes} min`} />
              <Row
                label="Maintenance possession"
                value={`${plan.possessionMinutes} min`}
              />
              <Row
                label="Timetabled movements"
                value={`${plan.movementMinutes} min`}
              />
              <Row label="Slack held" value={`${plan.slackMinutes} min`} />
              <Row
                label="Minimum clearance"
                value={
                  result.minClearance === null
                    ? '—'
                    : `${result.minClearance} min (min ${MIN_BUFFER_MIN})`
                }
              />
              <Row
                label="Deferred candidates"
                value={String(plan.deferred.length)}
              />
            </dl>
          </div>
        </div>
      </Panel>

      <p className="mt-4 text-body-sm text-ink-subtle">
        ◆ {system.disclaimer} · Deterministic checks only. This screen does not
        grant possession, alter train movements or issue operational release.
      </p>
    </PageBody>
  )
}

/* -------------------------------------------------------------------------- */

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-body-md text-ink-muted">{label}</dt>
      <dd className="font-dense text-body-md font-semibold text-ink">{value}</dd>
    </div>
  )
}

function LegendItem({ swatch, children }) {
  return (
    <span className="flex items-center gap-1.5 text-body-sm text-ink-muted">
      {swatch}
      {children}
    </span>
  )
}

function ResultBanner({ result, version, routed }) {
  if (result.empty) {
    return (
      <Panel className="border-line p-4">
        <Eyebrow>Validation Result</Eyebrow>
        <p className="mt-2 text-headline-lg text-ink-muted">NO PLAN TO VALIDATE</p>
        <p className="mt-1.5 text-body-md text-ink-muted">
          Select at least one candidate in Block Planning.
        </p>
      </Panel>
    )
  }

  const passed = result.passed

  return (
    <Panel
      className={[
        'p-4',
        passed
          ? 'border-nominal-line bg-nominal-tint'
          : 'border-urgent-line bg-urgent-tint',
      ].join(' ')}
    >
      <Eyebrow>Validation Result</Eyebrow>

      <div className="mt-2.5 flex items-center gap-3">
        <span
          className={[
            'grid size-11 shrink-0 place-items-center rounded-md',
            passed ? 'bg-nominal' : 'bg-urgent',
          ].join(' ')}
        >
          {passed ? (
            <CircleCheck className="size-6 text-surface" strokeWidth={2} />
          ) : (
            <TriangleAlert className="size-6 text-surface" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0">
          <p
            className={[
              'text-display-lg leading-none',
              passed ? 'text-nominal' : 'text-urgent',
            ].join(' ')}
          >
            {passed ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}
          </p>
          <p className="mt-1.5 text-body-lg font-semibold text-ink">
            {passed
              ? 'Ready for Authorized Review'
              : `${result.failed.length} check${result.failed.length === 1 ? '' : 's'} require planner attention`}
          </p>
        </div>
      </div>

      <p className="mt-3 border-t border-line pt-3 text-body-md text-ink-muted">
        {passed
          ? 'Plan V' +
            version +
            ' passed all deterministic feasibility checks. Authorized human review is the next step.'
          : 'Return to Block Planning and adjust the candidate selection or window.'}
      </p>

      {/* Failed checks surfaced with their reason */}
      {!passed && (
        <ul className="mt-2.5 space-y-1.5">
          {result.failed.map((check) => (
            <li
              key={check.key}
              className="flex items-start gap-2 rounded border border-urgent-line bg-surface px-2.5 py-2"
            >
              <X className="mt-px size-3.5 shrink-0 text-urgent" strokeWidth={2.5} />
              <span className="min-w-0">
                <span className="block text-body-md font-semibold text-urgent">
                  {check.title}
                </span>
                <span className="mt-0.5 block font-dense text-body-sm text-ink-muted">
                  {check.fail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {routed && passed && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded border border-telemetry-line bg-telemetry-tint px-2.5 py-2 text-body-md">
          <ShieldCheck className="size-4 shrink-0 text-telemetry" strokeWidth={2} />
          <span className="font-semibold text-ink">
            Plan V{version} routed for authorized review.
          </span>
          <span className="text-ink-muted">
            No possession is granted by this step.
          </span>
        </p>
      )}
    </Panel>
  )
}

/* --- Timeline ------------------------------------------------------------- */

function ValidationTimeline({ plan, result }) {
  const { windowStart, windowEnd } = plan
  const span = windowEnd - windowStart

  const pct = (minutes) => ((minutes - windowStart) / span) * 100
  const box = (start, end) => ({
    left: `${pct(start)}%`,
    width: `${((end - start) / span) * 100}%`,
  })

  const ticks = []
  for (let m = windowStart; m <= windowEnd; m += 15) ticks.push(m)

  return (
    <div className="overflow-x-auto p-3.5 scrollbar-industrial">
      <div className="min-w-[760px]">
        {/* Axis */}
        <div className="flex items-end">
          <span
            className="shrink-0 pr-3 text-label-sm uppercase text-ink-muted"
            style={{ width: GUTTER }}
          >
            Block Window
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

        <div className="mt-2 space-y-2">
          {/* Train movements — hard timetable facts */}
          <Track label="Train Movements">
            {plan.movements.map((movement) => (
              <div
                key={movement.id}
                className="absolute inset-y-1 flex items-center justify-center gap-1.5 rounded bg-ink px-2"
                style={box(movement.start, movement.end)}
                title={`${movement.label} · ${movement.from}–${movement.to}`}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate font-mono text-[10px] text-surface">
                  {movement.from}–{movement.to}
                </span>
              </div>
            ))}
          </Track>

          {/* Maintenance allocation, with joint pairs in one envelope */}
          <Track label="Maintenance" height={64}>
            {plan.slackGaps.map((gap) => (
              <div
                key={`slack-${gap.start}`}
                className="absolute inset-y-1 rounded border border-dashed border-line bg-canvas/60"
                style={box(gap.start, gap.end)}
                title={`Slack held: ${gap.minutes} min`}
              />
            ))}

            {plan.placements.map((placement) => (
              <div
                key={`p-${placement.start}`}
                className={[
                  'absolute inset-y-1 rounded',
                  placement.joint
                    ? 'border-2 border-accent bg-accent-wash/70'
                    : 'border border-accent-hover bg-accent-wash/50',
                ].join(' ')}
                style={box(placement.start, placement.end)}
              >
                {placement.joint && (
                  <span className="absolute -top-1.5 left-1.5 flex items-center gap-1 rounded border border-accent-line bg-surface px-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-accent-deep">
                    <span className="size-1 rounded-full bg-accent" />
                    Joint
                  </span>
                )}
                <div className="flex h-full flex-col justify-center gap-1 px-1 pt-1.5">
                  {placement.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex h-6 items-center gap-1.5 overflow-hidden rounded border border-accent-hover bg-accent px-1.5"
                      style={{
                        width: `${(task.minutes / placement.envelope) * 100}%`,
                      }}
                      title={`${task.id} · ${task.title} · ${toClock(task.start)}–${toClock(task.end)}`}
                    >
                      <span className="shrink-0 rounded bg-surface/90 px-1 font-mono text-[9px] text-ink">
                        {task.id}
                      </span>
                      <span className="truncate font-mono text-[9px] text-ink">
                        {toClock(task.start)}–{toClock(task.end)} ({task.minutes}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Conflicts drawn over the allocation so they cannot be missed */}
            {result.conflicts.map((conflict) => (
              <div
                key={`c-${conflict.start}-${conflict.movement}`}
                className="absolute inset-y-0 z-20 flex items-start justify-center rounded border-2 border-urgent"
                style={{ ...box(conflict.start, conflict.end), ...CONFLICT_HATCH }}
                title={`${conflict.tasks.join('+')} overlaps ${conflict.movement} by ${conflict.minutes}m`}
              >
                <span className="-mt-2 flex items-center gap-1 rounded bg-urgent px-1 text-[9px] font-semibold uppercase text-surface">
                  <TriangleAlert className="size-2.5" strokeWidth={2.5} />
                  {conflict.minutes}m
                </span>
              </div>
            ))}
          </Track>

          {/* Safety buffer envelopes either side of every movement */}
          <Track label={`Safety Buffers (${MIN_BUFFER_MIN}m)`} height={30}>
            {result.zones.map((zone) => (
              <div
                key={`z-${zone.movement}-${zone.edge}`}
                className="window-hatch absolute inset-y-1 rounded border border-dashed border-accent-hover"
                style={box(zone.start, zone.end)}
                title={`${MIN_BUFFER_MIN}m buffer ${zone.edge} ${zone.movement}`}
              />
            ))}
          </Track>
        </div>

        {/* Feasibility summary line */}
        <p className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <span
            className={[
              'flex items-center gap-1.5 text-body-sm',
              result.passed ? 'text-nominal' : 'text-urgent',
            ].join(' ')}
          >
            {result.passed ? (
              <CircleCheck className="size-3.5 shrink-0" strokeWidth={2} />
            ) : (
              <TriangleAlert className="size-3.5 shrink-0" strokeWidth={2} />
            )}
            {result.passed
              ? 'Allocation sits clear of every movement and buffer.'
              : 'Allocation breaches one or more deterministic constraints.'}
          </span>
          <span className="flex items-center gap-2.5 font-mono text-code-dense text-ink-subtle">
            <span className="flex items-center gap-1.5">
              <Dot tone={result.passed ? 'nominal' : 'urgent'} />
              {plan.possessionMinutes}m possession
            </span>
            <span>· {plan.slackMinutes}m slack</span>
            <span>· {result.conflicts.length} overlap</span>
          </span>
        </p>
      </div>
    </div>
  )
}

function Track({ label, height = 38, children }) {
  return (
    <div className="flex items-stretch">
      <span
        className="flex shrink-0 items-center pr-3 text-body-md font-semibold text-ink"
        style={{ width: GUTTER }}
      >
        {label}
      </span>
      <div
        className="relative flex-1 rounded border border-line bg-surface"
        style={{ height }}
      >
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
