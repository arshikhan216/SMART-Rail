import React from 'react'
import { Layers, CheckCircle } from 'lucide-react'

export default function CoordinationIntelligence({
  bundledTasks = [
    { id: 'TSK-2024-001', dept: 'Civil Track', title: 'Ultrasonic Rail Weld Repair', duration: '210m' },
    { id: 'TSK-2024-003', dept: 'Electrical OHE', title: 'Cantilever Insulator De-glazing', duration: '90m' }
  ],
  savings = {
    blocksSaved: 1,
    overheadSavedMinutes: 75,
    coordinationScore: '94% Synergy'
  }
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#F2B759]" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Multi-Department Synergy</span>
            <h3 className="text-sm font-semibold text-[#252525]">Shadow Joint Maintenance Bundling</h3>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
          {savings.coordinationScore}
        </span>
      </div>

      <div className="p-3 bg-[#F9F8F5] border border-[#E5E1D8] rounded-lg mb-4 text-xs">
        <span className="text-[10px] font-mono text-[#767676] uppercase block mb-1">Bundled Operations in Single Block</span>
        <div className="space-y-2">
          {bundledTasks.map((task, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-[#252525]">{task.title}</span>
                  <span className="text-[10px] font-mono text-[#767676] block">{task.id} · {task.dept}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-[#767676]">{task.duration}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-[#F2EFE7]/50 p-2.5 rounded-lg text-center">
          <span className="text-[10px] text-[#767676] block">Separate Blocks Avoided</span>
          <span className="text-lg font-bold text-[#252525]">{savings.blocksSaved} Block</span>
        </div>
        <div className="bg-[#F2EFE7]/50 p-2.5 rounded-lg text-center">
          <span className="text-[10px] text-[#767676] block">Disruption Overhead Saved</span>
          <span className="text-lg font-bold text-emerald-700">{savings.overheadSavedMinutes} min</span>
        </div>
      </div>
    </div>
  )
}
