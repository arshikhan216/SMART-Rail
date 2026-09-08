import { ArrowDown } from 'lucide-react'
import { departmentColor } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Provenance } from './chartPrimitives'

/**
 * Engineering + S&T + TRD converging into a shared possession.
 * A diagram rather than prose: department nodes carry their real candidate
 * counts, and the confluence node carries the measured possession saving.
 */
export default function JointMaintenanceVisualization({ data }) {
  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Cross-Department Coordination"
        subtitle="Departmental demand converging into shared possessions."
        actions={<Provenance source={data.source} />}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Department nodes */}
        <ul className="grid grid-cols-3 gap-2.5">
          {data.departments.map((entry) => (
            <li
              key={entry.department}
              className="rounded border border-line bg-canvas p-3"
              style={{ borderTopWidth: 3, borderTopColor: departmentColor(entry.department) }}
            >
              <p className="text-label-sm uppercase text-ink-muted">
                {entry.department}
              </p>
              <p className="mt-1.5 text-headline-md text-ink">
                {entry.minutes}
                <span className="text-body-md text-ink-muted">m</span>
              </p>
              <p className="mt-1 font-dense text-body-sm text-ink-muted">
                {entry.candidates} candidate{entry.candidates === 1 ? '' : 's'}
                {entry.pairable > 0 && ` · ${entry.pairable} pairable`}
              </p>
            </li>
          ))}
        </ul>

        {/* Confluence */}
        <svg
          viewBox="0 0 300 34"
          className="mt-1 w-full"
          style={{ height: 34 }}
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d="M50 0 C50 18 150 14 150 32 M150 0 L150 32 M250 0 C250 18 150 14 150 32"
            fill="none"
            stroke="var(--color-ink-subtle)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        </svg>

        <div className="flex justify-center">
          <ArrowDown className="size-4 text-ink-subtle" strokeWidth={2} />
        </div>

        {/* Joint result */}
        <div className="mt-1 rounded-md border-2 border-accent bg-accent-wash p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-label-sm uppercase text-accent-deep">
              Joint block opportunity
            </p>
            <p className="font-dense text-body-sm text-ink-muted">
              {data.used} of {data.identified} used
            </p>
          </div>

          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {data.pairs.map((pair) => (
              <div
                key={pair.tasks.join('-')}
                className="rounded border border-accent-line bg-surface p-2.5"
              >
                <p className="font-mono text-code-dense font-semibold text-ink">
                  {pair.tasks.join(' + ')}
                </p>
                <p className="mt-1 text-body-sm text-ink-muted">
                  {pair.departments.join(' + ')}
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-line pt-2">
                  <span className="font-dense text-body-sm text-ink-muted">
                    {pair.sequential}m sequential
                    <span className="mx-1 text-ink-subtle">→</span>
                    <span className="font-semibold text-ink">
                      {pair.envelope}m shared
                    </span>
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded border border-accent-line bg-surface p-2.5">
              <p className="text-label-sm uppercase text-ink-muted">
                Possession saved
              </p>
              <p className="mt-1 text-headline-lg text-ink">
                {data.possessionSaved}
                <span className="text-body-lg text-ink-muted">m</span>
              </p>
              <p className="mt-1 text-body-sm text-ink-muted">
                Track time released by sharing one isolation window
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
