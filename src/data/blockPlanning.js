/* ==========================================================================
   Block Planning — prototype dataset and local optimizer
   Data is kept separate from presentation: the screen renders whatever
   `optimizePlan` returns. All values are simulated for demonstration.

   Time is handled in minutes past midnight throughout.
   ========================================================================== */

export const toMin = (clock) => {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

export const toClock = (minutes) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(
    minutes % 60,
  ).padStart(2, '0')}`

/* --- Controls ------------------------------------------------------------ */

export const controls = {
  dates: ['06 Sep 2026', '07 Sep 2026', '08 Sep 2026'],
  sections: [
    'Section A · Track Segment',
    'Section B · Up Main',
    'Section C · Yard/Loop',
  ],
  windows: [
    '01:30 – 03:30 (120 min)',
    '02:00 – 03:30 (90 min)',
    '04:15 – 05:15 (60 min)',
  ],
  modes: ['Standard', 'Conservative', 'Aggressive'],
}

export const defaults = {
  date: controls.dates[0],
  section: controls.sections[0],
  window: controls.windows[0],
  mode: controls.modes[0],
  generatedAt: '04:42',
}

/** Parses "01:30 – 03:30 (120 min)" into a window spec. */
export function parseWindow(label) {
  const [from, to] = label.split(' (')[0].split(' – ')
  return { from, to, minutes: toMin(to) - toMin(from) }
}

/* --- Hard constraints ---------------------------------------------------- */

/* Train movements are timetable facts, not optimizer outputs. The plan is
   fitted around them; nothing here alters a train path. */
export const trainMovements = [
  { id: 'TM-01', label: 'Train Movement 01', from: '02:30', to: '02:45' },
  { id: 'TM-02', label: 'Train Movement 02', from: '03:10', to: '03:20' },
]

/* Site mobilisation before work can begin inside a fresh possession. */
export const MOBILISATION_MIN = 5

/* --- Candidate maintenance ---------------------------------------------- */

export const candidates = [
  {
    id: 'MNT-024',
    title: 'Track Geometry Correction',
    department: 'Engineering',
    discipline: 'Track Possession',
    minutes: 50,
    priority: 'CRITICAL',
    jointWith: 'MNT-031',
    defaultSelected: true,
  },
  {
    id: 'MNT-031',
    title: 'Signal Inspection',
    department: 'S&T',
    discipline: 'Signals Team',
    minutes: 25,
    priority: 'MEDIUM',
    jointWith: 'MNT-024',
    defaultSelected: true,
  },
  {
    id: 'MNT-042',
    title: 'OHE Inspection',
    department: 'TRD',
    discipline: 'Traction',
    minutes: 35,
    priority: 'HIGH',
    defaultSelected: false,
  },
  {
    id: 'MNT-037',
    title: 'Track Component Replacement',
    department: 'Engineering',
    discipline: 'P-Way',
    minutes: 60,
    priority: 'MEDIUM',
    defaultSelected: false,
  },
]

export const defaultSelection = candidates
  .filter((task) => task.defaultSelected)
  .map((task) => task.id)

/* --- Pipeline & legend --------------------------------------------------- */

/* Optimization stops at "Optimized Plan". Deterministic Validation is a
   separate, non-AI step performed under planner authority. */
export const pipeline = [
  { key: 'candidates', label: 'Candidate Tasks' },
  { key: 'constraints', label: 'Constraints' },
  { key: 'optimized', label: 'Optimized Plan' },
  { key: 'validation', label: 'Deterministic Validation', deterministic: true },
]

export const legend = [
  { label: 'Train Movement', swatch: 'movement' },
  { label: 'Available Window', swatch: 'window' },
  { label: 'Candidate Maintenance', swatch: 'candidate' },
  { label: 'Optimized Maintenance', swatch: 'optimized' },
  { label: 'Projected Conflict', swatch: 'conflict' },
]

/* --- Optimization priority order ---------------------------------------- */

/* Utilization is last on purpose: the optimizer is not trying to fill the
   window. It is ordering work under feasibility and value constraints. */
export const priorityOrder = [
  'Hard safety & feasibility constraints',
  'Critical maintenance',
  'High-value maintenance',
  'Asset availability',
  'Joint-maintenance benefit',
  'Operational efficiency',
  'Block utilization',
]

const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

/* --- Optimizer ----------------------------------------------------------- */

/**
 * Deterministic local placement. No external service, no network call.
 *
 * 1. Train movements carve the window into free gaps.
 * 2. Candidates are ordered by priority, then by duration.
 * 3. Tasks sharing a joint opportunity are placed concurrently inside one
 *    possession, so the pair costs one envelope of track time.
 * 4. Anything without a contiguous feasible gap is left out of the block.
 *    Slack is preserved rather than consumed.
 */
export function optimizePlan({
  selectedIds,
  window: windowSpec,
  movements = trainMovements,
  /* Set false to model the baseline counterfactual: single-department
     planning, where every task takes its own possession instead of sharing
     one. Defaults to true, so existing callers are unaffected. */
  allowJoint = true,
}) {
  const windowStart = toMin(windowSpec.from)
  const windowEnd = toMin(windowSpec.to)

  const occupied = movements
    .map((movement) => ({
      ...movement,
      start: toMin(movement.from),
      end: toMin(movement.to),
    }))
    .filter((movement) => movement.end > windowStart && movement.start < windowEnd)
    .sort((a, b) => a.start - b.start)

  /* Free gaps between hard constraints. */
  let gaps = []
  let cursor = windowStart
  occupied.forEach((movement) => {
    if (movement.start > cursor) gaps.push({ start: cursor, end: movement.start })
    cursor = Math.max(cursor, movement.end)
  })
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd })

  /* Build placement groups: joint pairs collapse into one envelope. */
  const selected = candidates.filter((task) => selectedIds.includes(task.id))
  const grouped = []
  const consumed = new Set()

  selected
    .slice()
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        b.minutes - a.minutes,
    )
    .forEach((task) => {
      if (consumed.has(task.id)) return
      const partner =
        allowJoint && task.jointWith && selectedIds.includes(task.jointWith)
          ? selected.find((other) => other.id === task.jointWith)
          : null

      if (partner) {
        consumed.add(task.id)
        consumed.add(partner.id)
        grouped.push({
          tasks: [task, partner].sort((a, b) => b.minutes - a.minutes),
          envelope: Math.max(task.minutes, partner.minutes),
          joint: true,
        })
      } else {
        consumed.add(task.id)
        grouped.push({ tasks: [task], envelope: task.minutes, joint: false })
      }
    })

  /* First-fit placement into the earliest gap that can hold the envelope. */
  const placements = []
  const unplaceable = []
  let mobilisationApplied = false

  grouped.forEach((group) => {
    const gapIndex = gaps.findIndex((gap) => {
      const offset = !mobilisationApplied && gap.start === windowStart ? MOBILISATION_MIN : 0
      return gap.end - (gap.start + offset) >= group.envelope
    })

    if (gapIndex === -1) {
      group.tasks.forEach((task) =>
        unplaceable.push({
          ...task,
          reason: `No contiguous ${task.minutes}m gap in window`,
        }),
      )
      return
    }

    const gap = gaps[gapIndex]
    const offset =
      !mobilisationApplied && gap.start === windowStart ? MOBILISATION_MIN : 0
    const start = gap.start + offset
    if (offset) mobilisationApplied = true

    placements.push({
      joint: group.joint,
      start,
      end: start + group.envelope,
      envelope: group.envelope,
      tasks: group.tasks.map((task) => ({
        ...task,
        start,
        end: start + task.minutes,
      })),
    })

    /* Consume the gap, keeping any pre-mobilisation remainder as slack. */
    const remainder = []
    if (offset) remainder.push({ start: gap.start, end: start })
    if (gap.end > start + group.envelope)
      remainder.push({ start: start + group.envelope, end: gap.end })
    gaps = [...gaps.slice(0, gapIndex), ...remainder, ...gaps.slice(gapIndex + 1)]
  })

  /* Remaining gaps are preserved slack, not wasted capacity. */
  const slackGaps = gaps
    .filter((gap) => gap.end > gap.start)
    .map((gap) => ({
      start: gap.start,
      end: gap.end,
      minutes: gap.end - gap.start,
    }))

  const slackMinutes = slackGaps.reduce((sum, gap) => sum + gap.minutes, 0)
  const possessionMinutes = placements.reduce(
    (sum, placement) => sum + placement.envelope,
    0,
  )
  const movementMinutes = occupied.reduce(
    (sum, movement) => sum + (movement.end - movement.start),
    0,
  )

  /* Deferred = never selected, plus anything the optimizer could not place. */
  const deferred = [
    ...candidates
      .filter((task) => !selectedIds.includes(task.id))
      .map((task) => ({
        ...task,
        reason: reasonForDeferral(task, slackGaps),
      })),
    ...unplaceable,
  ]

  const placedTasks = placements.flatMap((placement) => placement.tasks)
  const jointCount = placements.filter((placement) => placement.joint).length
  const criticalTotal = candidates.filter(
    (task) => task.priority === 'CRITICAL',
  ).length
  const criticalPlaced = placedTasks.filter(
    (task) => task.priority === 'CRITICAL',
  ).length

  return {
    windowStart,
    windowEnd,
    windowMinutes: windowEnd - windowStart,
    movements: occupied,
    placements,
    placedTasks,
    deferred,
    slackGaps,
    slackMinutes,
    possessionMinutes,
    movementMinutes,
    committedMinutes: possessionMinutes + movementMinutes,
    workMinutes: placedTasks.reduce((sum, task) => sum + task.minutes, 0),
    jointCount,
    criticalTotal,
    criticalPlaced,
    /* A projected conflict is a task the planner selected that cannot be
       placed without breaching a hard constraint. It needs planner review. */
    conflicts: unplaceable,
  }
}

function reasonForDeferral(task, slackGaps) {
  const largest = slackGaps.reduce((max, gap) => Math.max(max, gap.minutes), 0)
  if (task.minutes > largest) return `Exceeds largest free gap (${largest}m)`
  return 'Held for next window'
}

/* --- Why this plan ------------------------------------------------------- */

/* Concise, one line each. Derived from the live plan so the explanation
   never drifts from what the board shows. */
export function planRationale(plan) {
  const criticalNames = plan.placedTasks
    .filter((task) => task.priority === 'CRITICAL')
    .map((task) => task.id)

  return [
    {
      title: 'Critical maintenance prioritized',
      body: criticalNames.length
        ? `${criticalNames.join(', ')} placed first · ${plan.criticalPlaced} of ${plan.criticalTotal} critical`
        : 'No critical task currently selected',
      ok: plan.criticalPlaced === plan.criticalTotal,
    },
    {
      title: 'Available window considered',
      body: `${plan.possessionMinutes}m possession in a ${plan.windowMinutes}m window · ${plan.slackMinutes}m slack held`,
      ok: plan.slackMinutes > 0,
    },
    {
      title: 'Train movements respected',
      body: plan.movements.length
        ? `Zero overlap with ${plan.movements.map((m) => `${m.from}–${m.to}`).join(', ')}`
        : 'No timetabled movement in window',
      ok: plan.conflicts.length === 0,
    },
    {
      title: 'Section & resource compatibility',
      body: plan.jointCount
        ? `${plan.jointCount} joint possession · shared isolation, no plant clash`
        : 'No joint opportunity in current selection',
      ok: plan.jointCount > 0,
    },
  ]
}
