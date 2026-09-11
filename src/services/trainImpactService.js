import { request } from './apiClient'

export async function getTrainTimetableImpact(taskId) {
  return {
    data: {
      task_id: taskId,
      window_start: '14:00',
      window_end: '17:30',
      total_delay_minutes: 67,
      affected_trains: [
        { number: '20172', name: 'Vande Bharat Express', type: 'Superfast', schedule: '14:35 - 14:55', impact: 'Slowdown', delay: '+8 min', status: 'Priority Protected' },
        { number: '12002', name: 'Bhopal Shatabdi', type: 'Shatabdi', schedule: '15:10 - 15:30', impact: 'Detour Loop', delay: '+14 min', status: 'Rerouted to Middle Line' },
        { number: 'BOXN-882', name: 'Goods Freight (Coal)', type: 'Freight', schedule: '14:00 - 16:30', impact: 'Regulated', delay: '+45 min', status: 'Held at Nishatpura' }
      ],
      timeline_slots: [
        { time: '14:00', event: 'Block Commences · Signals Set to Danger', state: 'prep' },
        { time: '14:35', event: '20172 Vande Bharat pass on bypass loop (+8m)', state: 'train' },
        { time: '15:10', event: '12002 Shatabdi regulated at outer signal (+14m)', state: 'train' },
        { time: '16:45', event: 'Tamping & ultrasonic weld testing complete', state: 'work' },
        { time: '17:30', event: 'Track Handover & Speed Relaxation to 130 km/h', state: 'clear' }
      ]
    },
    isFallback: true,
    error: null
  }
}
