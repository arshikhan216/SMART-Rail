import React from 'react'
import { Shield, Flame, Clock, Activity, Train, Layers, Sparkles, ChevronRight } from 'lucide-react'

export default function IntelligenceOrbit({
  activeNode = 'risk',
  onSelectNode,
  metrics = {
    risk: { label: 'Risk Assessment', value: '78 / 100', tier: 'High', icon: Shield },
    priority: { label: 'Priority Scoring', value: '92 pts', tier: 'P1 Urgent', icon: Flame },
    duration: { label: 'Block Duration', value: '210 min', tier: 'P50 Median', icon: Clock },
    assetImpact: { label: 'Asset Life Delta', value: '+34% Health', tier: 'Upgrade', icon: Activity },
    trainImpact: { label: 'Timetable Impact', value: '67 min Delay', tier: 'Controlled', icon: Train },
    coordination: { label: 'Joint Bundling', value: '2 Tasks', tier: 'Optimized', icon: Layers }
  }
}) {
  const nodes = [
    { key: 'risk', ...metrics.risk },
    { key: 'priority', ...metrics.priority },
    { key: 'duration', ...metrics.duration },
    { key: 'assetImpact', ...metrics.assetImpact },
    { key: 'trainImpact', ...metrics.trainImpact },
    { key: 'coordination', ...metrics.coordination }
  ]

  return (
    <div className="bg-gradient-to-br from-[#252525] to-[#1A1A1A] text-white border border-[#383838] rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#F2B759]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F2B759]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#F2B759]">
              ML Intelligence Node Graph
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            6-Dimensional Predictive Synthesis
          </h2>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-white/10 rounded-full border border-white/15 text-[#F2EFE7]">
          Corridor: RKMP - BPL Junction
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
        {nodes.map((node) => {
          const Icon = node.icon
          const isSelected = activeNode === node.key

          return (
            <button
              key={node.key}
              onClick={() => onSelectNode && onSelectNode(node.key)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-300 relative ${
                isSelected
                  ? 'bg-[#F2B759]/20 border-[#F2B759] shadow-lg shadow-[#F2B759]/10 transform scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#F2B759] text-[#252525]' : 'bg-white/10 text-[#F2B759]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80">
                  {node.tier}
                </span>
              </div>

              <div className="text-[11px] text-white/60 font-medium">{node.label}</div>
              <div className="text-base font-bold font-mono text-white mt-0.5 flex items-center justify-between">
                <span>{node.value}</span>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[#F2B759]" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-mono">
        <span>Active Focus: <strong className="text-[#F2B759] uppercase">{activeNode}</strong></span>
        <span>Model Registry v2.0.0 · Active</span>
      </div>
    </div>
  )
}
