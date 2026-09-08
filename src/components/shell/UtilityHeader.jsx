import { Bell, ChevronRight, Menu, Search } from 'lucide-react'
import { operator, system } from '../../data/smartRail'
import { Chip, Dot } from '../ui/Chip'

/* design.md § Master Grid — an operational utility header at a fixed 48px.
   Carries the breadcrumb, the simulated-data disclaimer, the synchronisation
   stamp and the operator affordances. Optional telemetry gauges appear on
   screens that need corridor context (Operational Map). */

export default function UtilityHeader({ crumbs = [], gauges = [], onOpenNav }) {
  return (
    <header className="flex h-header shrink-0 items-center gap-3 border-b border-line bg-surface px-3 lg:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded border border-line text-ink hover:bg-canvas md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" strokeWidth={2} />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        <Dot tone="accent" />
        <span className="hidden text-body-md font-semibold text-ink sm:inline">
          {system.name}
        </span>
        {crumbs.map((crumb) => (
          <span key={crumb} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="size-3 shrink-0 text-ink-subtle" strokeWidth={2} />
            <span className="truncate text-body-md text-ink-muted">{crumb}</span>
          </span>
        ))}
      </nav>

      {gauges.length > 0 && (
        <div className="ml-1 hidden items-stretch gap-2 xl:flex">
          {gauges.map((gauge) => (
            <div
              key={gauge.label}
              className="flex items-center gap-2 rounded border border-line bg-canvas px-2 py-1"
            >
              {gauge.icon}
              <span>
                <span className="block text-label-sm uppercase text-ink-muted">
                  {gauge.label}
                </span>
                <span className="block font-mono text-code-dense text-ink">
                  {gauge.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Chip tone="ink" className="hidden lg:inline-flex">
          {system.disclaimer}
        </Chip>

        <span className="hidden items-center gap-1.5 rounded border border-line bg-canvas px-2 py-1 text-body-sm text-ink-muted md:inline-flex">
          <Dot tone="nominal" />
          Last synchronized: {system.syncedAt}
        </span>

        <button
          type="button"
          className="hidden h-8 cursor-pointer items-center gap-2 rounded border border-line bg-surface px-2 text-body-md text-ink-muted hover:bg-canvas xl:inline-flex"
        >
          <Search className="size-3.5" strokeWidth={2} />
          Quick Find
          <kbd className="rounded border border-line bg-canvas px-1 font-mono text-[10px] text-ink-muted">
            Ctrl+K
          </kbd>
        </button>

        <button
          type="button"
          className="relative grid size-8 cursor-pointer place-items-center rounded border border-line text-ink hover:bg-canvas"
          aria-label="3 notifications"
        >
          <Bell className="size-4" strokeWidth={2} />
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-urgent text-[9px] font-semibold text-surface">
            3
          </span>
        </button>

        <span
          className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-hover text-label-sm text-ink"
          title={`${operator.name} — ${operator.role}`}
        >
          {operator.initials}
        </span>
      </div>
    </header>
  )
}
