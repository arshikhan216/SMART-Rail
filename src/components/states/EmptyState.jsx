import React from 'react'
import { Layers } from 'lucide-react'

export default function EmptyState({
  title = 'No Inferences Available',
  message = 'Select a valid task or asset to generate machine learning risk scores, duration quantiles, and impact projections.'
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#E5E1D8] bg-[#F9F8F5] min-h-[240px]">
      <Layers className="w-10 h-10 text-[#767676]/60 mb-3" />
      <h3 className="text-sm font-semibold text-[#252525]">{title}</h3>
      <p className="text-xs text-[#767676] mt-1 max-w-sm">{message}</p>
    </div>
  )
}
