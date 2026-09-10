import React from 'react'

export default function ModelStatus({ latency = '42ms', status = 'ONLINE', isFallback = false }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-[#E5E1D8] rounded-lg text-xs font-mono shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="font-semibold text-[#252525]">{isFallback ? 'TELEMETRY CACHE' : 'ML ENGINE ONLINE'}</span>
      </div>
      <span className="text-[#E5E1D8]">|</span>
      <span className="text-[#767676]">Latency: <strong className="text-[#252525]">{latency}</strong></span>
    </div>
  )
}
