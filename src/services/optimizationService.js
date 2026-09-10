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
        "Minimizes passenger train delay by 42% compared to morning baseline",
        "Allows joint bundling with TSK-2024-003 OHE insulator cleaning",
        "Provides 45-minute safety cushion before Rajdhani Express transit"
      ],
      baseline_metrics: [
        { name: 'Total Corridor Delay', manual: '115 minutes', ai: '67 minutes', diff: '-41.7%' },
        { name: 'Block Window Utilization', manual: '68% efficiency', ai: '91% efficiency', diff: '+23.0%' },
        { name: 'Secondary Cascading Delay', manual: '4 Trains Held', ai: '1 Train Regulated', diff: '-75.0%' },
        { name: 'Joint Maintenance Synergy', manual: '0 Bundled (Separate blocks)', ai: '2 Tasks Bundled', diff: '1 Block Saved' }
      ],
      bundled_tasks: [
        { id: 'TSK-2024-001', dept: 'Civil Track', title: 'Ultrasonic Rail Weld Repair', duration: '210m' },
        { id: 'TSK-2024-003', dept: 'Electrical OHE', title: 'Cantilever Insulator De-glazing', duration: '90m' }
      ],
      synergy_savings: {
        blocksSaved: 1,
        overheadSavedMinutes: 75,
        coordinationScore: '94% Synergy'
      }
    },
    isFallback: true,
    error: null
  }
}
