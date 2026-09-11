import React from 'react'
import { Brain, CheckCircle2, Sparkles } from 'lucide-react'

export default function RiskExplanation({
  explanation = "Model analysis flags Ultrasonic Flaw Depth (4.8mm) in combination with high axle fatigue (52.4 MGT) as the primary risk accelerator. Without intervention within 14 days, failure probability escalates from 0.78 to 0.93.",
  confidence = 0.94,
  recommendations = [
    "Schedule ultrasonic rail testing machine (USFD) validation within 7 days",
    "Prepare track renewal clamp & welding squad for 3.5-hour corridor block",
    "Bundle with OHE inspection window on adjacent RKMP-BPL Up-Line"
  ]
}) {
  return (
    <div className="bg-gradient-to-br from-[#F9F8F5] to-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F2B759]/20 flex items-center justify-center text-[#252525]">
            <Brain className="w-4 h-4 text-[#252525]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#252525]">AI Synthesis & Root Cause Explanation</h3>
            <span className="text-[10px] text-[#767676] font-mono">Natural Language Diagnostics</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F2B759]/15 border border-[#F2B759]/30 rounded-full text-xs font-mono font-medium text-[#252525]">
          <Sparkles className="w-3.5 h-3.5 text-[#F2B759]" />
          <span>{(confidence * 100).toFixed(0)}% Confidence</span>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-white border border-[#E5E1D8] text-xs text-[#252525] leading-relaxed">
        {explanation}
      </div>

      {recommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-mono uppercase text-[#767676] tracking-wider block">
            Recommended Action Items (Human Decision Support)
          </span>
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#4A4A4A] bg-[#F2EFE7]/40 p-2 rounded border border-[#E5E1D8]/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F2B759] shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
