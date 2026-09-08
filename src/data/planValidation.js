/* ==========================================================================
   Plan Validation — deterministic feasibility checks
   Runs entirely on the plan produced by src/data/blockPlanning.js. No model,
   no scoring, no inference: every check is an arithmetic assertion over the
   placements, the timetabled movements and the window.

   Passing these checks means the plan is feasible and ready for authorized
   human review. It does not approve, authorize or release anything.
   ========================================================================== */

import { toClock } from './blockPlanning.js'

/** Minimum clearance required between maintenance and any train movement. */
export const MIN_BUFFER_MIN = 5

const overlap = (a, b) =>
  Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start))

/**
 * Safety buffer intervals: MIN_BUFFER_MIN either side of every timetabled
 * movement, clipped to the window. Maintenance must stay clear of these.
 */
export function bufferZones(plan) {
  const zones = []
  plan.movements.forEach((movement) => {
    const before = {
      start: Math.max(plan.windowStart, movement.start - MIN_BUFFER_MIN),
      end: movement.start,
      movement: movement.id,
      edge: 'before',
    }
    const after = {
      start: movement.end,
      end: Math.min(plan.windowEnd, movement.end + MIN_BUFFER_MIN),
      movement: movement.id,
      edge: 'after',
    }
    if (before.end > before.start) zones.push(before)
    if (after.end > after.start) zones.push(after)
  })
  return zones
}

/** Overlaps between maintenance placements and timetabled movements. */
export function conflictSpans(plan) {
  const spans = []
  plan.placements.forEach((placement) => {
    plan.movements.forEach((movement) => {
      const minutes = overlap(placement, movement)
      if (minutes > 0) {
        spans.push({
          start: Math.max(placement.start, movement.start),
          end: Math.min(placement.end, movement.end),
          minutes,
          movement: movement.id,
          tasks: placement.tasks.map((task) => task.id),
        })
      }
    })
  })
  return spans
}

/**
 * Six deterministic checks. Each returns ok/false plus a compact metric and,
 * on failure, the concrete reason.
 */
