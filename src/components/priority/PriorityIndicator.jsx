import React from 'react'
import { Flame } from 'lucide-react'

export default function PriorityIndicator({
  score = 92,
  rank = 'P1 - URGENT',
  factors = [
    { name: 'Risk Weight (40%)', value: '36.8 pts' },
    { name: 'Line Criticality (30%)', value: '28.5 pts (A-Class HDN)' },
    { name: 'Asset Redundancy (15%)', value: '14.2 pts (Single Route)' },
    { name: 'Deadline Proximity (15%)', value: '12.5 pts (<48 hrs)' }
  ]
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Multi-Criteria Priority Engine</span>
          <h3 className="text-sm font-semibold text-[#252525]">Maintenance Schedule Priority</h3>
        </div>
        <span className="px-3 py-1 text-xs font-mono font-bold bg-[#252525] text-white rounded-lg flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#F2B759]" />
          {rank}
        </span>
      </div>

      <div className="flex items-baseline justify-between py-2 border-b border-[#F2EFE7]">
        <div>
          <span className="text-3xl font-extrabold font-mono text-[#252525]">{score}</span>
          <span className="text-xs text-[#767676] font-mono ml-1">/ 100 pts</span>
        </div>
        <span className="text-xs text-red-600 font-mono font-medium">Rank #1 in Bhopal Division Backlog</span>
      </div>

      <div className="mt-3 space-y-2">
        <span className="text-[10px] font-mono text-[#767676] uppercase">Factor Breakdown</span>
        {factors.map((f, i) => (
          <div key={i} className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#767676]">{f.name}</span>
            <span className="font-semibold text-[#252525]">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
