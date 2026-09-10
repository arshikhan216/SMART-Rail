import React from 'react'
import { ShieldAlert, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react'

export default function RiskLevelBadge({ level = 'MEDIUM', showLabel = true, size = 'md' }) {
  const normalized = (level || 'MEDIUM').toUpperCase()

  const config = {
    CRITICAL: {
      bg: 'bg-red-500/10 text-red-600 border-red-500/30',
      dot: 'bg-red-500 animate-pulse',
      icon: ShieldAlert,
      label: 'Critical Risk'
    },
    HIGH: {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'High Risk'
    },
    MEDIUM: {
      bg: 'bg-[#F2B759]/15 text-[#252525] border-[#F2B759]/40',
      dot: 'bg-[#F2B759]',
      icon: AlertCircle,
      label: 'Medium Risk'
    },
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      label: 'Low Risk'
    }
  }

  const current = config[normalized] || config.MEDIUM
  const Icon = current.icon
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${current.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      {showLabel ? current.label : normalized}
    </span>
  )
}
