import { request } from './apiClient'
import { mockAssets, mockTasks } from '../data/mockIntelligenceData'

export async function getAssetAvailabilityImpact(taskId) {
  const task = mockTasks.find(t => t.id === taskId) || mockTasks[0]
  const asset = mockAssets.find(a => a.id === task.asset_id) || mockAssets[0]

  return {
    data: {
      task_id: taskId,
      asset_id: asset.id,
      current_health: asset.health_score || 48,
      projected_health: 94,
      availability_gain: '+34%',
      failure_probability_drop: '-78%',
      speed_restoration: 'Restores 130 km/h sectional speed',
      health_trajectory: `Restores asset condition from ${asset.health_score}% degraded to 94% nominal state (+34% availability gain).`
    },
    isFallback: true,
    error: null
  }
}
