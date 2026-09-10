import React from 'react'
import { Calendar, Clock, CheckSquare } from 'lucide-react'

export default function RecommendationPanel({
  recommendedWindow = {
    date: 'Tomorrow, 10 Sep 2026',
    time: '14:00 - 17:30 IST',
    duration: '210 Minutes (P50)',
    trackSection: 'RKMP-BPL Up Main (Km 824.2 - 825.8)',
    confidence: '96% Feasibility'
  },
  benefits = [
    "Minimizes passenger train delay by 42% compared to morning baseline",
    "Allows joint bundling with TSK-2024-003 OHE insulator cleaning",
    "Provides 45-minute safety cushion before Rajdhani Express transit"
  ]
}) {
  return (
    <div className="bg-white border-2 border-[#F2B759] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">CP-SAT Constraint Solver</span>
          <h3 className="text-base font-bold text-[#252525]">AI Recommended Maintenance Slot</h3>
        </div>
        <span className="px-3 py-1 text-xs font-mono font-bold bg-[#F2B759] text-[#252525] rounded-lg">
          {recommendedWindow.confidence}
        </span>
      </div>

      <div className="bg-[#F9F8F5] border border-[#E5E1D8] p-4 rounded-xl space-y-2 mb-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#767676] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#F2B759]" /> Recommended Date:
          </span>
          <span className="font-bold text-[#252525]">{recommendedWindow.date}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#767676] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F2B759]" /> Optimal Time Window:
          </span>
          <span className="font-bold text-[#252525]">{recommendedWindow.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#767676]">Section Segment:</span>
          <span className="font-medium text-[#252525]">{recommendedWindow.trackSection}</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-mono text-[#767676] uppercase tracking-wider block">
          Optimization Highlights
        </span>
        {benefits.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[#252525]">
            <CheckSquare className="w-3.5 h-3.5 text-[#F2B759] shrink-0 mt-0.5" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
