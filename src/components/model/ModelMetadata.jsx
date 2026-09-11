import React from 'react'
import { Cpu } from 'lucide-react'

export default function ModelMetadata({
  modelInfo = {
    name: 'SMART-Rail Multi-Engine v2.0.0',
    riskEngine: 'XGBoost Risk Classifier v2.3.1 (AUC 0.94)',
    durationEngine: 'Quantile Gradient Booster v1.8 (MAE 14.2m)',
    optimizer: 'OR-Tools CP-SAT v9.8',
    trainedOn: 'RKMP-BPL Corridor (1,137 assets, 5,098 train movements)',
    lastTrained: '01 Sep 2026',
    calibrationStatus: 'Calibrated (Brier Score 0.042)'
  }
}) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#F2B759]" />
          <h3 className="text-sm font-semibold text-[#252525]">Active ML Model Registry</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
          Production Verified
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between py-1 border-b border-[#F2EFE7]">
          <span className="text-[#767676]">Risk Engine:</span>
          <span className="font-medium text-[#252525]">{modelInfo.riskEngine}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[#F2EFE7]">
          <span className="text-[#767676]">Duration Quantiles:</span>
          <span className="font-medium text-[#252525]">{modelInfo.durationEngine}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[#F2EFE7]">
          <span className="text-[#767676]">Constraint Optimizer:</span>
          <span className="font-medium text-[#252525]">{modelInfo.optimizer}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[#F2EFE7]">
          <span className="text-[#767676]">Training Dataset:</span>
          <span className="font-medium text-[#252525]">{modelInfo.trainedOn}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-[#767676]">Model Calibration:</span>
          <span className="font-medium text-emerald-700">{modelInfo.calibrationStatus}</span>
        </div>
      </div>
    </div>
  )
}
