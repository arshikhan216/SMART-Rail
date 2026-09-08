import {
  Activity,
  Gauge,
  Network,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Minus,
} from 'lucide-react'
import { Panel } from '../ui/Panel'
import { Provenance } from './chartPrimitives'

const ICONS = { TrendingUp, TriangleAlert, Gauge, Activity, Network }

const TREND = {
  up: { Icon: TrendingUp, tone: 'text-nominal' },
  down: { Icon: TrendingDown, tone: 'text-warning' },
  flat: { Icon: Minus, tone: 'text-ink-muted' },
}

/**
 * Operational metric tile. Large value, concise label, one contextual line.
 * Deliberately flat — no shadow, no oversized decoration.
 */
export default function AnalyticsKpiCard({ kpi }) {
  const Icon = ICONS[kpi.icon] ?? Activity
  const trend = TREND[kpi.trend.direction] ?? TREND.flat

  return (
    <Panel className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-label-sm uppercase text-ink-muted">{kpi.label}</p>
        <Icon className="size-4 shrink-0 text-ink-subtle" strokeWidth={2} />
      </div>

      <p className="mt-3 text-display-lg leading-none text-ink">{kpi.value}</p>

      <p className="mt-2 font-dense text-body-sm text-ink-muted">
        {kpi.caption}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span
          className={`flex min-w-0 items-center gap-1.5 text-body-sm ${trend.tone}`}
        >
          <trend.Icon className="size-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{kpi.trend.text}</span>
        </span>
        <Provenance source={kpi.source} />
      </div>
    </Panel>
  )
}