export function validatePlan(plan) {
  const zones = bufferZones(plan)
  const conflicts = conflictSpans(plan)

  /* 1 — Duration feasibility ------------------------------------------- */
  const unplaceable = plan.conflicts
  const durationOk =
    unplaceable.length === 0 && plan.possessionMinutes <= plan.windowMinutes

  /* 2 — Train operation conflict --------------------------------------- */
  const trainOk = conflicts.length === 0

  /* 3 — Resource availability ------------------------------------------ */
  /* Concurrent tasks inside one possession must not need the same team. */
  const resourceClashes = []
  plan.placements.forEach((placement) => {
    const seen = new Map()
    placement.tasks.forEach((task) => {
      if (seen.has(task.department)) {
        resourceClashes.push({
          department: task.department,
          tasks: [seen.get(task.department), task.id],
        })
      } else {
        seen.set(task.department, task.id)
      }
    })
  })
  const departments = [
    ...new Set(plan.placedTasks.map((task) => task.department)),
  ]
  const resourceOk = resourceClashes.length === 0

  /* 4 — Dependencies ---------------------------------------------------- */
  const placedIds = plan.placedTasks.map((task) => task.id)
  const unmetDependencies = []
  plan.placedTasks.forEach((task) => {
    ;(task.dependsOn ?? []).forEach((predecessorId) => {
      const predecessor = plan.placedTasks.find(
        (other) => other.id === predecessorId,
      )
      if (!predecessor || predecessor.end > task.start) {
        unmetDependencies.push({ task: task.id, requires: predecessorId })
      }
    })
  })
  const dependencyOk = unmetDependencies.length === 0

  /* 5 — Isolation / disconnection -------------------------------------- */
  /* Overlapping possessions on one section would demand conflicting
     isolation states, so distinct envelopes must not overlap in time. */
  const isolationClashes = []
  plan.placements.forEach((placement, index) => {
    plan.placements.slice(index + 1).forEach((other) => {
      if (overlap(placement, other) > 0) {
        isolationClashes.push({
          a: placement.tasks.map((task) => task.id).join('+'),
          b: other.tasks.map((task) => task.id).join('+'),
        })
      }
    })
  })
  const isolationOk = isolationClashes.length === 0

  /* 6 — Safety buffers -------------------------------------------------- */
  const bufferBreaches = []
  plan.placements.forEach((placement) => {
    zones.forEach((zone) => {
      const minutes = overlap(placement, zone)
      if (minutes > 0) {
        bufferBreaches.push({
          movement: zone.movement,
          minutes,
          tasks: placement.tasks.map((task) => task.id),
        })
      }
    })
  })

  /* Narrowest clearance actually achieved between work and any movement. */
  let minClearance = null
  plan.placements.forEach((placement) => {
    plan.movements.forEach((movement) => {
      const gap =
        placement.end <= movement.start
          ? movement.start - placement.end
          : movement.end <= placement.start
            ? placement.start - movement.end
            : 0
      minClearance = minClearance === null ? gap : Math.min(minClearance, gap)
    })
  })
  const bufferOk = bufferBreaches.length === 0

  const checks = [
    {
      key: 'duration',
      label: 'Duration',
      title: 'Maintenance duration feasible',
      ok: durationOk,
      metric: `${plan.possessionMinutes}m possession · ${plan.windowMinutes}m window`,
      pass: 'Feasible',
      fail: unplaceable.length
        ? `${unplaceable.map((task) => task.id).join(', ')} has no contiguous gap`
        : 'Possession exceeds available window',
    },
    {
      key: 'train',
      label: 'Train Conflict',
      title: 'No train-operation conflict',
      ok: trainOk,
      metric: plan.movements.length
        ? `Clear of ${plan.movements.length} timetabled movement${plan.movements.length === 1 ? '' : 's'}`
        : 'No movement in window',
      pass: 'None detected',
      fail: conflicts.length
        ? `${conflicts[0].tasks.join('+')} overlaps ${conflicts[0].movement} by ${conflicts[0].minutes}m`
        : 'Overlap detected',
    },
    {
      key: 'resources',
      label: 'Resources',
      title: 'Required resources available',
      ok: resourceOk,
      metric: departments.length
        ? `${departments.join(' + ')} · no shared team`
        : 'No task allocated',
      pass: 'Available',
      fail: resourceClashes.length
        ? `${resourceClashes[0].department} needed by ${resourceClashes[0].tasks.join(' & ')} concurrently`
        : 'Resource clash',
    },
    {
      key: 'dependencies',
      label: 'Dependencies',
      title: 'Dependencies satisfied',
      ok: dependencyOk,
      metric: `${placedIds.length} task${placedIds.length === 1 ? '' : 's'} · no unmet predecessor`,
      pass: 'Satisfied',
      fail: unmetDependencies.length
        ? `${unmetDependencies[0].task} requires ${unmetDependencies[0].requires}`
        : 'Unmet dependency',
    },
    {
      key: 'isolation',
      label: 'Safety / Isolation',
      title: 'Isolation & disconnection requirements satisfied',
      ok: isolationOk,
      metric: `${plan.placements.length} isolation window${plan.placements.length === 1 ? '' : 's'} · non-overlapping`,
      pass: 'Satisfied',
      fail: isolationClashes.length
        ? `${isolationClashes[0].a} and ${isolationClashes[0].b} demand concurrent isolation`
        : 'Isolation conflict',
    },
    {
      key: 'buffers',
      label: 'Buffers',
      title: 'Safety buffers satisfied',
      ok: bufferOk,
      metric:
        minClearance === null
          ? `Minimum ${MIN_BUFFER_MIN}m required`
          : `${minClearance}m clearance · ${MIN_BUFFER_MIN}m required`,
      pass: 'Satisfied',
      fail: bufferBreaches.length
        ? `${bufferBreaches[0].tasks.join('+')} intrudes ${bufferBreaches[0].minutes}m into ${bufferBreaches[0].movement} buffer`
        : 'Buffer breached',
    },
  ]

  const failed = checks.filter((check) => !check.ok)

  return {
    checks,
    failed,
    passed: failed.length === 0 && plan.placedTasks.length > 0,
    empty: plan.placedTasks.length === 0,
    zones,
    conflicts,
    minClearance,
    /* Human-readable window label for the header. */
    windowLabel: `${toClock(plan.windowStart)} – ${toClock(plan.windowEnd)}`,
  }
}
