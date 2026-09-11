import React from 'react'

export default function PredictionRange({ p10 = 165, p50 = 210, p90 = 255, nominal = 180 }) {
  const min = Math.min(p10, nominal) - 30
  const max = Math.max(p90) + 30
  const range = max - min

  const getPercent = (val) => ((val - min) / range) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono text-[#767676]">
        <span>Confidence Interval (Quantile Range)</span>
        <span>Standard Error: ±18 min</span>
      </div>

      <div className="relative h-6 bg-[#F2EFE7] rounded-lg overflow-hidden flex items-center">
        <div
          className="absolute h-4 bg-[#F2B759]/40 border border-[#F2B759] rounded"
          style={{
            left: `${getPercent(p10)}%`,
            width: `${getPercent(p90) - getPercent(p10)}%`
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-1 bg-[#252525] z-10"
          style={{ left: `${getPercent(p50)}%` }}
          title={`P50 Median: ${p50}m`}
        />
        <div
          className="absolute top-1 bottom-1 w-0.5 bg-blue-600 border-dashed z-10"
          style={{ left: `${getPercent(nominal)}%` }}
          title={`Nominal manual estimate: ${nominal}m`}
        />
      </div>

      <div className="relative h-4 text-[10px] font-mono text-[#767676]">
        <span className="absolute" style={{ left: `${getPercent(p10)}%`, transform: 'translateX(-50%)' }}>
          P10 ({p10}m)
        </span>
        <span className="absolute font-bold text-[#252525]" style={{ left: `${getPercent(p50)}%`, transform: 'translateX(-50%)' }}>
          P50 ({p50}m)
        </span>
        <span className="absolute text-red-600" style={{ left: `${getPercent(p90)}%`, transform: 'translateX(-50%)' }}>
          P90 ({p90}m)
        </span>
      </div>
    </div>
  )
}
