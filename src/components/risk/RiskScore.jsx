import React from 'react'
import { TrendingUp } from 'lucide-react'

export default function RiskScore({ score = 78, delta = '+14%', timeframe = 'Past 30 Days', breakdown = [] }) {
  const isElevated = score > 60

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Telemetry Anomaly Metric</span>
          <h3 className="text-sm font-semibold text-[#252525]">Track Health & Wear Index</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded ${
          isElevated ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <TrendingUp className="w-3.5 h-3.5" />
          {delta} ({timeframe})
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <div className="text-4xl font-extrabold font-mono text-[#252525]">{score}</div>
        <div className="text-xs text-[#767676]">
          <span className="font-semibold text-[#252525]">Degradation Velocity:</span> 0.42mm wear / MGT axle load
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#F2EFE7] pt-3">
          <span className="text-[10px] font-mono text-[#767676] uppercase">Contributing Subsystems</span>
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#4A4A4A]">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-[#F2EFE7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F2B759] rounded-full"
                    style={{ width: `${Math.min(100, item.value)}%` }}
                  />
                </div>
                <span className="font-semibold text-[#252525] w-8 text-right">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
