import { departmentColor } from '../../lib/chartTheme'
import { Panel, PanelHeader } from '../ui/Panel'
import { Provenance } from './chartPrimitives'
import { dotTone, textTone } from '../../lib/tones'

/**
 * The link between maintenance planning and train operations.
 * Only metrics the prototype actually computes appear here — there is no
 * "conflicts avoided" figure, so none is shown.
 */
export default function OperationalImpactChart({ data, workMix }) {
  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Operational Impact"
        subtitle="How the plan sits against train operations."
        actions={<Provenance source={data.source} />}
      />

      <div className="flex-1 p-5">
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.metrics.map((metric) => (
            <li
              key={metric.key}
              className="rounded border border-line bg-canvas p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-label-sm uppercase text-ink-muted">
                  {metric.label}
                </p>
                <span
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${dotTone[metric.tone]}`}
                />
              </div>
              <p
                className={`mt-1.5 text-headline-lg leading-none ${
                  metric.tone === 'ink' ? 'text-ink' : textTone[metric.tone]
                }`}
              >
                {metric.value}
              </p>
              <p className="mt-1.5 font-dense text-body-sm text-ink-muted">
                {metric.detail}
              </p>
            </li>
          ))}
        </ul>

        {/* Departmental share of the register's maintenance minutes */}
        <div className="mt-4 border-t border-line pt-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-label-sm uppercase text-ink-muted">
              Register load by department
            </p>
            <span className="font-dense text-body-sm text-ink-muted">
              {workMix.totalTasks} tasks · {workMix.totalMinutes}m
            </span>
          </div>

          {/* Single stacked bar, 2px surface gaps between segments */}
          <div className="flex h-4 w-full gap-0.5">
            {workMix.slices.map((slice) => (
              <span
                key={slice.department}
                className="first:rounded-l-[3px] last:rounded-r-[3px]"
                style={{
                  width: `${slice.share}%`,
                  backgroundColor: departmentColor(slice.department),
                }}
                title={`${slice.department}: ${slice.minutes}m (${slice.share.toFixed(1)}%)`}
              />
            ))}
          </div>

          <ul className="mt-2.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {workMix.slices.map((slice) => (
              <li key={slice.department} className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: departmentColor(slice.department) }}
                />
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink-muted">
                  {slice.department}
                </span>
                <span className="font-dense text-body-md font-semibold text-ink">
                  {slice.share.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  )
}
