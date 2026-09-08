"""Model-independent and feature-attribution risk explanation engine."""

from __future__ import annotations
import logging
from typing import Dict, List, Optional, Any, Union
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from src.schemas import RiskLevel
from src.risk_engine.feature_engineering import (
    AssetRiskFeatureExtractor,
    FEATURE_COLUMNS,
    NUMERICAL_FEATURES,
)

logger = logging.getLogger(__name__)


class FactorAttribution(BaseModel):
    """Detailed breakdown for a single contributing risk factor."""
    factor_name: str
    feature_value: Any
    baseline_value: Any
    impact_score: float
    description: str


class RiskExplanation(BaseModel):
    """Structured explanation of an asset's risk prediction."""
    asset_id: str
    risk_probability: float
    risk_level: str
    top_contributing_factors: List[str]
    detailed_factors: List[FactorAttribution] = Field(default_factory=list)
    summary: str


class RiskExplainer:
    """Explains risk model predictions using model-independent feature delta attribution."""

    # Nominal healthy asset baselines for Indian Railways infrastructure
    BASELINES = {
        "condition_score": 85.0,        # Higher is better
        "age_years": 5.0,              # Lower is better
        "traffic_load": 30.0,          # Lower is better
        "criticality": 3,              # Neutral
        "defect_count": 0,             # Lower is better
        "max_defect_severity": 0,      # Lower is better
        "total_overdue_days": 0,       # Lower is better
        "days_since_maintenance": 60,  # Lower is better
        "historical_failures_count": 0 # Lower is better
    }

    # Weight multipliers for feature risk contribution
    FEATURE_WEIGHTS = {
        "condition_score": 0.30,
        "max_defect_severity": 0.25,
        "total_overdue_days": 0.20,
        "traffic_load": 0.10,
        "age_years": 0.08,
        "days_since_maintenance": 0.05,
        "defect_count": 0.02,
    }

    def explain_asset(
        self,
        asset_record: Union[Dict[str, Any], Any],
        risk_probability: float,
        risk_level: Union[str, RiskLevel],
        top_k: int = 4,
    ) -> RiskExplanation:
        """Generate human-readable explanations and top contributing drivers for an asset."""
        raw_dict = (
            asset_record.model_dump()
            if hasattr(asset_record, "model_dump")
            else (asset_record if isinstance(asset_record, dict) else asset_record.__dict__)
        )
        asset_id = str(raw_dict.get("asset_id", "UNKNOWN"))
        level_str = risk_level.value if isinstance(risk_level, RiskLevel) else str(risk_level)


        detailed_factors: List[FactorAttribution] = []

        # 1. Condition score attribution
        cond = float(raw_dict.get("condition_score", 75.0))
        if cond < self.BASELINES["condition_score"]:
            cond_deficit = self.BASELINES["condition_score"] - cond
            score = cond_deficit * self.FEATURE_WEIGHTS["condition_score"]
            detailed_factors.append(FactorAttribution(
                factor_name="Condition Score",
                feature_value=round(cond, 1),
                baseline_value=self.BASELINES["condition_score"],
                impact_score=round(score, 2),
                description=f"Low condition score of {cond:.1f}/100 ({cond_deficit:.1f} pts below nominal)",
            ))

        # 2. Defect Severity attribution
        max_sev = int(raw_dict.get("max_defect_severity", raw_dict.get("severity", 0)))
        if max_sev >= 3:
            score = (max_sev / 5.0) * 100.0 * self.FEATURE_WEIGHTS["max_defect_severity"]
            sev_labels = {3: "Significant", 4: "Major", 5: "Critical Safety Hazard"}
            detailed_factors.append(FactorAttribution(
                factor_name="Defect Severity",
                feature_value=max_sev,
                baseline_value=0,
                impact_score=round(score, 2),
                description=f"Severe unresolved defect detected (Severity {max_sev}/5 - {sev_labels.get(max_sev, '')})",
            ))

        # 3. Overdue days attribution
        overdue = int(raw_dict.get("total_overdue_days", raw_dict.get("overdue_days", 0)))
        if overdue > 0:
            score = min(100.0, overdue * 5.0) * self.FEATURE_WEIGHTS["total_overdue_days"]
            detailed_factors.append(FactorAttribution(
                factor_name="Overdue Maintenance",
                feature_value=overdue,
                baseline_value=0,
                impact_score=round(score, 2),
                description=f"Maintenance is overdue by {overdue} days past mandated safety window",
            ))

        # 4. Traffic Load attribution
        traffic = float(raw_dict.get("traffic_load", 30.0))
        if traffic > self.BASELINES["traffic_load"]:
            excess_traffic = traffic - self.BASELINES["traffic_load"]
            score = min(100.0, excess_traffic * 1.5) * self.FEATURE_WEIGHTS["traffic_load"]
            detailed_factors.append(FactorAttribution(
                factor_name="Traffic Load",
                feature_value=round(traffic, 1),
                baseline_value=self.BASELINES["traffic_load"],
                impact_score=round(score, 2),
                description=f"High corridor traffic load of {traffic:.1f} GMT causing accelerated asset wear",
            ))

        # 5. Asset Age attribution
        age = float(raw_dict.get("age_years", 5.0))
        if age > 15.0:
            score = min(100.0, (age - 15.0) * 4.0) * self.FEATURE_WEIGHTS["age_years"]
            detailed_factors.append(FactorAttribution(

                factor_name="Asset Age",
                feature_value=round(age, 1),
                baseline_value=self.BASELINES["age_years"],
                impact_score=round(score, 2),
                description=f"Aging asset ({age:.1f} years in service) exceeding typical mid-life overhaul",
            ))

        # 6. Days since maintenance
        days_since = int(raw_dict.get("days_since_maintenance", 60))

        if days_since > 120:
            score = min(100.0, (days_since - 120) * 0.5) * self.FEATURE_WEIGHTS["days_since_maintenance"]
            detailed_factors.append(FactorAttribution(
                factor_name="Maintenance Interval",
                feature_value=days_since,
                baseline_value=self.BASELINES["days_since_maintenance"],
                impact_score=round(score, 2),
                description=f"{days_since} days elapsed since last scheduled possession",
            ))

        # Sort factors by impact score descending
        detailed_factors.sort(key=lambda x: x.impact_score, reverse=True)
        top_factors = [f.description for f in detailed_factors[:top_k]]

        if not top_factors:
            if risk_probability < 0.25:
                top_factors = ["Asset parameters within nominal baseline limits with no active high-severity defects."]
            else:
                top_factors = ["Moderate cumulative wear across aging and operational traffic parameters."]

        summary = (
            f"Asset {asset_id} has a {level_str} risk rating ({risk_probability:.1%}). "
            f"Primary risk driver: {top_factors[0]}"
        )

        return RiskExplanation(
            asset_id=asset_id,
            risk_probability=round(risk_probability, 4),
            risk_level=level_str,
            top_contributing_factors=top_factors,
            detailed_factors=detailed_factors[:top_k],
            summary=summary,
        )
