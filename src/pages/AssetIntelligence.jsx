import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Activity, ShieldAlert, Cpu, Calendar, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import RiskGauge from '../components/risk/RiskGauge'
import FeatureImportanceChart from '../components/explanation/FeatureImportanceChart'
import RiskExplanation from '../components/explanation/RiskExplanation'
import AssetImpactIndicator from '../components/impact/AssetImpactIndicator'
import ModelMetadata from '../components/model/ModelMetadata'
import ModelStatus from '../components/model/ModelStatus'
import { mockAssets } from '../data/mockIntelligenceData'

export default function AssetIntelligence() {
  const { assetId = 'TRK-RKMP-042' } = useParams()
  const asset = mockAssets.find(a => a.id === assetId) || mockAssets[0]

  return (
    <div className="min-h-screen bg-[#F2EFE7] text-[#252525] p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#767676] mb-1">
            <Link to="/app/map" className="hover:text-[#252525] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Corridor Assets
            </Link>
            <span>/</span>
            <span className="text-[#252525] font-semibold">Asset Degradation Intelligence</span>
            <span>/</span>
            <span>{asset.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#252525]">{asset.name}</h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#252525] text-white rounded">
              {asset.type}
            </span>
          </div>
          <p className="text-xs text-[#767676] font-mono mt-0.5">
            Location: {asset.location} · Commissioned: {asset.commissioned} · Cumulative Load: {asset.cumulative_load}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ModelStatus latency="35ms" isFallback={false} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RiskGauge
              score={asset.risk_score}
              level={asset.risk_level}
              failureProbability={asset.failure_probability}
              safetyThreshold={0.65}
              title="Track Failure Probability"
            />
            <AssetImpactIndicator
              currentHealth={asset.health_score}
              postMaintenanceHealth={95}
              availabilityGain="+41%"
              failureProbabilityDrop="-82%"
              speedRestoration="Removes 30 km/h temporary speed restriction"
            />
          </div>

          <FeatureImportanceChart
            features={asset.shap_features}
            title="Telemetry Degradation Drivers (SHAP)"
          />

          <RiskExplanation
            explanation={asset.explanation}
            confidence={0.96}
            recommendations={asset.recommendations}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#252525] mb-3">Associated Maintenance Tasks</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-[#F9F8F5] border border-[#E5E1D8] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#252525] block">TSK-2024-001</span>
                  <span className="text-[#767676]">Ultrasonic Rail Weld Repair</span>
                </div>
                <Link
                  to="/maintenance-intelligence/TSK-2024-001"
                  className="px-3 py-1 bg-[#F2B759] text-[#252525] font-semibold rounded text-xs hover:opacity-90"
                >
                  View ML Inferences
                </Link>
              </div>
            </div>
          </div>

          <ModelMetadata />
        </div>
      </div>
    </div>
  )
}
