import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function AssetImpactIndicator({
  currentHealth = 48,
  postMaintenanceHealth = 94,
  availabilityGain = '+34%',
  failureProbabilityDrop = '-78%',
  speedRestoration = 'Restores 130 km/h sectional speed'
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Asset Lifecycle Impact</span>
          <h3 className="text-sm font-semibold text-[#252525]">Post-Maintenance Condition Delta</h3>
        </div>
        <span className="px-2.5 py-1 text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Condition Upgrade
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F9F8F5] border border-[#E5E1D8]">
        <div className="text-center flex-1">
          <span className="text-[10px] font-mono text-[#767676] block">Current Health</span>
          <span className="text-2xl font-bold font-mono text-amber-600">{currentHealth}%</span>
          <span className="text-[10px] text-[#767676] block mt-0.5">Degraded Tier</span>
        </div>

        <div className="flex flex-col items-center">
          <ArrowRight className="w-5 h-5 text-[#F2B759]" />
          <span className="text-[10px] font-mono text-emerald-600 font-bold mt-1">{availabilityGain}</span>
        </div>

        <div className="text-center flex-1">
          <span className="text-[10px] font-mono text-[#767676] block">Projected Health</span>
          <span className="text-2xl font-bold font-mono text-emerald-600">{postMaintenanceHealth}%</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Optimal Tier</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 bg-white border border-[#E5E1D8] rounded-lg">
          <span className="text-[10px] text-[#767676] block">Failure Rate Reduction</span>
          <span className="text-sm font-bold text-emerald-700">{failureProbabilityDrop}</span>
        </div>
        <div className="p-2.5 bg-white border border-[#E5E1D8] rounded-lg">
          <span className="text-[10px] text-[#767676] block">Speed Restriction</span>
          <span className="text-xs font-medium text-[#252525]">{speedRestoration}</span>
        </div>
      </div>
    </div>
  )
}
