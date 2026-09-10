import React from 'react'
import { BrainCircuit, Sparkles } from 'lucide-react'

export default function LoadingState({
  message = 'Loading ML inferences...',
  submessage = 'Evaluating SHAP feature attributions and CP-SAT schedule matrices'
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[#E5E1D8] bg-[#F9F8F5]/80 backdrop-blur-sm min-h-[260px]">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#F2B759]/30 border-t-[#F2B759] animate-spin flex items-center justify-center"></div>
        <BrainCircuit className="w-5 h-5 text-[#252525] absolute inset-0 m-auto animate-pulse" />
      </div>
      <h3 className="text-sm font-semibold tracking-wide text-[#252525] uppercase flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#F2B759]" />
        {message}
      </h3>
      <p className="text-xs text-[#767676] mt-1.5 max-w-sm font-mono">
        {submessage}
      </p>
    </div>
  )
}
