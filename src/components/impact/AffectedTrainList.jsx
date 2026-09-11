import React from 'react'
import { Train } from 'lucide-react'

export default function AffectedTrainList({
  trains = [
    { number: '20172', name: 'Vande Bharat Express', type: 'Superfast', schedule: '14:35 - 14:55', impact: 'Slowdown', delay: '+8 min', status: 'Priority Protected' },
    { number: '12002', name: 'Bhopal Shatabdi', type: 'Shatabdi', schedule: '15:10 - 15:30', impact: 'Detour Loop', delay: '+14 min', status: 'Rerouted to Middle Line' },
    { number: 'BOXN-882', name: 'Goods Freight (Coal)', type: 'Freight', schedule: '14:00 - 16:30', impact: 'Regulated', delay: '+45 min', status: 'Held at Nishatpura' }
  ]
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">Affected Timetable Services</h3>
        </div>
        <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {trains.length} Movements Intersected
        </span>
      </div>

      <div className="divide-y divide-[#F2EFE7]">
        {trains.map((train, idx) => (
          <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#252525]">{train.number}</span>
                <span className="font-semibold text-[#4A4A4A] truncate">{train.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F2EFE7] rounded text-[#767676]">
                  {train.type}
                </span>
              </div>
              <div className="text-[11px] text-[#767676] font-mono mt-1">
                Scheduled: {train.schedule} · <span className="text-[#252525] font-medium">{train.status}</span>
              </div>
            </div>

            <div className="text-right shrink-0 font-mono">
              <span className={`text-xs font-bold ${
                train.delay.includes('+4') || train.delay.includes('+3') ? 'text-amber-700' : 'text-[#252525]'
              }`}>
                {train.delay}
              </span>
              <span className="text-[10px] text-[#767676] block">{train.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
