"""Unit tests for Chunk 6: Maintenance Priority Engine."""

import datetime as dt
import pytest
import pandas as pd

from src.config import PriorityWeightsConfig
from src.priority_engine.priority import MaintenancePriorityEngine, PriorityBreakdown
from src.schemas import MaintenanceTask, PriorityLevel, Department, Asset


def test_priority_score_calculation_components():
    weights = PriorityWeightsConfig(risk=0.40, criticality=0.25, severity=0.20, urgency=0.15)
    engine = MaintenancePriorityEngine(weights=weights)

    task = {
        "task_id": "TSK-001",
        "severity": 4,  # 80/100
        "urgency": 3,   # 60/100
        "is_safety_critical": False,
    }

    # risk = 0.8 (80/100), crit = 4 (80/100)
    # base = 0.40*80 + 0.25*80 + 0.20*80 + 0.15*60 = 32 + 20 + 16 + 9 = 77.0
    breakdown = engine.calculate_priority(
        task=task,
        risk_probability=0.80,
        asset_criticality=4,
        overdue_days=0,
    )

    assert isinstance(breakdown, PriorityBreakdown)
    assert pytest.approx(breakdown.priority_score, rel=1e-2) == 77.0
    assert breakdown.priority_level == PriorityLevel.VERY_HIGH


def test_safety_critical_floor():
    engine = MaintenancePriorityEngine()

    task = {
        "task_id": "TSK-SAFETY-01",
        "severity": 5,
        "urgency": 5,
        "is_safety_critical": True,
    }

    breakdown = engine.calculate_priority(
        task=task,
        risk_probability=0.20,  # Low risk ML score
        asset_criticality=2,
    )

    # Safety critical must floor at 85.0 (CRITICAL tier)
    assert breakdown.priority_score >= 85.0
    assert breakdown.priority_level == PriorityLevel.CRITICAL


def test_overdue_days_boosting():
    engine = MaintenancePriorityEngine()

    task = {"task_id": "TSK-OVERDUE", "severity": 3, "urgency": 3, "is_safety_critical": False}
    
    score_normal = engine.calculate_priority(task, risk_probability=0.5, asset_criticality=3, overdue_days=0).priority_score
    score_overdue = engine.calculate_priority(task, risk_probability=0.5, asset_criticality=3, overdue_days=8).priority_score

    assert score_overdue > score_normal
    assert pytest.approx(score_overdue - score_normal, rel=1e-2) == 12.0  # 8 * 1.5 = 12.0 boost


def test_prioritize_task_models_list():
    engine = MaintenancePriorityEngine()

    t1 = MaintenanceTask(
        task_id="TSK-LOW",
        asset_id="AST-1",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="Routine",
        duration_hours=1.5,
        severity=1,
        urgency=1,
        deadline=dt.datetime(2026, 3, 20),
    )
    t2 = MaintenanceTask(
        task_id="TSK-HIGH",
        asset_id="AST-2",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=3.0,
        severity=5,
        urgency=5,
        deadline=dt.datetime(2026, 3, 2),
        is_safety_critical=True,
    )

    assets_lookup = {
        "AST-1": Asset(
            asset_id="AST-1", asset_type="Track", department=Department.ENGINEERING, section_id="SEC-01",
            location="KM-1", criticality=1, installation_date=dt.date(2024, 1, 1), age_years=2.0, condition_score=90.0,
        ),
        "AST-2": Asset(
            asset_id="AST-2", asset_type="Track", department=Department.ENGINEERING, section_id="SEC-01",
            location="KM-2", criticality=5, installation_date=dt.date(2010, 1, 1), age_years=16.0, condition_score=35.0,
        ),
    }

    prioritized = engine.prioritize_tasks(
        tasks=[t1, t2],
        assets_lookup=assets_lookup,
        risk_scores={"AST-1": 0.05, "AST-2": 0.95},
    )

    assert prioritized[0].task_id == "TSK-HIGH"
    assert prioritized[0].priority_score is not None
    assert prioritized[0].priority_score >= 85.0
    assert prioritized[1].task_id == "TSK-LOW"
