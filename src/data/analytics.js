/* ==========================================================================
   Analytics — derivation layer

   Everything here is computed from data the prototype already holds:
     · the maintenance register        (smartRail.js → tasks)
     · the block planning candidates   (blockPlanning.js → candidates)
     · the deterministic optimizer     (blockPlanning.js → optimizePlan)
     · the in-flight execution record  (smartRail.js → execution)

   Each figure carries a `source`:
     'derived' — calculated from the above, reproducible
     'demo'    — an illustrative series the prototype has no real data for

   Nothing here is presented as a real railway result.
   ========================================================================== */

import {
  candidates,
  controls,
  defaultSelection,
  optimizePlan,
  parseWindow,
  trainMovements,
} from './blockPlanning.js'
import { blockOpportunities, execution, tasks } from './smartRail.js'
import { departmentOrder } from '../lib/chartTheme.js'

export const PERIODS = [
  'This Planning Cycle',
  'Last 7 Planning Cycles',
  'Last 30 Days',
]

export const DEPARTMENTS = ['All departments', 'Engineering', 'S&T', 'TRD']

/* --- The two plans under comparison ------------------------------------- */

const WINDOW = parseWindow(controls.windows[0])
const ALL_CANDIDATES = candidates.map((task) => task.id)

/** SMART-Rail optimized: joint pairing enabled. */
export const optimized = optimizePlan({
  selectedIds: ALL_CANDIDATES,
  window: WINDOW,
  allowJoint: true,
})

/**
 * Baseline counterfactual: the same optimizer, the same candidates, the same
 * window and the same train movements — with cross-department pairing turned
 * off. That models single-department planning, where each task takes its own
 * possession. It is a stated assumption, not a guess at a number.
 */
export const baseline = optimizePlan({
  selectedIds: ALL_CANDIDATES,
  window: WINDOW,
  allowJoint: false,
})

/**
 * The plan as the planner has it selected right now — the same selection
 * Block Planning and Plan Validation report on. Kept distinct from the
 * full-demand comparison above so the two frames never get conflated.
 */
export const validatedPlan = optimizePlan({
  selectedIds: defaultSelection,
  window: WINDOW,
})

export const planningWindow = {
  ...WINDOW,
  usableMinutes: WINDOW.minutes - optimized.movementMinutes,
  movements: trainMovements.length,
}

const ratio = (work, possession) =>
  possession > 0 ? Number((work / possession).toFixed(2)) : 0

/* --- C. Baseline vs SMART-Rail optimized -------------------------------- */

/**
 * Six planning metrics, all derived. Some show no change — reported as such,
 * because a comparison where everything improves is not credible.
 * `better: 'lower' | 'higher'` states which direction is an improvement.
 */
export const planningComparison = [
  {
    key: 'possession',
    label: 'Track possession required',
    qualifier: 'Minutes of line taken out of service',
    unit: 'm',
    baseline: baseline.possessionMinutes,
    optimized: optimized.possessionMinutes,
    better: 'lower',
    source: 'derived',
  },
  {
    key: 'possessions',
    label: 'Separate possessions',
    qualifier: 'Isolation and de-isolation cycles',
    unit: '',
    baseline: baseline.placements.length,
    optimized: optimized.placements.length,
    better: 'lower',
    source: 'derived',
  },
  {
    key: 'efficiency',
    label: 'Work per possession minute',
    qualifier: 'Task-minutes delivered per minute of possession',
    unit: '×',
    baseline: ratio(baseline.workMinutes, baseline.possessionMinutes),
    optimized: ratio(optimized.workMinutes, optimized.possessionMinutes),
    better: 'higher',
    source: 'derived',
  },
  {
    key: 'slack',
    label: 'Slack buffer preserved',
    qualifier: 'Unused window held against overrun',
    unit: 'm',
    baseline: baseline.slackMinutes,
    optimized: optimized.slackMinutes,
    better: 'higher',
    source: 'derived',
  },
  {
    key: 'joint',
    label: 'Joint opportunities used',
    qualifier: 'Multi-department shared possessions',
    unit: '',
    baseline: baseline.jointCount,
    optimized: optimized.jointCount,
    better: 'higher',
    source: 'derived',
  },
  {
    key: 'carried',
    label: 'Demand carried forward',
    qualifier: 'Candidates with no feasible slot this window',
    unit: '',
    baseline: baseline.conflicts.length,
    optimized: optimized.conflicts.length,
    better: 'lower',
    source: 'derived',
  },
]

/** Task-minutes delivered is identical in both plans — stated explicitly. */
export const workDelivered = {
  baseline: baseline.workMinutes,
  optimized: optimized.workMinutes,
  identical: baseline.workMinutes === optimized.workMinutes,
}

/* --- B. Headline KPIs ---------------------------------------------------- */

const criticalInRegister = tasks.filter(
  (task) => task.priority === 'CRITICAL',
).length

