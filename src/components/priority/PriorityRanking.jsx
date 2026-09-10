import React from 'react'
import { ArrowUpDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskLevelBadge from '../risk/RiskLevelBadge'

export default function PriorityRanking({
  tasks = [
    { id: 'TSK-2024-001', asset: 'TRK-RKMP-042', title: 'Ultrasonic Rail Weld Repair', priority: 94, risk: 'CRITICAL', section: 'RKMP-BPL Up Main' },
    { id: 'TSK-2024-002', asset: 'SIG-BPL-118', title: 'Point Machine Detection Recalibration', priority: 88, risk: 'HIGH', section: 'BPL Yard North' },
    { id: 'TSK-2024-003', asset: 'OHE-RKMP-089', title: 'Cantilever Insulator De-glazing', priority: 76, risk: 'MEDIUM', section: 'RKMP-HBJ Middle' },
    { id: 'TSK-2024-004', asset: 'TRK-BPL-204', title: 'Turnout Frog Grinding & Dressing', priority: 71, risk: 'MEDIUM', section: 'BPL Platform 1/2' }
  ],
  currentTaskId = 'TSK-2024-001'
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">Backlog Priority Queue</h3>
        </div>
        <span className="text-[10px] font-mono text-[#767676]">{tasks.length} Active Candidates</span>
      </div>

      <div className="divide-y divide-[#F2EFE7]">
        {tasks.map((t, idx) => {
          const isSelected = t.id === currentTaskId
          return (
            <div
              key={t.id}
              className={`py-2.5 px-3 -mx-3 rounded-lg flex items-center justify-between transition-colors ${
                isSelected ? 'bg-[#F2B759]/15 border border-[#F2B759]/30' : 'hover:bg-[#F9F8F5]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold text-[#767676] w-4">{idx + 1}.</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#252525] truncate">{t.title}</span>
                    <span className="text-[10px] font-mono text-[#767676]">({t.id})</span>
                  </div>
                  <span className="text-[11px] text-[#767676] block truncate">{t.section} · {t.asset}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <RiskLevelBadge level={t.risk} size="sm" showLabel={false} />
                <span className="text-xs font-mono font-bold text-[#252525] w-12 text-right">{t.priority} pts</span>
                <Link
                  to={`/maintenance-intelligence/${t.id}`}
                  className="p-1 rounded hover:bg-[#E5E1D8] text-[#252525]"
                  title="View ML intelligence for task"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
