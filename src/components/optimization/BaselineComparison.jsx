import React from 'react'

export default function BaselineComparison({
  metrics = [
    { name: 'Total Corridor Delay', manual: '115 minutes', ai: '67 minutes', diff: '-41.7%' },
    { name: 'Block Window Utilization', manual: '68% efficiency', ai: '91% efficiency', diff: '+23.0%' },
    { name: 'Secondary Cascading Delay', manual: '4 Trains Held', ai: '1 Train Regulated', diff: '-75.0%' },
    { name: 'Joint Maintenance Synergy', manual: '0 Bundled (Separate blocks)', ai: '2 Tasks Bundled', diff: '1 Block Saved' }
  ]
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Impact Quantification</span>
          <h3 className="text-sm font-semibold text-[#252525]">AI Optimized Schedule vs Manual Baseline</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left">
          <thead>
            <tr className="border-b border-[#E5E1D8] text-[10px] text-[#767676] uppercase">
              <th className="pb-2 font-medium">Metric</th>
              <th className="pb-2 font-medium">Manual Schedule</th>
              <th className="pb-2 font-medium">SMART-Rail AI Schedule</th>
              <th className="pb-2 font-medium text-right">Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE7]">
            {metrics.map((m, i) => (
              <tr key={i} className="py-2.5">
                <td className="py-2.5 font-medium text-[#252525]">{m.name}</td>
                <td className="py-2.5 text-[#767676]">{m.manual}</td>
                <td className="py-2.5 font-semibold text-[#252525] bg-[#F2B759]/10 px-2 rounded">
                  {m.ai}
                </td>
                <td className="py-2.5 text-right font-bold text-emerald-700">{m.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