export function headlineKpis() {
  const possessionSaved =
    baseline.possessionMinutes - optimized.possessionMinutes

  return [
    {
      key: 'availability',
      label: 'Corridor Availability',
      value: `${availabilityTrend.series.at(-1).smart.toFixed(1)}%`,
      caption: 'Latest point, 7-cycle horizon',
      trend: {
        direction: 'up',
        text: `+${(
          availabilityTrend.series.at(-1).smart -
          availabilityTrend.series[0].smart
        ).toFixed(1)} pts across horizon`,
      },
      icon: 'TrendingUp',
      source: 'demo',
    },
    {
      key: 'critical',
      label: 'Critical Work Allocated',
      value: `${optimized.criticalPlaced}/${optimized.criticalTotal}`,
      caption: `${criticalInRegister} critical in register`,
      trend: {
        direction: optimized.criticalPlaced === optimized.criticalTotal ? 'up' : 'flat',
        text:
          optimized.criticalPlaced === optimized.criticalTotal
            ? 'All critical candidates placed'
            : 'Critical work outstanding',
      },
      icon: 'TriangleAlert',
      source: 'derived',
    },
    {
      key: 'utilization',
      label: 'Possession Efficiency',
      value: `${ratio(optimized.workMinutes, optimized.possessionMinutes).toFixed(2)}×`,
      caption: `${optimized.workMinutes}m work in ${optimized.possessionMinutes}m possession`,
      trend: {
        direction: 'up',
        text: `${possessionSaved}m possession saved vs baseline`,
      },
      icon: 'Gauge',
      source: 'derived',
    },
    {
      key: 'disruption',
      label: 'Forecast Overrun',
      value: `+${execution.forecast.overrun}m`,
      caption: `${execution.task.id} in execution`,
      trend: {
        direction: 'down',
        text: `${execution.constraint.buffer}m buffer to ${execution.constraint.at} constraint`,
      },
      icon: 'Activity',
      source: 'derived',
    },
    {
      key: 'joint',
      label: 'Joint Opportunities',
      value: `${optimized.jointCount}`,
      caption: `${jointMaintenance.departments.length} departments coordinated`,
      trend: {
        direction: 'up',
        text: `${possessionSaved}m shared possession benefit`,
      },
      icon: 'Network',
      source: 'derived',
    },
  ]
}

/* --- E. Asset availability ---------------------------------------------- */

/* The prototype holds no availability time series, so this is a small
   illustrative one. Labelled as a demo series wherever it is shown. */
export const availabilityTrend = {
  source: 'demo',
  note: 'Illustrative series — the prototype holds no availability history.',
  series: [
    { label: 'C1', baseline: 88.6, smart: 89.3 },
    { label: 'C2', baseline: 88.2, smart: 90.4 },
    { label: 'C3', baseline: 88.9, smart: 91.8 },
    { label: 'C4', baseline: 88.5, smart: 93.1 },
    { label: 'C5', baseline: 88.3, smart: 93.9 },
    { label: 'C6', baseline: 88.7, smart: 94.2 },
    { label: 'C7', baseline: 88.4, smart: 94.6 },
  ],
}

/** Which assets consume maintenance time — derived from the register. */
export function assetLoad(department = DEPARTMENTS[0]) {
  const scoped =
    department === DEPARTMENTS[0]
      ? tasks
      : tasks.filter((task) => task.department === department)

  return scoped
    .map((task) => ({
      id: task.id,
      asset: task.asset,
      department: task.department,
      minutes: task.duration,
      impact: task.impactLevel,
    }))
    .sort((a, b) => b.minutes - a.minutes)
}

/* --- D. Maintenance performance trend ----------------------------------- */

/* No completion history exists in the prototype either. Small demo series,
   shaped to the register's real scale (6 tasks, 2 critical). */
export const maintenanceTrend = {
  source: 'demo',
  note: 'Illustrative series — the register holds no completion history.',
  series: [
    { label: 'C1', planned: 5, completed: 3, critical: 1 },
    { label: 'C2', planned: 6, completed: 4, critical: 1 },
    { label: 'C3', planned: 6, completed: 5, critical: 2 },
    { label: 'C4', planned: 7, completed: 5, critical: 2 },
    { label: 'C5', planned: 6, completed: 5, critical: 2 },
    { label: 'C6', planned: 7, completed: 6, critical: 2 },
    { label: 'C7', planned: 6, completed: 6, critical: 2 },
  ],
}

/* --- Departmental work mix (derived from the register) ------------------- */

