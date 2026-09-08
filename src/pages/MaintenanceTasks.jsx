import { ArrowRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, StatusChip } from '../components/ui/Chip'
import { Select, TextInput } from '../components/ui/Field'
import { Meter } from '../components/ui/Meter'
import { Panel, PanelHeader } from '../components/ui/Panel'
import { system, tasks } from '../data/smartRail'
import { chipTone, priorityTone, textTone } from '../lib/tones'

/* The reference set has no task-register screen — only the Maintenance
   Intelligence detail view. This register is built from the dashboard's
   priority-table specification so the nav item resolves to a real workspace. */

const DEPARTMENTS = ['All departments', 'Engineering', 'S&T', 'TRD']
const PRIORITIES = ['All priorities', 'CRITICAL', 'HIGH', 'MEDIUM']

const COLUMNS = [
  'Priority',
  'Task',
  'Title',
  'Department',
  'Asset',
  'Section',
  'Due',
  'Duration',
  'Asset Impact',
  'Status',
  'Action',
]

export default function MaintenanceTasks() {
  useHeader(['Selected Division', 'Maintenance Register'])

  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [priority, setPriority] = useState(PRIORITIES[0])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesQuery =
        !needle ||
        [task.id, task.title, task.asset, task.section]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      const matchesDepartment =
        department === DEPARTMENTS[0] || task.department === department
      const matchesPriority =
        priority === PRIORITIES[0] || task.priority === priority
      return matchesQuery && matchesDepartment && matchesPriority
    })
  }, [query, department, priority])

  const totals = useMemo(
    () => ({
      critical: tasks.filter((task) => task.priority === 'CRITICAL').length,
      minutes: tasks.reduce((sum, task) => sum + task.duration, 0),
      pairable: tasks.filter((task) => task.status === 'Ready to Pair').length,
      conflicts: tasks.filter((task) => task.statusTone === 'urgent').length,
    }),
    [],
  )

  return (
    <PageBody>
      <PageHeader
        title="Maintenance Tasks"
        badge={<Chip tone="neutral">Operational Dispatch &amp; Possession Console</Chip>}
        subtitle="Demand register synchronised across Engineering, S&T and TRD."
        actions={
          <>
            <Button variant="secondary" uppercase>
              <SlidersHorizontal className="size-3.5" strokeWidth={2} />
              Filter Register
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              <Plus className="size-3.5" strokeWidth={2.25} />
              Add to Block Planning
            </Button>
          </>
        }
      />

      {/* Register summary */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Critical Tasks"
          value={String(totals.critical)}
          caption="Requiring priority allocation"
          tone="urgent"
        />
        <SummaryTile
          label="Total Demand"
          value={`${totals.minutes}m`}
          caption="Aggregate predicted work time"
        />
        <SummaryTile
          label="Ready to Pair"
          value={String(totals.pairable)}
          caption="Joint opportunity candidates"
          tone="accent"
        />
        <SummaryTile
          label="Conflict Flagged"
          value={String(totals.conflicts)}
          caption="Constraint contention detected"
          tone="urgent"
        />
      </div>

      <Panel className="mt-4">
        <PanelHeader
          title="Demand Register"
          subtitle={`${filtered.length} of ${tasks.length} tasks shown`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
                  strokeWidth={2}
                />
                <TextInput
                  aria-label="Search tasks"
                  placeholder="Search task, asset, section"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-56 pl-7"
                />
              </div>
              <Select
                aria-label="Filter by department"
                options={DEPARTMENTS}
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="w-44"
              />
              <Select
                aria-label="Filter by priority"
                options={PRIORITIES}
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-40"
              />
            </div>
          }
        />

        <div className="overflow-x-auto scrollbar-industrial">
          <table className="w-full min-w-[1100px] border-collapse text-left">
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
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className="h-9 border-b border-line border-l-[3px] border-l-transparent bg-surface transition-colors hover:border-l-accent hover:bg-surface-wash"
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
                  <td className="px-3 text-body-md text-ink">{task.title}</td>
                  <td className="px-3 text-body-md text-ink-muted">
                    {task.department}
                    <span className="text-ink-subtle"> · {task.discipline}</span>
                  </td>
                  <td className="px-3 text-body-md text-ink-muted">{task.asset}</td>
                  <td className="px-3">
                    <span className="font-mono text-code-dense text-ink-muted">
                      {task.km}
                    </span>
                  </td>
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
                  <td className="px-3">
                    <span className="font-dense text-body-md text-ink">
                      {task.duration} min
                    </span>
                    <span className="ml-1 font-dense text-body-sm text-ink-subtle">
                      P90 {task.p90}
                    </span>
                  </td>
                  <td className="px-3">
                    <span className="flex w-28 flex-col gap-1">
                      <span className={`text-body-sm ${textTone[
                        task.impactLevel === 'high'
                          ? 'urgent'
                          : task.impactLevel === 'medium'
                            ? 'warning'
                            : 'neutral'
                      ]}`}>
                        {task.assetImpact}
                      </span>
                      <Meter
                        value={
                          task.impactLevel === 'high'
                            ? 90
                            : task.impactLevel === 'medium'
                              ? 55
                              : 25
                        }
                        tone={
                          task.impactLevel === 'high'
                            ? 'urgent'
                            : task.impactLevel === 'medium'
                              ? 'warning'
                              : 'nominal'
                        }
                      />
                    </span>
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

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="h-24 bg-surface px-3 text-center text-body-md text-ink-muted"
                  >
                    No tasks match the current register filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="text-body-sm text-ink-subtle">
            {system.disclaimer} · Register synchronised {system.syncedAt}
          </p>
          <Link
            to="/app/planning"
            className="inline-flex items-center gap-1.5 text-body-md text-ink underline-offset-2 hover:underline"
          >
            Open Block Planning
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </footer>
      </Panel>
    </PageBody>
  )
}

function SummaryTile({ label, value, caption, tone = 'neutral' }) {
  return (
    <Panel className="p-3.5" rail={tone === 'neutral' ? undefined : tone}>
      <p className="text-label-sm uppercase text-ink-muted">{label}</p>
      <p className="mt-2 text-headline-lg text-ink">{value}</p>
      <p className="mt-2 border-t border-line pt-2 text-body-sm text-ink-muted">
        {caption}
      </p>
    </Panel>
  )
}
