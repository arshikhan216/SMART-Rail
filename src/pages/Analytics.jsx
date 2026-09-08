import { useMemo, useState } from 'react'
import AnalyticsKpiCard from '../components/analytics/AnalyticsKpiCard'
import AssetAvailabilityChart from '../components/analytics/AssetAvailabilityChart'
import BaselineComparison from '../components/analytics/BaselineComparison'
import BlockUtilizationChart from '../components/analytics/BlockUtilizationChart'
import JointMaintenanceVisualization from '../components/analytics/JointMaintenanceVisualization'
import MaintenanceTrend from '../components/analytics/MaintenanceTrend'
import OperationalImpactChart from '../components/analytics/OperationalImpactChart'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import { Chip } from '../components/ui/Chip'
import { Select } from '../components/ui/Field'
import { Checkbox } from '../components/ui/Field'
import {
  DEPARTMENTS,
  PERIODS,
  assetLoad,
  availabilityTrend,
  blockUtilization,
  departmentMix,
  headlineKpis,
  jointMaintenance,
  maintenanceTrend,
  operationalImpact,
  planningComparison,
  planningWindow,
  workDelivered,
} from '../data/analytics'
import { system } from '../data/smartRail'

export default function Analytics() {
  useHeader(['Selected Division', 'Analytics'])

  const [period, setPeriod] = useState(PERIODS[0])
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [showBaseline, setShowBaseline] = useState(true)

  const kpis = useMemo(() => headlineKpis(), [])
  const mix = useMemo(() => departmentMix(department), [department])
  const assets = useMemo(() => assetLoad(department), [department])

  return (
    <PageBody>
      <PageHeader
        title="Analytics"
        badge={<Chip tone="ink">◆ {system.disclaimer}</Chip>}
        subtitle="Measure maintenance performance, asset availability and planning efficiency."
        actions={
          <>
            <Select
              aria-label="Reporting period"
              options={PERIODS}
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-56"
            />
            <Select
              aria-label="Department"
              options={DEPARTMENTS}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-44"
            />
          </>
        }
        meta={
          <p className="font-mono text-code-dense text-ink-muted">
            {planningWindow.from} – {planningWindow.to} ·{' '}
            {planningWindow.minutes}m window · {planningWindow.movements} train
            movements
          </p>
        }
      />

      {/* B — Headline KPIs */}
      <section aria-label="Key metrics">
        {/* Container-driven columns rather than viewport breakpoints: the
            content pane is ~296px narrower than the viewport once the 240px
            spine and page padding are taken off, so a viewport-based `xl:`
            step oversubscribes the row. auto-fit wraps on the space actually
            available — 5 across on a wide desktop, 4, then 2x2, then 1 —
            and `min()` keeps the track from overflowing narrow screens. */}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(17rem,100%),1fr))]">
          {kpis.map((kpi) => (
            <AnalyticsKpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* C — Baseline vs SMART-Rail */}
      <section className="mt-6" aria-label="Planning comparison">
        <div className="mb-2.5 flex justify-end">
          <Checkbox
            id="show-baseline"
            label="Show baseline series"
            checked={showBaseline}
            onChange={(event) => setShowBaseline(event.target.checked)}
          />
        </div>
        <BaselineComparison
          metrics={planningComparison}
          workDelivered={workDelivered}
          showBaseline={showBaseline}
        />
      </section>

      {/* D + H — performance trend beside operational impact */}
      <section
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        aria-label="Maintenance performance and operational impact"
      >
        <MaintenanceTrend data={maintenanceTrend} />
        <OperationalImpactChart data={operationalImpact} workMix={mix} />
      </section>

      {/* E + G — availability beside cross-department coordination */}
      <section
        className="mt-6 grid gap-6 xl:grid-cols-2"
        aria-label="Asset availability and coordination"
      >
        <AssetAvailabilityChart trend={availabilityTrend} assets={assets} />
        <JointMaintenanceVisualization data={jointMaintenance} />
      </section>

      {/* F — Block utilization, full width for the timeline */}
      <section className="mt-6" aria-label="Block utilization">
        <BlockUtilizationChart data={blockUtilization} />
      </section>

      <p className="mt-6 text-body-sm text-ink-subtle">
        ◆ {system.disclaimer} · Figures marked{' '}
        <span className="font-semibold text-nominal">Derived</span> are computed
        from the prototype maintenance register, block candidates and the
        deterministic optimizer. Figures marked{' '}
        <span className="font-semibold text-ink-muted">Demo series</span> are
        illustrative, because the prototype holds no history for them. Nothing
        here represents a real railway result.
      </p>
    </PageBody>
  )
}
