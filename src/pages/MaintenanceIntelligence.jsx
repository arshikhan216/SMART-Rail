import {
  ArrowLeft,
  CircleCheck,
  CirclePlus,
  MapPin,
  Move,
  Pause,
  Play,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useHeader } from '../components/shell/AppShell'
import { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref } from '../components/ui/Chip'
import { Meter } from '../components/ui/Meter'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import {
  assetImpactDetail,
  currentAssessment,
  intelligenceNodes,
  system,
  taskById,
  tasks,
} from '../data/smartRail'
import { chipTone, textTone } from '../lib/tones'

const DETAIL_ICONS = { CircleCheck, TriangleAlert }

export default function MaintenanceIntelligence() {
  const { taskId } = useParams()
  const task = taskById(taskId) ?? tasks[1]

  useHeader(['Maintenance Tasks', task.id])

  const [selected, setSelected] = useState('04')
  const [running, setRunning] = useState(true)

  return (
    <PageBody>
      {/* Contextual header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav className="flex items-center gap-2 text-body-sm">
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-1.5 text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Task Details
            </Link>
            <span className="text-ink-subtle">/</span>
            <span className="text-label-sm uppercase text-ink-muted">
              Intelligence Synthesis
            </span>
          </nav>

          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-display-lg text-ink">Maintenance Intelligence</h1>
            <Ref>TASK-REF: {task.id}</Ref>
          </div>
          <p className="mt-1 max-w-lg text-body-lg text-ink-muted">
            Visual analysis of maintenance priority, duration, asset impact and
            planning compatibility.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded border border-accent-line bg-accent-wash px-3 py-2">
            <p className="flex items-center gap-2 text-body-md font-semibold text-ink">
              <Dot tone="accent" />
              {task.id} · {task.title}
            </p>
            <p className="mt-0.5 pl-3.5 text-body-sm text-ink-muted">
              {task.section} · Track Segment
            </p>
          </div>
          <Chip tone="ink">◆ {system.disclaimer}</Chip>
        </div>
      </div>

      {/* Split workspace: graph 60% / assessment 40% */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            dense
            title={
              <span className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded bg-canvas font-mono text-[10px] text-ink-muted">
                  {intelligenceNodes.length}
                </span>
                Decision Support Graph
              </span>
            }
            actions={
              <>
                <Button
                  size="compact"
                  variant="quiet"
                  onClick={() => setRunning((value) => !value)}
                >
                  {running ? (
                    <Pause className="size-3" strokeWidth={2} />
                  ) : (
                    <Play className="size-3" strokeWidth={2} />
                  )}
                  {running ? 'Pause Motion' : 'Resume Motion'}
                </Button>
                <span
                  className="grid size-7 place-items-center rounded border border-line text-ink-muted"
                  title="Drag to reposition"
                >
                  <Move className="size-3.5" strokeWidth={2} />
                </span>
              </>
            }
          />

          <div className="p-4">
            <OrbitGraph
              selected={selected}
              onSelect={setSelected}
              running={running}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <ul className="flex flex-wrap items-center gap-4">
                <li className="flex items-center gap-1.5 text-body-sm text-ink-muted">
                  <Dot tone="accent" /> Active Selection
                </li>
                <li className="flex items-center gap-1.5 text-body-sm text-ink-muted">
                  <Dot tone="neutral" /> Passive Evaluator
                </li>
                <li className="flex items-center gap-1.5 text-body-sm text-ink-muted">
                  <Dot tone="urgent" /> Constraint / Severity
                </li>
              </ul>
              <p className="font-mono text-code-dense text-ink-subtle">
                RailNet Intelligence Engine · Orbit Revolution Cycle 55s
              </p>
            </div>
          </div>
        </Panel>

        {/* Current assessment */}
        <Panel className="flex flex-col">
          <PanelHeader
            eyebrow="Summary"
            title="Current Assessment"
            dense
            actions={
              <span className="grid size-7 place-items-center rounded border border-line text-ink-muted">
                <CircleCheck className="size-3.5" strokeWidth={2} />
              </span>
            }
          />

          <div className="flex-1 p-4">
            <dl className="divide-y divide-line">
              {currentAssessment.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0"
                >
                  <dt className="text-body-md text-ink-muted">{row.label}</dt>
                  <dd className="text-right">
                    {row.tone ? (
                      <span
                        className={[
                          'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
                          chipTone[row.tone],
                        ].join(' ')}
                      >
                        {row.value}
                      </span>
                    ) : (
                      <span className="font-dense text-body-md font-semibold text-ink">
                        {row.value}
                      </span>
                    )}
                    {row.caption && (
                      <span className="mt-0.5 block font-mono text-code-dense text-ink-subtle">
                        {row.caption}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Location & gang */}
            <div className="mt-3 rounded border border-line bg-canvas p-3">
              <div className="mb-2 flex items-center justify-between">
                <Eyebrow>Location &amp; Gang</Eyebrow>
                <MapPin className="size-3.5 text-ink-muted" strokeWidth={2} />
              </div>
              <dl className="space-y-1.5">
                <LocationRow label="Corridor" value={task.corridor ?? 'Midland Main Line'} />
                <LocationRow
                  label="Section"
                  value={`${task.section.replace('Section ', 'Sec-')} (${task.km})`}
                />
                <LocationRow label="Assigned Gang" value={task.gang ?? 'Depot Gang 04'} />
              </dl>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-body-md text-ink-muted">System Status:</span>
            <Chip tone="neutral">Simulated Planning Candidate</Chip>
          </footer>
        </Panel>
      </div>

      {/* Commitment bar */}
      <Panel className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <Button to="/app/tasks" variant="ghost">
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Back to Task Details
          </Button>
          <p className="text-body-md text-ink-muted">
            Adds this task to the candidate block planning queue
          </p>
          <Button to="/app/planning" variant="primary" uppercase>
            <CirclePlus className="size-4" strokeWidth={2} />
            Add to Block Planning
          </Button>
        </div>
      </Panel>
    </PageBody>
  )
}

function LocationRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-body-sm text-ink-muted">{label}:</dt>
      <dd className="font-mono text-code-dense text-ink">{value}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/* Six evaluators orbit a shared centre. The ring rotates on a 55s cycle; the
   node cards counter-rotate so their labels stay upright and readable. */
function OrbitGraph({ selected, onSelect, running }) {
  const detail = intelligenceNodes.find((node) => node.id === selected)

  return (
    <div className="relative">
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        {/* Orbit path */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="var(--color-ink-subtle)"
            strokeWidth="1"
            strokeDasharray="3 7"
            opacity="0.7"
          />
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="26"
            opacity="0.25"
          />
        </svg>

        <div
          className={[
            'absolute inset-0',
            running ? 'animate-orbit motion-reduce:animate-none' : '',
          ].join(' ')}
        >
          {intelligenceNodes.map((node, index) => {
            const angle =
              (-90 + index * (360 / intelligenceNodes.length)) * (Math.PI / 180)
            const x = 50 + 37.5 * Math.cos(angle)
            const y = 50 + 37.5 * Math.sin(angle)
            const isSelected = node.id === selected
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={[
                    running ? 'animate-orbit-counter motion-reduce:animate-none' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    aria-pressed={isSelected}
                    className={[
                      'flex w-[150px] cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-left transition-colors',
                      isSelected
                        ? 'border-accent bg-accent-wash'
                        : 'border-line bg-surface hover:border-ink',
                    ].join(' ')}
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded bg-canvas font-mono text-[10px] text-ink-muted">
                      {node.id}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink">
                        {node.title}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] leading-tight ${
                          node.tone === 'urgent'
                            ? 'text-urgent'
                            : node.tone === 'accent'
                              ? 'text-accent-deep'
                              : 'text-ink-muted'
                        }`}
                      >
                        {node.subtitle}
                      </span>
                    </span>
                    {node.tone !== 'neutral' && (
                      <span className="pt-0.5">
                        <Dot tone={node.tone} />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Expanded evaluator detail, held stationary at the centre */}
        <div className="absolute inset-x-[8%] top-1/2 -translate-y-1/2">
          {selected === '04' ? (
            <AssetImpactCard />
          ) : (
            <EvaluatorCard node={detail} />
          )}
        </div>
      </div>
    </div>
  )
}

function AssetImpactCard() {
  const card = assetImpactDetail
  return (
    <Panel elevated className="p-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
        <p className="text-label-md uppercase text-ink">
          <span className="text-ink-muted">{card.node}</span> · {card.title}
        </p>
        <span
          className={[
            'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
            chipTone.urgent,
          ].join(' ')}
        >
          {card.badge}
        </span>
      </div>

      <Eyebrow className="mt-3">Criticality Threshold</Eyebrow>
      <div className="mt-1.5 flex overflow-hidden rounded border border-line">
        {card.thresholds.map((threshold) => {
          const active = threshold === card.active
          return (
            <span
              key={threshold}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 py-1.5 text-label-sm uppercase',
                active
                  ? 'bg-urgent text-surface'
                  : 'bg-canvas text-ink-muted',
              ].join(' ')}
            >
              {threshold}
              {active && <span className="size-1.5 rounded-full bg-surface" />}
            </span>
          )
        })}
      </div>

      <ul className="mt-3 divide-y divide-line border-y border-line">
        {card.rows.map((row) => {
          const Icon = DETAIL_ICONS[row.icon]
          return (
            <li key={row.label} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-body-md text-ink">
                  <Icon
                    className={`size-3.5 shrink-0 ${textTone[row.tone]}`}
                    strokeWidth={2}
                  />
                  {row.label}
                </span>
                <span
                  className={`flex items-center gap-1.5 font-dense text-body-md ${textTone[row.tone]}`}
                >
                  {row.value}
                  {row.tone === 'urgent' && <Dot tone="urgent" />}
                </span>
              </div>
              {row.meter != null && (
                <Meter value={row.meter} tone="accent" className="mt-1.5" />
              )}
            </li>
          )
        })}
      </ul>

      <p className="mt-2.5 flex gap-2 text-body-sm text-ink-muted">
        <TriangleAlert className="mt-px size-3.5 shrink-0 text-warning" strokeWidth={2} />
        {card.note}
      </p>
    </Panel>
  )
}

function EvaluatorCard({ node }) {
  if (!node) return null
  return (
    <Panel elevated className="p-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
        <p className="text-label-md uppercase text-ink">
          <span className="text-ink-muted">NODE {node.id}</span> · {node.title}
        </p>
        <span
          className={[
            'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
            chipTone[node.tone === 'neutral' ? 'neutral' : node.tone],
          ].join(' ')}
        >
          {node.subtitle}
        </span>
      </div>
      <p className="mt-2.5 text-body-md text-ink-muted">
        Passive evaluator contributing to the composite planning score. Select
        node 04 for the full asset-impact breakdown.
      </p>
      <p className="mt-2.5 border-t border-line pt-2.5 font-mono text-code-dense text-ink-subtle">
        Weighted into candidate ranking · P1 active
      </p>
    </Panel>
  )
}
