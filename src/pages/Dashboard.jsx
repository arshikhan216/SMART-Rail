import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import { useHeader } from '../components/shell/AppShell'
import Button from '../components/ui/Button'
import { AiTag, Chip, Dot, StatusChip } from '../components/ui/Chip'
import { CorridorBar } from '../components/ui/Meter'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import Loader from '../components/ui/Loader'
import {
  blockOpportunities,
  corridors,
  dashboardKpis,
  feedEvents,
  recommendations,
  system,
  tasks,
} from '../data/smartRail'
import { chipTone, priorityTone, riskTone, textTone } from '../lib/tones'

const KPI_ICONS = { TriangleAlert, CalendarClock, TrendingUp, Activity }

export default function Dashboard() {
  useHeader(['Selected Division'])
  const [showLoader, setShowLoader] = useState(true)

  return (
    <>
      {showLoader && (
        <Loader
          actualProgress={100}
          onComplete={() => setShowLoader(false)}
          brandLeft="SMART"
          brandRight="RAIL"
        />
      )}
      <PageBody>
      <PageHeader
        title="Dashboard"
        badge={
          <Chip tone="neutral">Selected Division · Prototype Dataset</Chip>
        }
        subtitle="Maintenance planning and operational intelligence across active corridors."
        actions={
          <>
            <Button variant="secondary" uppercase>
              <SlidersHorizontal className="size-3.5" strokeWidth={2} />
              Filter Register
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              <Plus className="size-3.5" strokeWidth={2.25} />
              Create / Plan Block
            </Button>
          </>
        }
      />

      {/* Operational KPIs */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon]
          return (
            <Panel key={kpi.label} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-label-sm uppercase text-ink-muted">
                  {kpi.label}
                </p>
                <Icon
                  className={`size-4 shrink-0 ${textTone[kpi.iconTone]}`}
                  strokeWidth={2}
                />
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <span className="text-display-lg text-ink">{kpi.value}</span>
                <Chip tone={kpi.delta.tone} dot={kpi.delta.tone !== 'neutral'}>
                  {kpi.delta.text}
                </Chip>
              </div>
              <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
                {kpi.caption}
              </p>
            </Panel>
          )
        })}
      </div>

      {/* AI recommendations — decision support, human authority */}
      <Panel className="mt-4">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent-hover" strokeWidth={2} />
              AI Recommendations
            </span>
          }
          subtitle="Actions identified from maintenance, block and operational constraints — decision support for authorized planners."
          actions={
            <span className="hidden items-center gap-1.5 rounded border border-accent-line bg-accent-wash px-2 py-1.5 text-body-sm text-accent-deep lg:inline-flex">
              <ShieldCheck className="size-3.5" strokeWidth={2} />
              AI Predicts &amp; Recommends · Human Authority Required
            </span>
          }
        />
        <div className="grid gap-2.5 p-4 xl:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.index} rec={rec} />
          ))}
        </div>
      </Panel>

      {/* Maintenance priority register */}
      <Panel className="mt-4">
        <PanelHeader
          title="Maintenance Priority"
          subtitle="Ranked by asset criticality, due window, and operational impact"
          actions={
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-1.5 text-body-md text-ink underline-offset-2 hover:underline"
            >
              View all tasks
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          }
        />
        <PriorityTable />
      </Panel>

      {/* Split view: opportunity queue beside corridor telemetry */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Upcoming Block Opportunities"
            subtitle="Identified windows evaluated for multi-department maintenance pairing"
            actions={
              <Link
                to="/app/planning"
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-body-md text-ink underline-offset-2 hover:underline"
              >
                View Block Planning
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {blockOpportunities.map((opportunity) => (
              <li
                key={opportunity.window + opportunity.section}
                className="flex items-center gap-3 border-l-[3px] border-l-transparent px-4 py-3 transition-colors hover:border-l-accent hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-mono text-body-md font-medium text-ink">
                      {opportunity.window}
                    </span>
                    <span className="text-body-md text-ink">
                      {opportunity.section}
                    </span>
                    <span className="text-body-sm text-ink-muted">
                      · {opportunity.minutes} min
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-body-sm text-ink-muted">
                    <span className="text-nominal">
                      {opportunity.compatible} compatible task
                      {opportunity.compatible === 1 ? '' : 's'}
                    </span>
                    <span className="text-ink-subtle">|</span>
                    Risk:
                    <span className={textTone[riskTone[opportunity.risk]]}>
                      {opportunity.risk}
                    </span>
                  </p>
                </div>
                <Button
                  to="/app/planning"
                  size="compact"
                  variant={opportunity.primary ? 'primary' : 'secondary'}
                  uppercase
                >
                  {opportunity.action}
                </Button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader
              title="Operational Status"
              subtitle="Corridor clearance schematic & possession blocks"
              actions={
                <span className="flex items-center gap-2.5 text-body-sm text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Dot tone="urgent" /> Conflict
                  </span>
                  <span className="flex items-center gap-1">
                    <Dot tone="accent" /> Window
                  </span>
                  <span className="flex items-center gap-1">
                    <Dot tone="nominal" /> Clear
                  </span>
                </span>
              }
            />
            <div className="space-y-3.5 p-4">
              {corridors.map((corridor) => (
                <div
                  key={corridor.name}
                  className="rounded border border-line bg-canvas p-2.5"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-body-md font-semibold text-ink">
                      {corridor.name}
                    </span>
                    <span className="font-mono text-code-dense text-ink-muted">
                      {corridor.km}
                    </span>
                  </div>
                  <CorridorBar segments={corridor.segments} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent Changes & Alerts"
              actions={
                <span className="flex items-center gap-1.5 text-body-sm text-ink-muted">
                  <Dot tone="nominal" />
                  Feed Active
                </span>
              }
            />
            <ul className="divide-y divide-line">
              {feedEvents.map((event) => (
                <li key={event.text} className="flex gap-2.5 px-4 py-2.5">
                  <span className="pt-1.5">
                    <Dot tone={event.tone} />
                  </span>
                  <p className="text-body-md text-ink-muted">
                    <span className="font-medium text-ink">{event.at}:</span>{' '}
                    {event.text}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <p className="mt-4 text-body-sm text-ink-subtle">
        {system.disclaimer} · Figures are simulated for demonstration and
        planning purposes only.
      </p>
    </PageBody>
    </>
  )
}

/* -------------------------------------------------------------------------- */

function RecommendationCard({ rec }) {
  const alert = rec.tone === 'urgent'
  return (
    <article
      className={[
        'flex flex-col rounded-md border p-3.5',
        alert
          ? 'border-urgent-line bg-urgent-tint/45'
          : 'border-line bg-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <AiTag>Recommendation {rec.index}</AiTag>
        <span
          className={[
            'text-right font-mono text-code-dense',
            alert ? 'text-urgent' : 'text-ink-muted',
          ].join(' ')}
        >
          {rec.tag}
        </span>
      </div>

      <h3 className="mt-2.5 text-headline-sm text-ink">{rec.title}</h3>
      <p className="mt-1.5 text-body-md text-ink">{rec.body}</p>
      <p className="mt-1 text-body-sm text-ink-muted">{rec.meta}</p>

      {rec.benefit && (
        <div
          className={[
            'mt-3 rounded border p-2.5',
            rec.index === '01'
              ? 'border-nominal-line bg-nominal-tint'
              : 'border-warning-line bg-warning-tint',
          ].join(' ')}
        >
          <p
            className={[
              'text-label-sm uppercase',
              rec.index === '01' ? 'text-nominal' : 'text-warning',
            ].join(' ')}
          >
            Expected Benefit:
          </p>
          <p
            className={[
              'mt-1 text-body-sm',
              rec.index === '01' ? 'text-nominal' : 'text-warning',
            ].join(' ')}
          >
            {rec.benefit}
          </p>
        </div>
      )}

      {rec.suggested && (
        <div className="mt-3 rounded border border-line bg-surface p-2.5">
          <p className="text-label-sm uppercase text-ink-muted">
            Suggested Action:
          </p>
          <p className="mt-1 text-body-sm text-ink">{rec.suggested}</p>
        </div>
      )}

      <div className="mt-3 border-t border-line pt-2.5">
        <Eyebrow className="mb-2">Why this recommendation?</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {rec.reasons.map((reason) => (
            <li
              key={reason}
              className={[
                'flex items-start gap-1.5 text-body-sm',
                alert ? 'text-urgent' : 'text-ink-muted',
              ].join(' ')}
            >
              {alert ? (
                <TriangleAlert className="mt-px size-3 shrink-0" strokeWidth={2} />
              ) : (
                <Check className="mt-px size-3 shrink-0 text-nominal" strokeWidth={2.5} />
              )}
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <Button
        to={rec.ctaTo}
        variant={rec.ctaVariant}
        full
        className="mt-3.5"
      >
        {rec.cta}
      </Button>
    </article>
  )
}

const COLUMNS = [
  'Priority',
  'Task',
  'Department',
  'Asset',
  'Due',
  'Predicted Duration',
  'Asset Impact',
  'Status',
  'Action',
]

function PriorityTable() {
  /* design.md § Data Tables — 32px alabaster header, 36px compact rows,
     tabular numerals across every time and duration column. */
  return (
    <div className="overflow-x-auto scrollbar-industrial">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="bg-canvas">
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="h-8 border-b border-line px-3 text-label-sm uppercase font-semibold text-ink-muted"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.slice(0, 5).map((task) => (
            <tr
              key={task.id}
              className="group h-9 border-b border-line bg-surface transition-colors last:border-0 hover:bg-surface-wash"
            >
              <td className="px-3">
                <span
                  className={[
                    'inline-flex h-5 items-center rounded border px-1.5 text-label-sm uppercase',
                    chipTone[priorityTone[task.priority]],
                  ].join(' ')}
                >
                  {task.priority}
                </span>
              </td>
              <td className="px-3">
                <Link
                  to={`/app/tasks/${task.id}`}
                  className="font-mono text-code-dense font-semibold text-ink underline-offset-2 hover:underline"
                >
                  {task.id}
                </Link>
              </td>
              <td className="px-3 text-body-md text-ink-muted">
                {task.department}
              </td>
              <td className="px-3 text-body-md text-ink">{task.asset}</td>
              <td className="px-3">
                <span
                  className={[
                    'font-dense text-body-md',
                    task.dueUrgent ? 'text-urgent' : 'text-ink-muted',
                  ].join(' ')}
                >
                  {task.due}
                </span>
              </td>
              <td className="px-3 font-dense text-body-md text-ink">
                {task.duration} min
              </td>
              <td className="px-3 text-body-md text-ink-muted">
                {task.assetImpact}
              </td>
              <td className="px-3">
                <StatusChip tone={task.statusTone}>{task.status}</StatusChip>
              </td>
              <td className="px-3">
                <Button
                  to={`/app/tasks/${task.id}`}
                  size="compact"
                  variant={
                    task.action === 'Adjust'
                      ? 'destructive'
                      : task.action === 'Pair'
                        ? 'primary'
                        : 'secondary'
                  }
                  uppercase
                >
                  {task.action}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
