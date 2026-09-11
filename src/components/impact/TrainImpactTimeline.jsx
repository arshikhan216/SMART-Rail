import React from 'react'

export default function TrainImpactTimeline({
  windowStart = '14:00',
  windowEnd = '17:30',
  totalDelayMinutes = 67,
  timelineSlots = [
    { time: '14:00', event: 'Block Commences · Signals Set to Danger', state: 'prep' },
    { time: '14:35', event: '20172 Vande Bharat pass on bypass loop (+8m)', state: 'train' },
    { time: '15:10', event: '12002 Shatabdi regulated at outer signal (+14m)', state: 'train' },
    { time: '16:45', event: 'Tamping & ultrasonic weld testing complete', state: 'work' },
    { time: '17:30', event: 'Track Handover & Speed Relaxation to 130 km/h', state: 'clear' }
  ]
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676]">Timetable Conflict Engine</span>
          <h3 className="text-sm font-semibold text-[#252525]">Block Window & Train Conflict Timeline</h3>
        </div>
        <div className="text-right font-mono">
          <span className="text-xs font-bold text-[#252525]">{windowStart} - {windowEnd}</span>
          <span className="text-[10px] text-amber-700 block">Total Corridor Delay: {totalDelayMinutes}m</span>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E1D8]">
        {timelineSlots.map((slot, index) => {
          const isTrain = slot.state === 'train'
          return (
            <div key={index} className="relative group">
              <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                isTrain ? 'border-amber-500 bg-amber-500' : 'border-[#252525] bg-[#252525]'
              }`} />
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-bold text-[#252525] w-14 shrink-0">{slot.time}</span>
                <span className="text-[#4A4A4A] flex-1 ml-2">{slot.event}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
