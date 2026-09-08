import {
  CalendarClock,
  ChartLine,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  Settings,
  TrainFront,
  Wrench,
} from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { navigation, operator, system } from '../../data/smartRail'
import { dotTone } from '../../lib/tones'

const ICONS = {
  LayoutDashboard,
  Wrench,
  CalendarClock,
  Map,
  RadioTower,
  ChartLine,
}

/* design.md § Master Grid — a fixed 64px collapsed / 240px expanded
   navigation spine. The Stitch mockups render the spine as a saturated
   khaki-orange field with a charcoal fill marking the active view. */

export default function Spine({ collapsed, onToggle }) {
  return (
    <nav
      className="flex h-full flex-col bg-spine text-ink"
      aria-label="Primary"
      data-collapsed={collapsed || undefined}
    >
      {/* Identity block */}
      <div className="border-b border-spine-line px-3 py-3">
        <Link
          to="/"
          className="flex items-start gap-2.5 rounded outline-none focus-visible:outline-2 focus-visible:outline-ink"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded bg-ink">
            <TrainFront className="size-4 text-accent" strokeWidth={2} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-headline-sm tracking-[0.06em] text-ink">
                {system.name.toUpperCase()}
              </span>
              <span className="mt-0.5 block text-[10px] leading-[13px] text-accent-deep">
                {system.expansion}
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Linkage / system status strip */}
      <div className="flex items-center justify-between border-b border-spine-line px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`size-1.5 shrink-0 rounded-full ${dotTone.nominal}`} />
          {!collapsed && (
            <span className="truncate text-label-sm uppercase text-accent-deep">
              {system.linkage}
            </span>
          )}
        </span>
        {!collapsed && (
          <span className="font-mono text-code-dense text-accent-deep">
            {system.version}
          </span>
        )}
      </div>

      {/* Views */}
      <ul className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-industrial">
        {navigation.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'group flex h-9 items-center gap-2.5 rounded px-2 transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-ink text-surface'
                      : 'text-ink hover:bg-spine-hover',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`size-4 shrink-0 ${isActive ? 'text-accent' : 'text-ink'}`}
                      strokeWidth={2}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-body-md font-semibold">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={[
                              'grid h-5 min-w-5 place-items-center rounded px-1 text-label-sm',
                              isActive
                                ? 'bg-accent text-ink'
                                : 'bg-ink text-accent',
                            ].join(' ')}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.dot && (
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${dotTone[item.dot]}`}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>

      {/* Operator */}
      <div className="border-t border-spine-line p-2">
        <div
          className={[
            'flex items-center gap-2.5 rounded px-1 py-1.5',
            collapsed && 'justify-center px-0',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-label-sm text-accent">
            {operator.initials}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-body-md font-semibold text-ink">
                {operator.name}
              </span>
              <span className="block truncate text-label-sm text-accent-deep">
                {operator.title}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Utility footer */}
      <div className="flex items-center justify-between border-t border-spine-line px-2 py-2">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title="Expand navigation"
            className="mx-auto grid size-7 cursor-pointer place-items-center rounded text-ink hover:bg-spine-hover"
          >
            <PanelLeftOpen className="size-4" strokeWidth={2} />
          </button>
        ) : (
          <>
            <SpineAction icon={Settings} label="Setup" />
            <SpineAction icon={FileText} label="Docs" />
            <SpineAction icon={LogOut} label="Exit" to="/login" tone="urgent" />
            <button
              type="button"
              onClick={onToggle}
              title="Collapse navigation"
              className="grid size-7 cursor-pointer place-items-center rounded text-ink hover:bg-spine-hover"
            >
              <PanelLeftClose className="size-4" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

function SpineAction({ icon: Icon, label, to, tone }) {
  const classes = [
    'flex cursor-pointer items-center gap-1 rounded px-1.5 py-1',
    'text-label-sm hover:bg-spine-hover',
    tone === 'urgent' ? 'text-urgent' : 'text-ink',
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={classes}>
        <Icon className="size-3.5" strokeWidth={2} />
        {label}
      </Link>
    )
  }
  return (
    <button type="button" className={classes}>
      <Icon className="size-3.5" strokeWidth={2} />
      {label}
    </button>
  )
}