export function departmentMix(department = DEPARTMENTS[0]) {
  const scoped =
    department === DEPARTMENTS[0]
      ? tasks
      : tasks.filter((task) => task.department === department)

  const totalMinutes = scoped.reduce((sum, task) => sum + task.duration, 0)
  const byDepartment = new Map()

  scoped.forEach((task) => {
    const current = byDepartment.get(task.department) ?? {
      department: task.department,
      count: 0,
      minutes: 0,
      disciplines: new Set(),
    }
    current.count += 1
    current.minutes += task.duration
    current.disciplines.add(task.discipline)
    byDepartment.set(task.department, current)
  })

  return {
    source: 'derived',
    totalTasks: scoped.length,
    totalMinutes,
    /* Canonical department order so hue assignment never shifts with data. */
    slices: [...byDepartment.values()]
      .sort(
        (a, b) =>
          departmentOrder.indexOf(a.department) -
          departmentOrder.indexOf(b.department),
      )
      .map((entry) => ({
        department: entry.department,
        count: entry.count,
        minutes: entry.minutes,
        share: totalMinutes ? (entry.minutes / totalMinutes) * 100 : 0,
        disciplines: [...entry.disciplines].join(', '),
      })),
  }
}

/* --- F. Block utilization ----------------------------------------------- */

/** Both plans as comparable segment timelines over the same window. */
export const blockUtilization = {
  source: 'derived',
  window: WINDOW,
  windowMinutes: WINDOW.minutes,
  plans: [
    { key: 'baseline', label: 'Baseline (single-department)', plan: baseline },
    { key: 'optimized', label: 'SMART-Rail optimized', plan: optimized },
  ].map(({ key, label, plan }) => ({
    key,
    label,
    possessionMinutes: plan.possessionMinutes,
    movementMinutes: plan.movementMinutes,
    slackMinutes: plan.slackMinutes,
    placements: plan.placements,
    slackGaps: plan.slackGaps,
    movements: plan.movements,
  })),
  /* Windows the register has flagged as available but not yet planned. */
  openOpportunities: blockOpportunities.map((opportunity) => ({
    window: opportunity.window,
    section: opportunity.section,
    minutes: opportunity.minutes,
    compatible: opportunity.compatible,
    risk: opportunity.risk,
  })),
}

/* --- G. Cross-department / joint maintenance ---------------------------- */

const jointPairs = optimized.placements
  .filter((placement) => placement.joint)
  .map((placement) => ({
    tasks: placement.tasks.map((task) => task.id),
    departments: [
      ...new Set(placement.tasks.map((task) => task.department)),
    ],
    envelope: placement.envelope,
    sequential: placement.tasks.reduce((sum, task) => sum + task.minutes, 0),
  }))

export const jointMaintenance = {
  source: 'derived',
  /* One node per department present in the candidate set. */
  departments: [...new Set(candidates.map((task) => task.department))]
    .sort(
      (a, b) => departmentOrder.indexOf(a) - departmentOrder.indexOf(b),
    )
    .map((department) => {
      const owned = candidates.filter((task) => task.department === department)
      return {
        department,
        candidates: owned.length,
        minutes: owned.reduce((sum, task) => sum + task.minutes, 0),
        pairable: owned.filter((task) => task.jointWith).length,
      }
    }),
  identified: candidates.filter((task) => task.jointWith).length / 2,
  used: optimized.jointCount,
  pairs: jointPairs,
  possessionSaved: jointPairs.reduce(
    (sum, pair) => sum + (pair.sequential - pair.envelope),
    0,
  ),
}

/* --- H. Operational impact ---------------------------------------------- */

/* Only what the prototype actually computes. There is no "conflicts avoided"
   figure, so none is claimed. */
export const operationalImpact = {
  source: 'derived',
  metrics: [
    {
      key: 'movements',
      label: 'Train movements in window',
      value: optimized.movements.length,
      detail: optimized.movements
        .map((movement) => `${movement.from}–${movement.to}`)
        .join(' · '),
      tone: 'ink',
    },
    {
      key: 'projected',
      label: 'Projected conflicts in validated plan',
      value: validatedPlan.conflicts.length,
      detail:
        validatedPlan.conflicts.length === 0
          ? `${validatedPlan.placedTasks.length} placements clear of every movement`
          : validatedPlan.conflicts.map((task) => task.id).join(', '),
      tone: validatedPlan.conflicts.length === 0 ? 'nominal' : 'urgent',
    },
    {
      key: 'carried',
      label: 'Demand carried to next window',
      value: optimized.conflicts.length,
      detail: `${optimized.conflicts
        .map((task) => task.id)
        .join(', ')} — no contiguous gap`,
      tone: 'warning',
    },
    {
      key: 'overrun',
      label: 'Forecast overrun in execution',
      value: `+${execution.forecast.overrun}m`,
      detail: `${execution.task.id} · forecast ${execution.forecast.to} against ${execution.planned.to} plan limit`,
      tone: 'warning',
    },
    {
      key: 'buffer',
      label: 'Buffer to next constraint',
      value: `${execution.constraint.buffer}m`,
      detail: `${execution.constraint.at} ${execution.constraint.label}`,
      tone: execution.constraint.buffer <= 2 ? 'urgent' : 'nominal',
    },
    {
      key: 'slack',
      label: 'Slack held in window',
      value: `${optimized.slackMinutes}m`,
      detail: `${optimized.slackGaps.length} gaps preserved against overrun`,
      tone: 'nominal',
    },
  ],
}
