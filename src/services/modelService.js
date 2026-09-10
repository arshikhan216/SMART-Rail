import { request } from './apiClient'

export async function getModelRegistryMetadata() {
  return {
    data: {
      name: 'SMART-Rail Multi-Engine v2.0.0',
      riskEngine: 'XGBoost Risk Classifier v2.3.1 (AUC 0.94)',
      durationEngine: 'Quantile Gradient Booster v1.8 (MAE 14.2m)',
      optimizer: 'OR-Tools CP-SAT v9.8',
      trainedOn: 'RKMP-BPL Corridor (1,137 assets, 5,098 train movements)',
      lastTrained: '01 Sep 2026',
      calibrationStatus: 'Calibrated (Brier Score 0.042)'
    },
    isFallback: true,
    error: null
  }
}
