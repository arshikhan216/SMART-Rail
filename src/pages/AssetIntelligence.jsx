import { useState } from 'react'
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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref, StatusChip } from '../components/ui/Chip'
import { Eyebrow, Panel, PanelHeader } from '../components/ui/Panel'
import { mockAssets, mockTasks } from '../data/mockIntelligenceData'
import { system } from '../data/smartRail'

const RISK_TONE = {
  CRITICAL: 'urgent',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  LOW: 'nominal',
}

export default function AssetIntelligence() {
  const { assetId = 'TRK-RKMP-042' } = useParams()
  useHeader(['Corridor Assets', assetId, 'Degradation Intelligence'])

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const asset = mockAssets.find((a) => a.id === assetId) || mockAssets[0]

  return (
    <PageBody>
      <PageHeader
        title={asset.name}
        badge={
          <>
            <Ref>{asset.id}</Ref>
            <StatusChip tone={RISK_TONE[asset.risk_level] || 'urgent'}>
              {asset.risk_level} RISK
            </StatusChip>
            <Chip tone="neutral">◆ {system.disclaimer}</Chip>
          </>
        }
        subtitle={`Location: ${asset.location} · Commissioned: ${asset.commissioned} · Cumulative Load: ${asset.cumulative_load}`}
        actions={
          <>
            <Button to="/app/map" variant="secondary">
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Corridor Map
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <Cpu className="size-3.5" strokeWidth={2} />
              {showTechnicalDetails ? 'Hide Telemetry' : 'Technical AI Diagnostics'}
              {showTechnicalDetails ? (
                <ChevronUp className="size-3.5 ml-1" />
              ) : (
                <ChevronDown className="size-3.5 ml-1" />
              )}
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              <CalendarClock className="size-3.5" strokeWidth={2.25} />
              Schedule Maintenance Block
            </Button>
          </>
        }
      />

      {/* Asset KPI Row */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Current Health Index</Eyebrow>
            <Activity className="size-4 text-warning" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-ink">{asset.health_score}</span>
            <span className="text-body-md text-ink-muted">/ 100</span>
            <Chip tone="warning">Degraded</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Projected +41% after block weld renewal
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Failure Probability</Eyebrow>
            <ShieldAlert className="size-4 text-urgent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-urgent">
              {(asset.failure_probability * 100).toFixed(0)}%
            </span>
            <Chip tone="urgent">Critical Threshold: 65%</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Safety margin exceeded by 19%
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Operational Restriction</Eyebrow>
            <Flame className="size-4 text-urgent" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-headline-lg text-urgent">30 km/h TSR</span>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            Temporary speed restriction on Down Main
          </p>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow>Post-Block Restoration</Eyebrow>
            <TrendingUp className="size-4 text-nominal" strokeWidth={2} />
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-display-lg text-nominal">130 km/h</span>
            <Chip tone="nominal">Full Speed</Chip>
          </div>
          <p className="mt-2.5 border-t border-line pt-2.5 text-body-sm text-ink-muted">
            TSR lifted immediately post-block release
          </p>
        </Panel>
      </div>

      {/* Operational Assessment and Task Connections */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            dense
            title="Physical Degradation Assessment"
            subtitle="Identified track anomalies and field observations."
          />
          <div className="p-4 space-y-3">
            <div className="rounded border border-line bg-canvas p-3">
              <p className="text-body-md text-ink">
                <strong>Field Observation: </strong>
                {asset.explanation ||
                  'Ultrasonic flaw detection flagged 4.8mm fatigue crack at welded joint Km 824.6. High axle loading (52.4 MGT) requires ultrasonic weld repair and tamping.'}
              </p>
            </div>

            <Eyebrow className="pt-1">Recommended Action Protocol</Eyebrow>
            <ul className="space-y-2">
              {(asset.recommendations || [
                'Deploy USFD testing unit for flaw boundary demarcation',
                'Mobilize weld renewal gang for 3.5h joint possession window',
                'Synchronize with TRD power isolation for overhead clearance',
              ]).map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 rounded border border-line bg-surface p-2.5 text-body-md text-ink"
                >
                  <CheckCircle2 className="size-4 text-nominal shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            dense
            title="Associated Pending Maintenance Tasks"
            subtitle="Work orders linked to this physical corridor asset."
          />
          <div className="p-4 space-y-3">
            <div className="rounded border border-line bg-canvas p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Ref>TSK-2024-001</Ref>
                  <p className="mt-1 font-semibold text-ink">Ultrasonic Rail Weld Repair</p>
                  <p className="text-body-sm text-ink-muted">Civil Track (P-Way) · 210 min duration</p>
                </div>
                <Link
                  to="/app/tasks/TSK-2024-001"
                  className="rounded border border-line bg-surface px-3 py-1.5 text-label-sm uppercase font-semibold text-ink hover:bg-spine-hover transition-colors"
                >
                  View Decision Support
                </Link>
              </div>
            </div>

            <div className="rounded border border-nominal-line bg-nominal-tint p-3">
              <p className="text-label-sm uppercase font-semibold text-nominal">Corridor Benefit</p>
              <p className="mt-1 text-body-md text-ink">
                Executing this block window restores line speed to 130 km/h, preventing cumulative daily delays of 48 minutes across 14 passenger express trains.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Collapsible Technical AI Diagnostics */}
      {showTechnicalDetails && (
        <Panel className="mt-4 border-accent-line bg-surface p-4 animate-in fade-in-50">
          <PanelHeader
            dense
            title="Telemetry Degradation Drivers (TreeSHAP Vector)"
            subtitle="Machine learning feature weightings computed by AssetRiskPredictor v2.0."
          />
          <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(asset.shap_features || [
              { feature: 'Ultrasonic Flaw Depth (4.8mm)', impact: 0.38, direction: 'increases_risk' },
              { feature: 'Asset Service Life (14.2y)', impact: 0.24, direction: 'increases_risk' },
              { feature: 'Corridor Axle Load (52.4 MGT)', impact: 0.19, direction: 'increases_risk' },
              { feature: 'Peak Vibration Anomaly (2.4g)', impact: 0.12, direction: 'increases_risk' },
              { feature: 'Recent Surface Tamping (45d)', impact: -0.15, direction: 'decreases_risk' },
              { feature: 'Ballast Depth (310mm)', impact: -0.08, direction: 'decreases_risk' },
            ]).map((feat, idx) => (
              <div key={idx} className="rounded border border-line bg-canvas p-3">
                <p className="text-body-sm text-ink font-semibold">{feat.feature}</p>
                <div className="mt-1 flex items-center justify-between text-body-sm">
                  <span className="text-ink-muted">Attribution:</span>
                  <span
                    className={
                      feat.impact > 0
                        ? 'text-urgent font-mono font-semibold'
                        : 'text-nominal font-mono font-semibold'
                    }
                  >
                    {feat.impact > 0 ? `+${feat.impact}` : feat.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </PageBody>
  )
}

