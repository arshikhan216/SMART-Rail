import React from 'react'
import { BarChart3 } from 'lucide-react'

export default function FeatureImportanceChart({
  features = [
    { feature: 'Ultrasonic Flaw Depth', impact: 0.38, direction: 'increases_risk', value: '4.8 mm defect' },
    { feature: 'Track Service Age', impact: 0.24, direction: 'increases_risk', value: '14.2 years' },
    { feature: 'Cumulative Axle Load', impact: 0.19, direction: 'increases_risk', value: '52.4 MGT' },
    { feature: 'Vibration Anomaly Index', impact: 0.12, direction: 'increases_risk', value: '2.4g peak' },
    { feature: 'Recent Surface Tamping', impact: -0.15, direction: 'decreases_risk', value: 'Done 45d ago' },
    { feature: 'Ballast Cushion Depth', impact: -0.08, direction: 'decreases_risk', value: '310 mm' }
  ],
  title = 'SHAP Feature Attribution'
}) {
  const maxAbsImpact = Math.max(...features.map(f => Math.abs(f.impact)), 0.01)

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">{title}</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F9F8F5] border border-[#E5E1D8] text-[#767676] rounded">
          TreeSHAP Explainer
        </span>
      </div>
      <p className="text-xs text-[#767676] mb-4">
        Feature contribution vectors driving the ML model's risk classification for this track asset.
      </p>

      <div className="space-y-3">
        {features.map((item, index) => {
          const isPositive = item.impact > 0 || item.direction === 'increases_risk'
          const pct = (Math.abs(item.impact) / maxAbsImpact) * 100

          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#252525] flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {item.feature}
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[#767676]">{item.value}</span>
                  <span className={`font-semibold ${isPositive ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isPositive ? '+' : ''}{(item.impact * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-[#F2EFE7] rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isPositive ? 'bg-gradient-to-r from-[#F2B759] to-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F2EFE7] flex items-center justify-between text-[10px] text-[#767676] font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Increases Failure Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Mitigates / Decreases Risk
        </span>
      </div>
    </div>
  )
}
