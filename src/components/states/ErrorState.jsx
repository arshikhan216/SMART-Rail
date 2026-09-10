import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({ error, onRetry, title = 'Prediction Computation Failed' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-200 bg-red-50/50 min-h-[220px]">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="text-xs text-red-700 mt-1 max-w-md">
        {error?.message || error || 'Unable to retrieve ML model output. Please verify backend service availability or network connection.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[#252525] bg-white border border-[#E5E1D8] rounded-lg shadow-sm hover:bg-[#F2EFE7] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F2B759]" />
          Retry Inference
        </button>
      )}
    </div>
  )
}
