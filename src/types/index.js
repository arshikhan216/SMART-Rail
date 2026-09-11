/**
 * Domain types for SMART-Rail Machine Learning & Optimization frontend.
 * Matches backend schemas in src/schemas.py and ML pipeline definitions.
 */

/**
 * @typedef {Object} Asset
 * @property {string} asset_id
 * @property {string} asset_type
 * @property {string} department
 * @property {string} section_id
 * @property {string} location
 * @property {number} condition_score
 * @property {number} traffic_load
 * @property {number} age_years
 * @property {number} criticality
 * @property {string} installation_date
 * @property {string} last_maintenance_date
 */

/**
 * @typedef {Object} ContributingFeature
 * @property {string} factor_name
 * @property {number|string} feature_value
 * @property {number|string} baseline_value
 * @property {number} impact_score
 * @property {string} description
 * @property {'INCREASES_RISK'|'DECREASES_RISK'|'NEUTRAL'} direction
 */

/**
 * @typedef {Object} RiskPrediction
 * @property {string} asset_id
 * @property {number} risk_probability // 0.0 to 1.0
 * @property {number} risk_score // 0 to 100
 * @property {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} risk_level
 * @property {string} prediction_timestamp
 * @property {string} model_name
 * @property {string} model_version
 * @property {ContributingFeature[]} contributing_features
 * @property {string} explanation
 */

/**
 * @typedef {Object} PriorityScore
 * @property {string} task_id
 * @property {number} priority_score // 0 to 100
 * @property {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} priority_level
 * @property {number} risk_component
 * @property {number} criticality_component
 * @property {number} severity_component
 * @property {number} urgency_component
 * @property {number} overdue_boost
 * @property {number} safety_critical_boost
 * @property {string} explanation
 */

/**
 * @typedef {Object} DurationPrediction
 * @property {string} task_id
 * @property {number} predicted_duration_hours
 * @property {number} p50_duration_hours
 * @property {number} p90_duration_hours
 * @property {number} nominal_duration_hours
 * @property {number} uncertainty_range_hours
 * @property {string} model_version
 * @property {boolean} is_ml_predicted
 */

/**
 * @typedef {Object} AssetImpactPrediction
 * @property {string} asset_id
 * @property {string} task_id
 * @property {number} current_availability_pct
 * @property {number} post_maintenance_availability_pct
 * @property {number} availability_gain_pct
 * @property {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} impact_level
 * @property {string} health_trajectory
 */

/**
 * @typedef {Object} AffectedMovement
 * @property {string} movement_id
 * @property {string} train_id
 * @property {string} train_number
 * @property {string} train_type
 * @property {number} priority
 * @property {string} arrival_time
 * @property {string} departure_time
 * @property {number} overlap_minutes
 * @property {number} predicted_delay_minutes
 */

/**
 * @typedef {Object} TrainImpactPrediction
 * @property {string} task_id
 * @property {string} section_id
 * @property {number} affected_movements_count
 * @property {number} total_estimated_delay_minutes
 * @property {'LOW'|'MEDIUM'|'HIGH'|'SEVERE'} impact_level
 * @property {AffectedMovement[]} affected_movements
 * @property {string} computation_method // 'ML_REGRESSION' | 'DETERMINISTIC_CONFLICT'
 * @property {string} model_version
 */

/**
 * @typedef {Object} MaintenanceTask
 * @property {string} task_id
 * @property {string} asset_id
 * @property {string} section_id
 * @property {string} department
 * @property {string} maintenance_type
 * @property {number} duration_hours
 * @property {number} severity
 * @property {number} urgency
 * @property {boolean} is_safety_critical
 * @property {string} deadline
 * @property {number} overdue_days
 * @property {string[]} required_resources
 * @property {string} status
 */

/**
 * @typedef {Object} OptimizationRecommendation
 * @property {string} task_id
 * @property {string} recommended_block_id
 * @property {string} recommended_start_time
 * @property {string} recommended_end_time
 * @property {string} window_type // 'NIGHT_MEGA_BLOCK' | 'MIDDAY_SHADOW_BLOCK'
 * @property {number} duration_hours
 * @property {number} compatibility_score // 0 to 100
 * @property {string[]} justification_reasons
 * @property {string[]} coordinated_tasks
 * @property {number} coordination_savings_hours
 * @property {string} solver_status
 */

export const EMPTY_TYPES = {};
