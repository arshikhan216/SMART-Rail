import React from 'react'
import { Clock } from 'lucide-react'

export default function PredictionTimestamp({ timestamp = new Date().toISOString() }) {
  const formatted = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#767676]">
      <Clock className="w-3.5 h-3.5 text-[#F2B759]" />
      <span>Inference Computed: {formatted} IST</span>
    </div>
  )
}
