import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BrainCircuit, Sparkles, RefreshCw, Layers, Shield, Clock, Flame, Activity, Train } from 'lucide-react'

// Components
import LoadingState from '../components/states/LoadingState'
import ErrorState from '../components/states/ErrorState'
import RiskGauge from '../components/risk/RiskGauge'
import RiskScore from '../components/risk/RiskScore'
import RiskLevelBadge from '../components/risk/RiskLevelBadge'
import FeatureImportanceChart from '../components/explanation/FeatureImportanceChart'
import RiskExplanation from '../components/explanation/RiskExplanation'
import PriorityIndicator from '../components/priority/PriorityIndicator'
import PriorityRanking from '../components/priority/PriorityRanking'
import DurationForecast from '../components/duration/DurationForecast'
import AssetImpactIndicator from '../components/impact/AssetImpactIndicator'
import TrainImpactTimeline from '../components/impact/TrainImpactTimeline'
import AffectedTrainList from '../components/impact/AffectedTrainList'
import IntelligenceOrbit from '../components/intelligence/IntelligenceOrbit'
import PredictionPipeline from '../components/intelligence/PredictionPipeline'
import RecommendationPanel from '../components/optimization/RecommendationPanel'
import BaselineComparison from '../components/optimization/BaselineComparison'
import DynamicReplanningPanel from '../components/optimization/DynamicReplanningPanel'
import CoordinationIntelligence from '../components/coordination/CoordinationIntelligence'
import ModelMetadata from '../components/model/ModelMetadata'
import ModelStatus from '../components/model/ModelStatus'
import PredictionTimestamp from '../components/model/PredictionTimestamp'

// Services & Mock Data
import { getTaskRiskPrediction } from '../services/riskService'
import { getTaskPriorityScore } from '../services/priorityService'
import { getDurationForecast } from '../services/durationService'
import { getAssetAvailabilityImpact } from '../services/assetImpactService'
import { getTrainTimetableImpact } from '../services/trainImpactService'
import { getRiskExplanation } from '../services/explanationService'
import { getOptimizationRecommendations } from '../services/optimizationService'
import { mockTasks } from '../data/mockIntelligenceData'

