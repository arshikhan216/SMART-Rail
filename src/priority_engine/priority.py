"""Transparent, configurable Maintenance Priority Engine."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

from src.config import CONFIG, PriorityWeightsConfig
from src.schemas import MaintenanceTask, PriorityLevel, Department, Asset

logger = logging.getLogger(__name__)


class PriorityBreakdown(BaseModel):
    """Granular component breakdown of the calculated priority score."""
    task_id: str
    priority_score: float
    priority_level: PriorityLevel
    risk_component: float
    criticality_component: float
    severity_component: float
    urgency_component: float
    overdue_boost: float
    safety_critical_boost: float
    explanation: str


class MaintenancePriorityEngine:
    """Calculates transparent 0-100 priority scores combining ML risk and operational constraints."""

    def __init__(self, weights: Optional[PriorityWeightsConfig] = None):
        self.weights = weights or CONFIG.priority_weights
        self._validate_weights()

    def _validate_weights(self):
        total = self.weights.risk + self.weights.criticality + self.weights.severity + self.weights.urgency
        if not np.isclose(total, 1.0, atol=1e-3):
            logger.warning(f"Priority weights sum to {total:.4f} (expected 1.0). Normalizing...")
            self.weights.risk /= total
            self.weights.criticality /= total
            self.weights.severity /= total
            self.weights.urgency /= total

    def calculate_priority(
        self,
        task: Union[MaintenanceTask, Dict[str, Any]],
        risk_probability: float = 0.5,
        asset_criticality: int = 3,
        overdue_days: int = 0,
        reference_time: Optional[dt.datetime] = None,
    ) -> PriorityBreakdown:
        """Compute transparent priority score and tier classification for a single task."""
        if reference_time is None:
            reference_time = dt.datetime(2026, 3, 1, 0, 0)

        # Extract values
        if isinstance(task, MaintenanceTask):
            task_id = task.task_id
            severity = task.severity
            urgency = task.urgency
            deadline = task.deadline
            is_safety_critical = task.is_safety_critical
        else:
            task_id = str(task.get("task_id", "UNKNOWN"))
            severity = int(task.get("severity", 3))
            urgency = int(task.get("urgency", 3))
            raw_deadline = task.get("deadline", reference_time + dt.timedelta(days=7))
            deadline = pd.to_datetime(raw_deadline).to_pydatetime()
            is_safety_critical = bool(task.get("is_safety_critical", urgency >= 5))

        # 1. Core weighted components (each on 0 to 100 scale)
        risk_term = float(np.clip(risk_probability, 0.0, 1.0)) * 100.0
        criticality_term = (float(np.clip(asset_criticality, 1, 5)) / 5.0) * 100.0
        severity_term = (float(np.clip(severity, 1, 5)) / 5.0) * 100.0
        urgency_term = (float(np.clip(urgency, 1, 5)) / 5.0) * 100.0

        weighted_base = (
            self.weights.risk * risk_term
            + self.weights.criticality * criticality_term
            + self.weights.severity * severity_term
            + self.weights.urgency * urgency_term
        )

        # 2. Overdue penalty acceleration (+1.5 pts per overdue day, capped at +15)
        overdue_boost = min(15.0, max(0, overdue_days) * 1.5)

        # 3. Deadline proximity boost (tasks due within 48h receive up to +10 pts)
        hours_to_deadline = (deadline - reference_time).total_seconds() / 3600.0
        if hours_to_deadline <= 24.0:
            deadline_boost = 10.0
        elif hours_to_deadline <= 48.0:
            deadline_boost = 5.0
        else:
            deadline_boost = 0.0

        # 4. Safety Critical Guarantee
        safety_critical_boost = 15.0 if is_safety_critical else 0.0

        # Combine and clip to [0, 100]
        final_score = weighted_base + overdue_boost + deadline_boost + safety_critical_boost
        if is_safety_critical:
            final_score = max(final_score, 85.0)  # Hard floor for safety critical tasks
        final_score = round(float(np.clip(final_score, 0.0, 100.0)), 2)

        # Classify tier
        level = self.classify_priority_level(final_score)

        explanation = (
            f"Priority Score {final_score:.1f} ({level.value}) = "
            f"Risk: {risk_term * self.weights.risk:.1f} + "
            f"Criticality: {criticality_term * self.weights.criticality:.1f} + "
            f"Severity: {severity_term * self.weights.severity:.1f} + "
            f"Urgency: {urgency_term * self.weights.urgency:.1f}"
        )
        if overdue_boost > 0:
            explanation += f" + OverdueBoost: {overdue_boost:.1f}"
        if safety_critical_boost > 0:
            explanation += f" + SafetyCriticalBoost: {safety_critical_boost:.1f}"

        return PriorityBreakdown(
            task_id=task_id,
            priority_score=final_score,
            priority_level=level,
            risk_component=round(risk_term * self.weights.risk, 2),
            criticality_component=round(criticality_term * self.weights.criticality, 2),
            severity_component=round(severity_term * self.weights.severity, 2),
            urgency_component=round(urgency_term * self.weights.urgency, 2),
            overdue_boost=round(overdue_boost, 2),
            safety_critical_boost=round(safety_critical_boost, 2),
            explanation=explanation,
        )

    @staticmethod
    def classify_priority_level(score: float) -> PriorityLevel:
        """Map 0-100 score to discrete operational priority tier."""
        if score >= 85.0:
            return PriorityLevel.CRITICAL
        elif score >= 70.0:
            return PriorityLevel.VERY_HIGH
        elif score >= 50.0:
            return PriorityLevel.HIGH
        elif score >= 25.0:
            return PriorityLevel.MODERATE
        else:
            return PriorityLevel.LOW

    def prioritize_tasks(
        self,
        tasks: List[MaintenanceTask],
        assets_lookup: Dict[str, Asset],
        risk_scores: Optional[Dict[str, float]] = None,
        reference_time: Optional[dt.datetime] = None,
    ) -> List[MaintenanceTask]:
        """Enrich a list of MaintenanceTask models with priority_score and risk_score."""
        risk_scores = risk_scores or {}
        enriched_tasks: List[MaintenanceTask] = []

        for task in tasks:
            asset = assets_lookup.get(task.asset_id)
            crit = asset.criticality if asset else 3
            r_prob = risk_scores.get(task.asset_id, 0.5)

            breakdown = self.calculate_priority(
                task=task,
                risk_probability=r_prob,
                asset_criticality=crit,
                overdue_days=0,
                reference_time=reference_time,
            )

            # Create updated task copy
            updated_task = task.model_copy(update={
                "priority_score": breakdown.priority_score,
                "risk_score": round(r_prob, 4),
            })
            enriched_tasks.append(updated_task)

        # Sort tasks descending by priority score
        enriched_tasks.sort(key=lambda t: t.priority_score or 0.0, reverse=True)
        return enriched_tasks

    def prioritize_dataframe(
        self,
        df_tasks: pd.DataFrame,
        df_assets: pd.DataFrame,
        df_defects: Optional[pd.DataFrame] = None,
        risk_scores: Optional[Dict[str, float]] = None,
        reference_time: Optional[dt.datetime] = None,
    ) -> pd.DataFrame:
        """Enrich tasks DataFrame with priority scores, priority levels, and breakdowns."""
        risk_scores = risk_scores or {}
        df = df_tasks.copy()

        asset_map = df_assets.set_index("asset_id").to_dict(orient="index") if not df_assets.empty else {}
        overdue_map = {}
        if df_defects is not None and not df_defects.empty:
            overdue_map = df_defects.groupby("asset_id")["overdue_days"].sum().to_dict()

        priority_scores = []
        priority_levels = []
        explanations = []

        for _, row in df.iterrows():
            asset_id = str(row["asset_id"])
            asset_info = asset_map.get(asset_id, {})
            crit = int(asset_info.get("criticality", 3))
            overdue = int(overdue_map.get(asset_id, row.get("overdue_days", 0)))
            r_prob = float(risk_scores.get(asset_id, row.get("risk_score", 0.5)))

            breakdown = self.calculate_priority(
                task=row.to_dict(),
                risk_probability=r_prob,
                asset_criticality=crit,
                overdue_days=overdue,
                reference_time=reference_time,
            )

            priority_scores.append(breakdown.priority_score)
            priority_levels.append(breakdown.priority_level.value)
            explanations.append(breakdown.explanation)

        df["priority_score"] = priority_scores
        df["priority_level"] = priority_levels
        df["priority_explanation"] = explanations

        return df.sort_values(by="priority_score", ascending=False)
