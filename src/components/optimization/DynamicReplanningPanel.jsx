import React, { useState } from 'react'
import { Sliders, RefreshCw, Sparkles } from 'lucide-react'

export default function DynamicReplanningPanel({ onSimulate }) {
  const [duration, setDuration] = useState(210)
  const [startHour, setStartHour] = useState(14)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulate = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setIsSimulating(false)
      if (onSimulate) onSimulate({ duration, startHour })
    }, 600)
  }

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">Dynamic Replanning & What-If Simulation</h3>
        </div>
        <span className="text-[10px] font-mono text-[#767676]">Interactive Parameter Sweep</span>
      </div>

      <p className="text-xs text-[#767676] mb-4">
        Adjust corridor constraints to re-evaluate CP-SAT train delay and risk trade-offs in real time.
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-[#4A4A4A]">Allocated Block Duration:</span>
            <span className="font-bold text-[#252525]">{duration} minutes ({Math.floor(duration/60)}h {duration%60}m)</span>
          </div>
          <input
            type="range"
            min="120"
            max="360"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-[#F2B759] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-[#4A4A4A]">Window Start Time:</span>
            <span className="font-bold text-[#252525]">{startHour}:00 IST</span>
          </div>
          <input
            type="range"
            min="6"
            max="22"
            step="1"
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full accent-[#F2B759] cursor-pointer"
          />
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full py-2 bg-[#252525] text-white hover:bg-[#383838] rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-[#F2B759] animate-spin" />
              Solving Constraints...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#F2B759]" />
              Run Dynamic Re-inference
            </>
          )}
        </button>
      </div>
    </div>
  )
}
