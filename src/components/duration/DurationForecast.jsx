import React from 'react'
import { Clock } from 'lucide-react'
import PredictionRange from './PredictionRange'

export default function DurationForecast({
  nominalMinutes = 180,
  p50Minutes = 210,
  p90Minutes = 255,
  p10Minutes = 165,
  weatherVariance = '+15 min (Rainfall factor)',
  crewExperienceVariance = '-10 min (Senior Squad)'
}) {
  const formatHours = (m) => {
    const hrs = Math.floor(m / 60)
    const mins = m % 60
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`
  }

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Quantile Regression ML</span>
          <h3 className="text-sm font-semibold text-[#252525]">Maintenance Block Duration Forecast</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono text-[#252525] bg-[#F2B759]/15 px-2.5 py-1 rounded-full border border-[#F2B759]/30">
          <Clock className="w-3.5 h-3.5 text-[#F2B759]" />
          <span>P50: {formatHours(p50Minutes)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#F9F8F5] border border-[#E5E1D8] p-3 rounded-xl text-center">
          <span className="text-[10px] font-mono text-[#767676] block">P10 (Optimistic)</span>
          <span className="text-lg font-bold font-mono text-[#252525] block mt-0.5">{formatHours(p10Minutes)}</span>
          <span className="text-[10px] text-emerald-600 font-mono">10% risk threshold</span>
        </div>
        <div className="bg-[#F2B759]/10 border border-[#F2B759]/40 p-3 rounded-xl text-center">
          <span className="text-[10px] font-mono text-[#252525] font-semibold block">P50 (Nominal Expected)</span>
          <span className="text-xl font-extrabold font-mono text-[#252525] block mt-0.5">{formatHours(p50Minutes)}</span>
          <span className="text-[10px] text-[#767676] font-mono">Median historical execution</span>
        </div>
        <div className="bg-red-50/60 border border-red-200 p-3 rounded-xl text-center">
          <span className="text-[10px] font-mono text-red-800 block">P90 (Safety Reserve)</span>
          <span className="text-lg font-bold font-mono text-red-700 block mt-0.5">{formatHours(p90Minutes)}</span>
          <span className="text-[10px] text-red-600 font-mono">90% completion certainty</span>
        </div>
      </div>

      <PredictionRange
        p10={p10Minutes}
        p50={p50Minutes}
        p90={p90Minutes}
        nominal={nominalMinutes}
      />

      <div className="mt-4 pt-3 border-t border-[#F2EFE7] grid grid-cols-2 gap-2 text-xs font-mono text-[#767676]">
        <div>Weather variance factor: <span className="text-[#252525]">{weatherVariance}</span></div>
        <div>Crew coefficient: <span className="text-emerald-700">{crewExperienceVariance}</span></div>
      </div>
    </div>
  )
}
