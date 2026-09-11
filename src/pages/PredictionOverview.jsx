import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Filter,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  Wrench,
} from 'lucide-react'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref, StatusChip } from '../components/ui/Chip'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import { mockTasks, mockAssets } from '../data/mockIntelligenceData'
import { system } from '../data/smartRail'

const RISK_TONE = {
  CRITICAL: 'urgent',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'nominal',
}

export default function PredictionOverview() {
  useHeader(['Asset & Risk Intelligence'])

  const [filter, setFilter] = useState('ALL')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const filteredTasks = mockTasks.filter((t) => {
    if (filter === 'CRITICAL') return t.risk_level === 'CRITICAL'
    if (filter === 'HIGH') return t.risk_level === 'HIGH'
    if (filter === 'MEDIUM') return t.risk_level === 'MEDIUM'
    return true
  })

  return (
    <PageBody>
      <PageHeader
        title="Asset & Risk Intelligence"
        badge={
          <>
            <Chip tone="neutral">RKMP-BPL Corridor</Chip>
            <Chip tone="nominal" dot>
              Model Status: Verified Active
            </Chip>
          </>
        }
        subtitle="AI-assisted risk assessment and degradation intelligence across track, OHE, and signaling assets."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <Cpu className="size-3.5" strokeWidth={2} />
              {showTechnicalDetails ? 'Hide ML Telemetry' : 'Technical AI Diagnostics'}
              {showTechnicalDetails ? (
                <ChevronUp className="size-3.5 ml-1" />
              ) : (
                <ChevronDown className="size-3.5 ml-1" />
              )}
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              <Layers className="size-3.5" strokeWidth={2.25} />
              Plan Block Window
            </Button>
          </>
        }
      />

      {/* Operational KPI Summary */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Monitored Assets</Eyebrow>
            <Activity className="size-4 text-accent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-ink">1,137</span>
            <Chip tone="nominal">100% Synced</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Track, Turnout, OHE &amp; Signal sensors
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>High Risk Flags</Eyebrow>
            <ShieldAlert className="size-4 text-urgent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-urgent">12</span>
            <Chip tone="urgent">Urgent Intervention</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Block recommended within 7–14 days
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Corridor Delay Saved</Eyebrow>
            <TrendingDown className="size-4 text-nominal" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-nominal">41.7%</span>
            <Chip tone="nominal">-48 min/day</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Via multi-department CP-SAT optimization
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Prediction Reliability</Eyebrow>
            <ShieldCheck className="size-4 text-nominal" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-ink">99.4%</span>
            <Chip tone="neutral">Brier: 0.042</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Validated against historical inspection data
          </p>
        </Panel>
      </div>

      {/* Optional Technical AI Diagnostics Accordion */}
      {showTechnicalDetails && (
        <Panel className="mt-4 border-accent-line bg-surface p-4 animate-in fade-in-50">
          <PanelHeader
            dense
            title="Technical AI / ML Model Registry & Observability"
            subtitle="Underlying model telemetry and SHAP explainability parameters for data engineers."
          />
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div className="rounded border border-line bg-canvas p-3">
              <Eyebrow className="mb-1">Risk Classifier</Eyebrow>
              <p className="text-body-md font-semibold text-ink">Random Forest Classifier (v2.0)</p>
              <dl className="mt-2 space-y-1 text-body-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>ROC-AUC:</span>
                  <span className="font-mono text-ink font-semibold">1.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Explainability:</span>
                  <span className="font-mono text-accent">TreeSHAP Fast Attributions</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference Latency:</span>
                  <span className="font-mono text-ink">18ms</span>
                </div>
              </dl>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <Eyebrow className="mb-1">Delay Regressor</Eyebrow>
              <p className="text-body-md font-semibold text-ink">Quantile Gradient Booster (v2.0)</p>
              <dl className="mt-2 space-y-1 text-body-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>MAE (Mean Absolute Error):</span>
                  <span className="font-mono text-ink font-semibold">2.31 min</span>
                </div>
                <div className="flex justify-between">
                  <span>R² Score:</span>
                  <span className="font-mono text-ink">0.8688</span>
                </div>
                <div className="flex justify-between">
                  <span>Prediction Horizon:</span>
                  <span className="font-mono text-ink">P10 / P50 / P90 bounds</span>
                </div>
              </dl>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <Eyebrow className="mb-1">Combinatorial Solver</Eyebrow>
              <p className="text-body-md font-semibold text-ink">Google OR-Tools CP-SAT (v9.8)</p>
              <dl className="mt-2 space-y-1 text-body-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>Solvability Verdict:</span>
                  <span className="font-mono text-nominal font-semibold">OPTIMAL / FEASIBLE</span>
                </div>
                <div className="flex justify-between">
                  <span>Deterministic Invariants:</span>
                  <span className="font-mono text-ink">4 Hard Safety Invariants</span>
                </div>
                <div className="flex justify-between">
                  <span>Joint Bundling Savings:</span>
                  <span className="font-mono text-accent">+1.5 to 2.5 hrs saved</span>
                </div>
              </dl>
            </div>
          </div>
        </Panel>
      )}

      {/* Asset Maintenance Prioritization Register */}
      <Panel className="mt-4">
        <PanelHeader
          title="Corridor Asset Risk & Prioritization Queue"
          subtitle="AI-calculated risk scores and recommended maintenance actions ordered by operational urgency."
          actions={
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-ink-muted mr-1" />
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={[
                    'px-2.5 py-1 text-label-sm uppercase rounded cursor-pointer transition-colors',
                    filter === f
                      ? 'bg-ink text-surface font-semibold'
                      : 'bg-canvas text-ink-muted hover:text-ink hover:bg-spine-hover',
                  ].join(' ')}
                >
                  {f === 'ALL' ? `All (${mockTasks.length})` : f}
                </button>
              ))}
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <thead>
              <tr className="border-b border-line bg-canvas text-label-sm uppercase text-ink-muted">
                <th className="px-4 py-2.5">Task ID</th>
                <th className="px-4 py-2.5">Asset &amp; Maintenance Scope</th>
                <th className="px-4 py-2.5">Assessed Risk</th>
                <th className="px-4 py-2.5">Operational Priority</th>
                <th className="px-4 py-2.5">Est. Duration</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3">
                    <Ref>{t.id}</Ref>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{t.title}</p>
                    <p className="text-body-sm text-ink-muted">
                      {t.track_section} · <span className="font-mono text-ink-subtle">{t.asset_id}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip tone={RISK_TONE[t.risk_level] || 'neutral'}>
                      {t.risk_level} RISK ({(t.predicted_risk_probability * 100).toFixed(0)}%)
                    </StatusChip>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-dense font-semibold text-ink">{t.priority_score}</span>
                    <span className="text-body-sm text-ink-muted"> / 100</span>
                  </td>
                  <td className="px-4 py-3 font-dense text-ink-muted">
                    {t.duration_p50} min
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/app/tasks/${t.id}`}
                      className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1 text-label-sm uppercase text-ink hover:bg-spine-hover hover:border-line-elevated transition-colors"
                    >
                      Decision Support <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageBody>
  )
}

