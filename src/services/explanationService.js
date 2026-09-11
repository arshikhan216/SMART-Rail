import { request } from './apiClient'
import { mockTasks } from '../data/mockIntelligenceData'

export async function getRiskExplanation(taskId) {
  const task = mockTasks.find(t => t.id === taskId) || mockTasks[0]

  return {
    data: {
      task_id: taskId,
      confidence: 0.94,
      summary: "Model analysis flags Ultrasonic Flaw Depth (4.8mm) in combination with high axle fatigue (52.4 MGT) as the primary risk accelerator. Without intervention within 14 days, failure probability escalates from 0.78 to 0.93.",
      features: [
        { feature: 'Ultrasonic Flaw Depth', impact: 0.38, direction: 'increases_risk', value: '4.8 mm defect' },
        { feature: 'Track Service Age', impact: 0.24, direction: 'increases_risk', value: '14.2 years' },
        { feature: 'Cumulative Axle Load', impact: 0.19, direction: 'increases_risk', value: '52.4 MGT' },
        { feature: 'Vibration Anomaly Index', impact: 0.12, direction: 'increases_risk', value: '2.4g peak' },
        { feature: 'Recent Surface Tamping', impact: -0.15, direction: 'decreases_risk', value: 'Done 45d ago' },
        { feature: 'Ballast Cushion Depth', impact: -0.08, direction: 'decreases_risk', value: '310 mm' }
      ],
      recommendations: [
        "Schedule ultrasonic rail testing machine (USFD) validation within 7 days",
        "Prepare track renewal clamp & welding squad for 3.5-hour corridor block",
        "Bundle with OHE inspection window on adjacent RKMP-BPL Up-Line"
      ]
    },
    isFallback: true,
    error: null
  }
}
