/* Shared tone maps. Telemetry semantics from design.md:
   red = urgent, amber = warning, green = nominal, blue = informational. */

export const chipTone = {
  urgent: 'bg-urgent-tint border-urgent-line text-urgent',
  warning: 'bg-warning-tint border-warning-line text-warning',
  nominal: 'bg-nominal-tint border-nominal-line text-nominal',
  telemetry: 'bg-telemetry-tint border-telemetry-line text-telemetry',
  accent: 'bg-accent-wash border-accent-line text-accent-deep',
  neutral: 'bg-canvas border-line text-ink-muted',
  ink: 'bg-ink border-ink text-accent',
}

export const textTone = {
  urgent: 'text-urgent',
  warning: 'text-warning',
  nominal: 'text-nominal',
  telemetry: 'text-telemetry',
  accent: 'text-accent-deep',
  neutral: 'text-ink-muted',
  ink: 'text-ink',
}

export const dotTone = {
  urgent: 'bg-urgent',
  warning: 'bg-warning',
  nominal: 'bg-nominal',
  telemetry: 'bg-telemetry',
  accent: 'bg-accent',
  neutral: 'bg-ink-subtle',
  ink: 'bg-ink',
}

export const fillTone = {
  urgent: 'bg-urgent',
  warning: 'bg-warning',
  nominal: 'bg-nominal',
  telemetry: 'bg-telemetry',
  accent: 'bg-accent',
  neutral: 'bg-ink-subtle',
  ink: 'bg-ink',
}

/* 3px left-accent rail used to indicate block status on cards and rows. */
export const railTone = {
  urgent: 'border-l-urgent',
  warning: 'border-l-warning',
  nominal: 'border-l-nominal',
  telemetry: 'border-l-telemetry',
  accent: 'border-l-accent',
  neutral: 'border-l-line',
  ink: 'border-l-ink',
}

export const priorityTone = {
  CRITICAL: 'urgent',
  HIGH: 'warning',
  MEDIUM: 'neutral',
  High: 'warning',
  Medium: 'neutral',
  Low: 'neutral',
}

export const riskTone = {
  Low: 'nominal',
  Medium: 'warning',
  High: 'urgent',
}

/* Corridor possession states -> bar colour. */
export const corridorState = {
  clear: 'bg-nominal',
  window: 'bg-accent',
  conflict: 'bg-urgent',
  ghost: 'bg-ink-subtle/40',
}
