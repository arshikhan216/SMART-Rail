import React from 'react'
import { ShieldAlert, Info } from 'lucide-react'
import RiskLevelBadge from './RiskLevelBadge'

export default function RiskGauge({
  score = 0.78,
  level = 'HIGH',
  failureProbability = 0.84,
  safetyThreshold = 0.65,
  title = 'Predicted Failure Risk'
}) {
  const normalizedScore = typeof score === 'number' ? (score > 1 ? score : score * 100) : 75
  const probabilityPercent = (failureProbability * 100).toFixed(1)
  const thresholdPercent = (safetyThreshold * 100).toFixed(0)

  const radius = 70
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (circumference * (normalizedScore / 100))

  const getColor = (s) => {
    if (s >= 80) return '#DC2626'
    if (s >= 65) return '#D97706'
    if (s >= 40) return '#F2B759'
    return '#059669'
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">AI Predictive Engine</span>
          <h3 className="text-sm font-semibold text-[#252525]">{title}</h3>
        </div>
        <RiskLevelBadge level={level} />
      </div>

      <div className="flex flex-col items-center justify-center my-2 relative">
        <svg className="w-44 h-24 overflow-visible" viewBox="0 0 160 85">
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#F2EFE7"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={getColor(normalizedScore)}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <line
            x1="80"
            y1="10"
            x2="80"
            y2="18"
            stroke="#252525"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
        </svg>

        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-3xl font-bold font-mono text-[#252525] tracking-tight">
            {normalizedScore.toFixed(0)}
            <span className="text-xs text-[#767676] font-normal">/100</span>
          </span>
          <span className="text-[11px] text-[#767676] font-medium mt-0.5">
            Risk Index
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F2EFE7] grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-[#F9F8F5] p-2.5 rounded-lg border border-[#E5E1D8]/60">
          <span className="text-[10px] text-[#767676] block">Failure Probability</span>
          <span className="font-semibold text-[#252525] text-sm">{probabilityPercent}%</span>
          <span className="text-[10px] text-red-600 block mt-0.5">Above safety baseline</span>
        </div>
        <div className="bg-[#F9F8F5] p-2.5 rounded-lg border border-[#E5E1D8]/60">
          <span className="text-[10px] text-[#767676] block">Safety Threshold</span>
          <span className="font-semibold text-[#252525] text-sm">{thresholdPercent}% max</span>
          <span className="text-[10px] text-[#767676] block mt-0.5">XGBoost-Risk-v2.3</span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-[#767676] bg-[#F2EFE7]/50 p-2 rounded">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F2B759]" />
        <span>Decision Support: AI risk scores assist railway engineers in scheduling priority. Not autonomous control.</span>
      </div>
    </div>
  )
}
