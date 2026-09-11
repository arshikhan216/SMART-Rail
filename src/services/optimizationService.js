import { request } from './apiClient'

export async function getOptimizationRecommendations(taskId) {
  return {
    data: {
      task_id: taskId,
      recommended_window: {
        date: 'Tomorrow, 10 Sep 2026',
        time: '14:00 - 17:30 IST',
        duration: '210 Minutes (P50)',
        trackSection: 'RKMP-BPL Up Main (Km 824.2 - 825.8)',
        confidence: '96% Feasibility'
      },
      benefits: [
        "Reduces passenger train delay by 41.7% compared to manual baseline",
        "Enables joint bundling with TRD OHE inspection (TSK-2024-003)",
        "Maintains 45-minute safety clearance before Vande Bharat Express transit"
      ],
      baseline_metrics: [
        { name: 'Total Corridor Delay', manual: '115 minutes', ai: '67 minutes', diff: '-41.7%' },
        { name: 'Block Window Utilization', manual: '68% efficiency', ai: '91% efficiency', diff: '+23.0%' },
        { name: 'Secondary Cascading Delay', manual: '4 Trains Held', ai: '1 Train Regulated', diff: '-75.0%' },
        { name: 'Joint Maintenance Synergy', manual: '0 Bundled (Separate blocks)', ai: '2 Tasks Bundled', diff: '1 Block Saved' }
      ],
      bundled_tasks: [
        { id: 'TSK-2024-001', dept: 'Civil Track (P-Way)', title: 'Ultrasonic Rail Weld Repair', duration: '210m' },
        { id: 'TSK-2024-003', dept: 'Traction Distribution (TRD)', title: 'Cantilever Insulator De-glazing', duration: '90m' },
        { id: 'TSK-2024-005', dept: 'Signal & Telecom (S&T)', title: 'Point Machine Detection Check', duration: '45m' }
      ],
      synergy_savings: {
        blocksSaved: 1,
        overheadSavedMinutes: 75,
        hoursSaved: 1.5,
        coordinationScore: '94% Synergy'
      }
    },
    isFallback: true,
    error: null
  }
}

/**
 * Multi-department coordination evaluation calling /api/v1/coordination/evaluate
 */
export async function evaluateCoordination(tasks) {
  const payload = {
    tasks: tasks || []
  }

  const res = await request('/api/v1/coordination/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!res.isFallback && res.data) {
    return {
      data: res.data,
      isFallback: false,
      error: null
    }
  }

  return {
    data: {
      bundle_id: 'BUN-2026-COORDINATED',
      tasks_bundled: (tasks && tasks.length) || 3,
      departments_involved: ['ENGINEERING', 'TRD', 'SIGNALING'],
      is_compatible: true,
      individual_duration_minutes: 345,
      coordinated_duration_minutes: 210,
      possession_time_saved_minutes: 135,
      possession_hours_saved: 2.25,
      coordination_efficiency: 0.94,
      safety_rules_passed: [
        'Single possession shadow closure',
        'OHE power isolation synchronized with track possession',
        'Signal aspect lock synchronized'
      ]
    },
    isFallback: true,
    error: res.error
  }
}

/**
 * Dynamic Replanning calling /api/v1/plan/replan
 */
export async function executeDynamicReplan(disruptionType, details = {}) {
  const payload = {
    event: {
      event_id: `EVT-${Date.now()}`,
      event_type: disruptionType || 'OVERRUN',
      affected_block_ids: ['BLK-2026-001'],
      affected_task_ids: ['TSK-2024-001'],
      timestamp: new Date().toISOString(),
      duration_minutes_delta: details.deltaMinutes || 45,
      notes: details.notes || 'Tamping unit hydraulic seal replacement'
    },
    current_plan: {
      plan_id: 'PLAN-CURRENT-01',
      total_tasks_scheduled: 18,
      corridor_availability: 0.92
    },
    all_tasks: [],
    all_blocks: [],
    all_resources: []
  }

  const res = await request('/api/v1/plan/replan', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!res.isFallback && res.data) {
    return {
      data: res.data,
      isFallback: false,
      error: null
    }
  }

  return {
    data: {
      replan_id: `REPLAN-${Date.now()}`,
      disruption_type: disruptionType,
      status: 'SUCCESS',
      impact_summary: {
        tasks_preserved: 16,
        tasks_rescheduled: 2,
        passenger_trains_regulated: 1,
        max_passenger_delay_minutes: 8,
        corridor_availability_delta: '-1.4%'
      },
      reassigned_slots: [
        {
          task_id: 'TSK-2024-001',
          title: 'Ultrasonic Rail Weld Repair',
          original_slot: '14:00 - 17:30 IST',
          revised_slot: '14:00 - 18:15 IST (+45m overrun accommodated)',
          status: 'EXTENDED'
        },
        {
          task_id: 'TSK-2024-004',
          title: 'Track Ballast Tamping',
          original_slot: '17:45 - 19:15 IST',
          revised_slot: 'Shifted to Night Window 01:15 - 02:45 IST',
          status: 'RESCHEDULED'
        }
      ],
      safety_invariants: {
        duration_bounds: 'PASSED',
        spatial_non_clash: 'PASSED',
        resource_limits: 'PASSED',
        critical_defect_coverage: 'PASSED'
      }
    },
    isFallback: true,
    error: res.error
  }
}

/**
 * Benchmark comparisons vs FCFS and Greedy baselines
 */
export async function getBenchmarkReport() {
  const res = await request('/api/v1/evaluation/benchmark', {
    method: 'POST',
    body: JSON.stringify({
      tasks: [],
      blocks: [],
      resources: [],
      dataset_name: 'RKMP-BPL-Live-Benchmark'
    })
  })

  if (!res.isFallback && res.data) {
    return {
      data: res.data,
      isFallback: false,
      error: null
    }
  }

  return {
    data: {
      dataset: 'RKMP-BPL Corridor (5,098 train movements)',
      comparisons: [
        {
          method: 'SMART-Rail (CP-SAT Multi-Dept)',
          tasks_scheduled_pct: 98.4,
          total_delay_minutes: 67,
          block_utilization_pct: 91.2,
          joint_bundling_pct: 94.0,
          passenger_punctuality_pct: 98.6
        },
        {
          method: 'Greedy Priority Planner',
          tasks_scheduled_pct: 86.2,
          total_delay_minutes: 98,
          block_utilization_pct: 76.5,
          joint_bundling_pct: 42.0,
          passenger_punctuality_pct: 93.1
        },
        {
          method: 'First-Come First-Served (Manual Baseline)',
          tasks_scheduled_pct: 74.0,
          total_delay_minutes: 115,
          block_utilization_pct: 68.0,
          joint_bundling_pct: 12.0,
          passenger_punctuality_pct: 88.4
        }
      ],
      gains: {
        delay_reduction: '41.7% delay reduction vs FCFS',
        utilization_gain: '+23.2% corridor utilization',
        coordination_gain: '82% improvement in joint department bundling'
      }
    },
    isFallback: true,
    error: res.error
  }
}