export default function MaintenanceIntelligence() {
  const { taskId = 'TSK-2024-001' } = useParams()
  const [activeNode, setActiveNode] = useState('risk')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [intelligence, setIntelligence] = useState(null)

  const currentTask = mockTasks.find(t => t.id === taskId) || mockTasks[0]

  const loadAllIntelligence = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        riskRes,
        priorityRes,
        durationRes,
        assetRes,
        trainRes,
        explanationRes,
        optRes
      ] = await Promise.all([
        getTaskRiskPrediction(taskId),
        getTaskPriorityScore(taskId),
        getDurationForecast(taskId),
        getAssetAvailabilityImpact(taskId),
        getTrainTimetableImpact(taskId),
        getRiskExplanation(taskId),
        getOptimizationRecommendations(taskId)
      ])

      setIntelligence({
        risk: riskRes.data,
        priority: priorityRes.data,
        duration: durationRes.data,
        assetImpact: assetRes.data,
        trainImpact: trainRes.data,
        explanation: explanationRes.data,
        optimization: optRes.data
      })
    } catch (err) {
      console.error('Failed to load maintenance intelligence:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllIntelligence()
  }, [taskId])

  return (
    <div className="min-h-screen bg-[#F2EFE7] text-[#252525] p-4 md:p-6 lg:p-8">
      {/* Top Breadcrumb & Disclaimer Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#767676] mb-1">
            <Link to="/app/tasks" className="hover:text-[#252525] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Maintenance Backlog
            </Link>
            <span>/</span>
            <span className="text-[#252525] font-semibold">ML Intelligence Layer</span>
            <span>/</span>
            <span>{currentTask.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#252525] tracking-tight">
              {currentTask.title}
            </h1>
            <RiskLevelBadge level={currentTask.risk_level || 'CRITICAL'} />
          </div>
          <p className="text-xs text-[#767676] font-mono mt-0.5">
            Asset: <strong>{currentTask.asset_id}</strong> · Corridor: <strong>{currentTask.track_section}</strong>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5">
          <div className="flex items-center gap-2">
            <ModelStatus latency="38ms" isFallback={false} />
            <button
              onClick={loadAllIntelligence}
              className="p-1.5 bg-white hover:bg-[#E5E1D8] border border-[#E5E1D8] rounded-lg text-[#252525] transition-colors"
              title="Refresh Inferences"
            >
              <RefreshCw className="w-4 h-4 text-[#F2B759]" />
            </button>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#F2B759]/20 border border-[#F2B759]/40 text-[10px] font-mono text-[#252525] font-medium">
            AI Decision Support · Requires Section Controller Review
          </div>
        </div>
      </header>

      {loading ? (
        <LoadingState
          message="Running SMART-Rail Multi-Engine Inferences..."
          submessage="Evaluating TreeSHAP attributions, duration quantiles, and CP-SAT schedule matrices"
        />
      ) : error ? (
        <ErrorState error={error} onRetry={loadAllIntelligence} />
      ) : (
        <div className="space-y-6">
          {/* Top Orbital Decision Synthesis Graph */}
          <IntelligenceOrbit
            activeNode={activeNode}
            onSelectNode={setActiveNode}
            metrics={{
              risk: { label: 'Risk Assessment', value: `${(intelligence?.risk?.risk_score * 100).toFixed(0)} / 100`, tier: intelligence?.risk?.risk_level, icon: Shield },
              priority: { label: 'Priority Scoring', value: `${intelligence?.priority?.priority_score} pts`, tier: `Rank #${intelligence?.priority?.rank}`, icon: Flame },
              duration: { label: 'Block Duration', value: `${intelligence?.duration?.p50_minutes} min`, tier: 'P50 Expected', icon: Clock },
              assetImpact: { label: 'Asset Life Delta', value: intelligence?.assetImpact?.availability_gain, tier: 'Upgrade', icon: Activity },
              trainImpact: { label: 'Timetable Impact', value: `${intelligence?.trainImpact?.total_delay_minutes}m Delay`, tier: 'Controlled', icon: Train },
              coordination: { label: 'Joint Bundling', value: `${intelligence?.optimization?.bundled_tasks?.length || 2} Tasks`, tier: 'Optimized', icon: Layers }
            }}
          />

          {/* Primary 2-Column Split Intelligence Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Detailed Diagnostics & Predictions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Conditional Active Focus Highlight */}
              {activeNode === 'risk' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RiskGauge
                    score={intelligence?.risk?.risk_score}
                    level={intelligence?.risk?.risk_level}
                    failureProbability={intelligence?.risk?.failure_probability}
                    safetyThreshold={intelligence?.risk?.safety_threshold}
                  />
                  <RiskScore
                    score={Math.round(intelligence?.risk?.risk_score * 100)}
                    delta="+14%"
                    timeframe="Past 30 Days"
                    breakdown={intelligence?.risk?.subsystem_breakdown || [
                      { label: 'Rail Fatigue', value: 42 },
                      { label: 'Weld Defect', value: 28 },
                      { label: 'Ballast Cushion', value: 16 },
                      { label: 'Fastener Clamps', value: 14 }
                    ]}
                  />
                </div>
              )}

              {activeNode === 'priority' && (
                <div className="space-y-6">
                  <PriorityIndicator
                    score={intelligence?.priority?.priority_score}
                    rank={`P${intelligence?.priority?.rank} - HIGH PRIORITY`}
                    factors={intelligence?.priority?.factors}
                  />
                  <PriorityRanking
                    tasks={mockTasks.map(t => ({
                      id: t.id,
                      asset: t.asset_id,
                      title: t.title,
                      priority: t.priority_score,
                      risk: t.risk_level,
                      section: t.track_section
                    }))}
                    currentTaskId={taskId}
                  />
                </div>
              )}

              {activeNode === 'duration' && (
                <DurationForecast
                  nominalMinutes={intelligence?.duration?.nominal_minutes}
                  p10Minutes={intelligence?.duration?.p10_minutes}
                  p50Minutes={intelligence?.duration?.p50_minutes}
                  p90Minutes={intelligence?.duration?.p90_minutes}
                  weatherVariance={intelligence?.duration?.weather_variance}
                  crewExperienceVariance={intelligence?.duration?.crew_variance}
                />
              )}

              {activeNode === 'assetImpact' && (
                <AssetImpactIndicator
                  currentHealth={intelligence?.assetImpact?.current_health}
                  postMaintenanceHealth={intelligence?.assetImpact?.projected_health}
                  availabilityGain={intelligence?.assetImpact?.availability_gain}
                  failureProbabilityDrop={intelligence?.assetImpact?.failure_probability_drop}
                  speedRestoration={intelligence?.assetImpact?.speed_restoration}
                />
              )}

              {activeNode === 'trainImpact' && (
                <div className="space-y-6">
                  <TrainImpactTimeline
                    windowStart={intelligence?.trainImpact?.window_start}
                    windowEnd={intelligence?.trainImpact?.window_end}
                    totalDelayMinutes={intelligence?.trainImpact?.total_delay_minutes}
                    timelineSlots={intelligence?.trainImpact?.timeline_slots}
                  />
                  <AffectedTrainList trains={intelligence?.trainImpact?.affected_trains} />
                </div>
              )}

              {activeNode === 'coordination' && (
                <div className="space-y-6">
                  <CoordinationIntelligence
                    bundledTasks={intelligence?.optimization?.bundled_tasks}
                    savings={intelligence?.optimization?.synergy_savings}
                  />
                </div>
              )}

              {/* Core Feature Importance (SHAP) Chart & Diagnostics */}
              <FeatureImportanceChart
                features={intelligence?.explanation?.features}
                title="SHAP Attribution Vector"
              />

              <RiskExplanation
                explanation={intelligence?.explanation?.summary}
                confidence={intelligence?.explanation?.confidence}
                recommendations={intelligence?.explanation?.recommendations}
              />
            </div>

            {/* Right Column (5 cols): Optimization Engine & Decision Support */}
            <div className="lg:col-span-5 space-y-6">
              <RecommendationPanel
                recommendedWindow={intelligence?.optimization?.recommended_window}
                benefits={intelligence?.optimization?.benefits}
              />

              <BaselineComparison
                metrics={intelligence?.optimization?.baseline_metrics}
              />

              <DynamicReplanningPanel
                onSimulate={(params) => {
                  console.log('Simulating new params:', params)
                  loadAllIntelligence()
                }}
              />

              <PredictionPipeline />

              <ModelMetadata />

              <div className="flex items-center justify-between pt-2">
                <PredictionTimestamp timestamp={new Date().toISOString()} />
                <span className="text-[10px] font-mono text-[#767676]">SMART-Rail v2.0.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
