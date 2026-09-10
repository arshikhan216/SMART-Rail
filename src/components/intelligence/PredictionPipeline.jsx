import React from 'react'
import { Cpu } from 'lucide-react'

export default function PredictionPipeline({
  steps = [
    { title: 'Corridor Telemetry Ingestion', desc: 'USFD flaw depth, track geometry, axle MGT', time: '12ms', status: 'done' },
    { title: 'Feature Preprocessing & Scaling', desc: 'Standardized 42 engineering features', time: '8ms', status: 'done' },
    { title: 'XGBoost Risk Inference', desc: 'Tree depth=6, calibrated failure probability', time: '22ms', status: 'done' },
    { title: 'TreeSHAP Attribution', desc: 'Top-k contributing feature vectors calculated', time: '35ms', status: 'done' },
    { title: 'CP-SAT Window Optimization', desc: 'Integer constraint solver executed 1,000 bounds', time: '48ms', status: 'done' }
  ]
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">End-to-End Prediction Pipeline</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
          Total Latency: 125ms
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-[#F2B759]/20 text-[#252525] flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#252525]">{step.title}</span>
                <span className="font-mono text-[10px] text-[#767676]">{step.time}</span>
              </div>
              <p className="text-[11px] text-[#767676]">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
