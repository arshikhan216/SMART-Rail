import { request } from './apiClient'
import { mockTasks } from '../data/mockIntelligenceData'

export async function getDurationForecast(taskId) {
  const task = mockTasks.find(t => t.id === taskId) || mockTasks[0]

  const payload = {
    task_id: taskId,
    work_type: task.work_type || 'WELD_REPAIR',
    crew_size: 6,
    nominal_minutes: task.duration_p50 || 210,
    weather_condition: 'RAIN_LIGHT',
    track_possession_km: 1.6
  }

  const res = await request('/api/v1/duration/predict', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!res.isFallback && res.data) {
    return { data: res.data, isFallback: false, error: null }
  }

  return {
    data: {
      task_id: taskId,
      nominal_minutes: 180,
      p10_minutes: 165,
      p50_minutes: task.duration_p50 || 210,
      p90_minutes: 255,
      weather_variance: '+15 min (Rainfall factor)',
      crew_variance: '-10 min (Senior Squad)',
      model_version: 'QuantileBoost-v1.8'
    },
    isFallback: true,
    error: res.error
  }
}
