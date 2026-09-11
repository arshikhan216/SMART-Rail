import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Flame,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Train,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref, StatusChip } from '../components/ui/Chip'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import { mockTasks, mockAssets } from '../data/mockIntelligenceData'
import { getTaskRiskPrediction } from '../services/riskService'
import { getTaskPriorityScore } from '../services/priorityService'
import { getDurationForecast } from '../services/durationService'
import { getOptimizationRecommendations } from '../services/optimizationService'
import { getRiskExplanation } from '../services/explanationService'
import { system } from '../data/smartRail'

const RISK_TONE = {
  CRITICAL: 'urgent',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'nominal',
}

export default function MaintenanceIntelligence() {
  const { taskId = 'TSK-2024-001' } = useParams()
  useHeader(['Maintenance Tasks', taskId, 'Decision Support'])

  const [loading, setLoading] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [intelligence, setIntelligence] = useState(null)

  const currentTask = mockTasks.find((t) => t.id === taskId) || mockTasks[0]

  const loadData = async () => {
    setLoading(true)
    try {
      const [riskRes, priorityRes, durationRes, optRes, explRes] = await Promise.all([
        getTaskRiskPrediction(taskId),
        getTaskPriorityScore(taskId),
        getDurationForecast(taskId),
        getOptimizationRecommendations(taskId),
        getRiskExplanation(taskId),
      ])

      setIntelligence({
        risk: riskRes.data,
        priority: priorityRes.data,
        duration: durationRes.data,
        optimization: optRes.data,
        explanation: explRes.data,
      })
    } catch (err) {
      console.error('Failed to load decision intelligence:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [taskId])

  return (
    <PageBody>
      <PageHeader
        title={currentTask.title}
        badge={
          <>
            <Ref>{currentTask.id}</Ref>
            <StatusChip tone={RISK_TONE[currentTask.risk_level] || 'urgent'}>
              {currentTask.risk_level} RISK
            </StatusChip>
            <Chip tone="neutral">◆ {system.disclaimer}</Chip>
          </>
        }
        subtitle={`Corridor: ${currentTask.track_section} · Asset Reference: ${currentTask.asset_id}`}
        actions={
          <>
            <Button to="/app/tasks" variant="secondary">
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Back to Register
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <Cpu className="size-3.5" strokeWidth={2} />
              {showTechnicalDetails ? 'Hide AI Details' : 'Technical AI Diagnostics'}
              {showTechnicalDetails ? (
                <ChevronUp className="size-3.5 ml-1" />
              ) : (
                <ChevronDown className="size-3.5 ml-1" />
              )}
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              <CalendarClock className="size-3.5" strokeWidth={2.25} />
              Schedule Block Slot
            </Button>
          </>
        }
      />

      {/* Operational Highlights Banner */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Assessed Failure Risk</Eyebrow>
            <ShieldAlert className="size-4 text-urgent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-urgent">
              {((intelligence?.risk?.risk_score || currentTask.predicted_risk_probability) * 100).toFixed(0)}%
            </span>
            <Chip tone="urgent">Urgent Intervention</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Failure probability without 14d block
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Multi-Criteria Priority</Eyebrow>
            <Flame className="size-4 text-warning" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-ink">
              {intelligence?.priority?.priority_score || currentTask.priority_score}
            </span>
            <Chip tone="neutral">Corridor Rank #1</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Safety 40% · Reliability 30% · Corridor 30%
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Recommended Duration</Eyebrow>
            <Clock className="size-4 text-accent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-ink">
              {intelligence?.duration?.p50_minutes || currentTask.duration_p50}m
            </span>
            <Chip tone="neutral">P90: 240m cushion</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Quantile machine learning estimate
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Multi-Dept Synergy</Eyebrow>
            <Layers className="size-4 text-nominal" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-nominal">1.5 hrs</span>
            <Chip tone="nominal">1 Block Saved</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Joint bundling with TRD &amp; S&amp;T teams
          </p>
        </Panel>
      </div>

      {/* Primary Decision Support Cards */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Why this is Recommended: Plain Operational Factors */}
        <Panel>
          <PanelHeader
            dense
            title="Operational Justification & Risk Drivers"
            subtitle="Key physical and operational factors contributing to this maintenance recommendation."
          />
          <div className="p-4 space-y-3">
            <div className="rounded border border-line bg-canvas p-3">
              <p className="text-body-md text-ink">
                <strong>Condition Summary: </strong>
                {intelligence?.explanation?.summary ||
                  'Ultrasonic Flaw Depth (4.8mm) combined with high cumulative axle fatigue (52.4 MGT) accelerates rail head degradation. Recommended window eliminates speed restriction.'}
              </p>
            </div>

            <Eyebrow className="pt-1">Primary Physical Drivers</Eyebrow>
            <ul className="space-y-2">
              {[
                { name: 'Ultrasonic Rail Flaw Depth', value: '4.8 mm defect detected', impact: 'Primary Risk Factor', tone: 'urgent' },
                { name: 'Cumulative Traffic Axle Load', value: '52.4 Gross Million Tonnes (MGT)', impact: 'High Corridor Density', tone: 'warning' },
                { name: 'Asset Track Age & In-Service Time', value: '14.2 Years (Standard Life 15y)', impact: 'Approaching Life Cycle Limit', tone: 'warning' },
                { name: 'Last Ballast Tamping Interval', value: '45 Days Ago', impact: 'Subgrade Stable', tone: 'nominal' },
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded border border-line bg-surface p-2.5 text-body-md"
                >
                  <div>
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span className="block text-body-sm text-ink-muted">{item.value}</span>
                  </div>
                  <Chip tone={item.tone}>{item.impact}</Chip>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {/* Recommended Joint Block Window & Coordination */}
        <Panel>
          <PanelHeader
            dense
            title="Recommended Joint Block Window"
            subtitle="CP-SAT optimized multi-department slot with minimal train disruption."
          />
          <div className="p-4 space-y-3">
            <div className="rounded border border-nominal-line bg-nominal-tint p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-label-sm uppercase font-semibold text-nominal">
                  Optimal Maintenance Slot
                </span>
                <Chip tone="nominal">96% Feasibility</Chip>
              </div>
              <p className="mt-1 text-headline-md text-ink">Tomorrow · 14:00 - 17:30 IST (210 min)</p>
              <p className="mt-1 text-body-sm text-ink-muted">
                Track Section: RKMP-BPL Up Main (Km 824.2 - 825.8)
              </p>
            </div>

            <Eyebrow className="pt-1">Bundled Operations (Single Corridor Possession)</Eyebrow>
            <ul className="space-y-2">
              <li className="flex items-center justify-between rounded border border-line bg-canvas p-2.5 text-body-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-nominal" />
                  <div>
                    <p className="font-semibold text-ink">TSK-2024-001 · Rail Weld Repair</p>
                    <p className="text-body-sm text-ink-muted">Civil Track (P-Way) · 210 min</p>
                  </div>
                </div>
                <Chip tone="neutral">Lead Operation</Chip>
              </li>
              <li className="flex items-center justify-between rounded border border-line bg-canvas p-2.5 text-body-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-nominal" />
                  <div>
                    <p className="font-semibold text-ink">TSK-2024-003 · OHE Insulator Cleaning</p>
                    <p className="text-body-sm text-ink-muted">Electrical (TRD) · 90 min (Shadow)</p>
                  </div>
                </div>
                <Chip tone="accent">Joint Bundled</Chip>
              </li>
              <li className="flex items-center justify-between rounded border border-line bg-canvas p-2.5 text-body-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-nominal" />
                  <div>
                    <p className="font-semibold text-ink">TSK-2024-005 · Point Machine Detection</p>
                    <p className="text-body-sm text-ink-muted">Signal &amp; Telecom (S&amp;T) · 45 min</p>
                  </div>
                </div>
                <Chip tone="accent">Joint Bundled</Chip>
              </li>
            </ul>

            <div className="rounded border border-line bg-canvas p-3">
              <div className="flex items-center justify-between text-body-sm text-ink-muted">
                <span>Train Clearance Buffer:</span>
                <span className="font-semibold text-nominal">45 min before Vande Bharat Express</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Collapsible Technical AI Diagnostics for Engineers */}
      {showTechnicalDetails && (
        <Panel className="mt-4 border-accent-line bg-surface p-4 animate-in fade-in-50">
          <PanelHeader
            dense
            title="Technical Explainability & Model Telemetry (TreeSHAP / Quantiles / CP-SAT)"
            subtitle="Mathematical feature attributions and solver branch details."
          />
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="rounded border border-line bg-canvas p-3">
              <Eyebrow className="mb-2">TreeSHAP Feature Attributions</Eyebrow>
              <div className="space-y-2 font-mono text-body-sm">
                <div className="flex justify-between border-b border-line pb-1">
                  <span className="text-ink">Ultrasonic Defect (4.8mm)</span>
                  <span className="text-urgent font-semibold">+0.380 (increases risk)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1">
                  <span className="text-ink">Track Age (14.2y)</span>
                  <span className="text-urgent font-semibold">+0.240 (increases risk)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1">
                  <span className="text-ink">Axle Load (52.4 MGT)</span>
                  <span className="text-urgent font-semibold">+0.190 (increases risk)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1">
                  <span className="text-ink">Recent Tamping (45d ago)</span>
                  <span className="text-nominal font-semibold">-0.150 (decreases risk)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink">Ballast Depth (310mm)</span>
                  <span className="text-nominal font-semibold">-0.080 (decreases risk)</span>
                </div>
              </div>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <Eyebrow className="mb-2">Quantile Duration Bounds &amp; Invariants</Eyebrow>
              <dl className="space-y-2 text-body-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>P10 Duration (Optimistic):</span>
                  <span className="font-mono text-ink font-semibold">185 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>P50 Duration (Expected):</span>
                  <span className="font-mono text-ink font-semibold">210 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>P90 Duration (90% Confidence):</span>
                  <span className="font-mono text-ink font-semibold">240 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Deterministic Invariant Check:</span>
                  <span className="font-mono text-nominal font-semibold">PASSED (All 4 hard bounds)</span>
                </div>
                <div className="flex justify-between">
                  <span>Corridor Delay Objective:</span>
                  <span className="font-mono text-ink">Minimized (67m total vs 115m baseline)</span>
                </div>
              </dl>
            </div>
          </div>
        </Panel>
      )}
    </PageBody>
  )
}
