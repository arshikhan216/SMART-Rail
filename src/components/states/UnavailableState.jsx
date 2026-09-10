import React from 'react'
import { Cpu } from 'lucide-react'

export default function UnavailableState({ modelName = 'Model Service', fallbackActive = true }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50/60">
      <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
        <Cpu className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">{modelName} Offline</h4>
          {fallbackActive && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-amber-200/80 text-amber-900 rounded-full">
              Local Telemetry Fallback Active
            </span>
          )}
        </div>
        <p className="text-xs text-amber-800/90 mt-0.5">
          Inference is operating on verified RKMP-BPL corridor baseline cache. Dynamic real-time recalibration paused.
        </p>
      </div>
    </div>
  )
}
