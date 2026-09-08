import { useCallback, useState } from 'react'

/**
 * Hover tooltip state for the hand-rolled SVG charts.
 *
 * Positions relative to the nearest ancestor carrying `data-chart-host`, so
 * the tooltip element can live anywhere inside that positioned container.
 * Callers draw hit targets larger than the marks themselves.
 */
export default function useTooltip() {
  const [tip, setTip] = useState(null)

  const show = useCallback((event, content) => {
    const host = event.currentTarget.closest('[data-chart-host]')
    if (!host) return
    const bounds = host.getBoundingClientRect()
    setTip({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      content,
    })
  }, [])

  const hide = useCallback(() => setTip(null), [])

  return { tip, show, hide }
}
