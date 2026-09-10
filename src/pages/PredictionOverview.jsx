import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cpu, Shield, Clock, Flame, Activity, ArrowRight, RefreshCw, Sparkles, Filter } from 'lucide-react'
import RiskLevelBadge from '../components/risk/RiskLevelBadge'
import ModelMetadata from '../components/model/ModelMetadata'
import ModelStatus from '../components/model/ModelStatus'
import { mockTasks, mockAssets } from '../data/mockIntelligenceData'

export default function PredictionOverview() {
  const [filter, setFilter] = useState('ALL')

  const filteredTasks = mockTasks.filter(t => {
    if (filter === 'CRITICAL') return t.risk_level === 'CRITICAL'
    if (filter === 'HIGH') return t.risk_level === 'HIGH'
    return true
  })

  return (
    <div className="min-h-screen bg-[#F2EFE7] text-[#252525] p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#767676] mb-1">
            <span className="text-[#252525] font-semibold">SMART-Rail ML Telemetry</span>
            <span>/</span>
            <span>Prediction Registry</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#252525] tracking-tight">
            Machine Learning Inferences & Health Scores
          </h1>
          <p className="text-xs text-[#767676] font-mono mt-0.5">
            Real-time inference queue for RKMP-BPL corridor assets and scheduled maintenance windows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ModelStatus latency="42ms" isFallback={false} />
        </div>
      </header>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E5E1D8] p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-[#767676] uppercase block">Monitored Assets</span>
          <span className="text-2xl font-extrabold font-mono text-[#252525] mt-1 block">1,137</span>
          <span className="text-[10px] text-emerald-600 font-mono">100% telemetry synced</span>
        </div>
        <div className="bg-white border border-[#E5E1D8] p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-red-800 uppercase block">Critical Risk Flags</span>
          <span className="text-2xl font-extrabold font-mono text-red-600 mt-1 block">12</span>
          <span className="text-[10px] text-red-600 font-mono">Immediate block recommended</span>
        </div>
        <div className="bg-white border border-[#E5E1D8] p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-[#767676] uppercase block">Average Model AUC</span>
          <span className="text-2xl font-extrabold font-mono text-[#252525] mt-1 block">0.942</span>
          <span className="text-[10px] text-[#F2B759] font-mono font-medium">Brier calibrated</span>
        </div>
        <div className="bg-white border border-[#E5E1D8] p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-[#767676] uppercase block">Corridor Delay Saved</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">41.7%</span>
          <span className="text-[10px] text-emerald-700 font-mono">Via CP-SAT optimization</span>
        </div>
      </div>

      {/* Tasks Inferences Table */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-[#252525]">Active Task Inferences</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#767676]" />
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${filter === 'ALL' ? 'bg-[#252525] text-white' : 'bg-[#F9F8F5] text-[#767676]'}`}
            >
              All ({mockTasks.length})
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${filter === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-[#F9F8F5] text-[#767676]'}`}
            >
              Critical
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[#E5E1D8] text-[10px] text-[#767676] uppercase">
                <th className="pb-2">Task ID</th>
                <th className="pb-2">Operation & Section</th>
                <th className="pb-2">Predicted Risk</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Duration (P50)</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE7]">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9F8F5]">
                  <td className="py-3 font-bold text-[#252525]">{t.id}</td>
                  <td className="py-3">
                    <span className="font-semibold text-[#252525] block">{t.title}</span>
                    <span className="text-[11px] text-[#767676]">{t.track_section} · {t.asset_id}</span>
                  </td>
                  <td className="py-3">
                    <RiskLevelBadge level={t.risk_level} size="sm" />
                  </td>
                  <td className="py-3 font-bold text-[#252525]">{t.priority_score} pts</td>
                  <td className="py-3 text-[#767676]">{t.duration_p50}m</td>
                  <td className="py-3">
                    <Link
                      to={`/maintenance-intelligence/${t.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#F2B759] text-[#252525] font-semibold rounded text-xs hover:opacity-90 transition-opacity"
                    >
                      Inspect ML Inferences <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModelMetadata />
    </div>
  )
}
