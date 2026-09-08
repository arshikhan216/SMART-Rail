"""Unit tests for Asset Availability, MTBF/MTTR, and Operational Metrics Engine."""

from datetime import datetime, date, timedelta
import pytest

from src.schemas import (
    Asset,
    MaintenanceTask,
    ScheduleAssignment,
    Department,
    PriorityLevel,
)
from src.evaluation.metrics import (
    AssetAvailabilityMetricsCalculator,
    AssetAvailabilityReport,
)


def _setup_metrics_scenario():
    now = datetime(2026, 9, 8, 10, 0)
    assets = [
        Asset(
            asset_id="AST-01",
            asset_type="TrackSegment",
            department=Department.ENGINEERING,
            section_id="SEC-01",
            location="KM 120/1",
            installation_date=date(2018, 1, 1),
            age_years=8.5,
            condition_score=75.0,
        ),
        Asset(
            asset_id="AST-02",
            asset_type="PointMachine",
            department=Department.S_AND_T,
            section_id="SEC-01",
            location="KM 120/4",
            installation_date=date(2020, 1, 1),
            age_years=6.5,
            condition_score=80.0,
        ),
    ]

    tasks = [
        MaintenanceTask(
            task_id="T-ENG",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=5,
            priority_score=95.0,
            duration_hours=2.5,
            required_workers=4,
            deadline=now + timedelta(hours=48),
            is_safety_critical=True,
        ),
        MaintenanceTask(
            task_id="T-SNT",
            asset_id="AST-02",
            section_id="SEC-01",
            department=Department.S_AND_T,
            maintenance_type="SignalInspection",
            severity=4,
            urgency=4,
            priority_score=80.0,
            duration_hours=1.5,
            required_workers=2,
            deadline=now + timedelta(hours=48),
            is_safety_critical=False,
        ),
    ]

    # Coordinated assignment (2 tasks bundled into a 2.75h block saving 1.25h)
    assignments = [
        ScheduleAssignment(
            assignment_id="ASGN-01",
            block_id="BLK-01",
            task_ids=["T-ENG", "T-SNT"],
            section_id="SEC-01",
            departments=[Department.ENGINEERING, Department.S_AND_T],
            scheduled_start=now + timedelta(hours=2),
            scheduled_end=now + timedelta(hours=4, minutes=45),
            duration_hours=2.75,
            expected_train_impact=5.0,
            coordination_savings_hours=1.25,
        )
    ]

    return assets, tasks, assignments


def test_calculate_availability_metrics_valid():
    assets, tasks, assignments = _setup_metrics_scenario()
    calc = AssetAvailabilityMetricsCalculator()

    report: AssetAvailabilityReport = calc.calculate_metrics(
        assignments=assignments,
        tasks=tasks,
        assets=assets,
        horizon_hours=168.0,
    )

    # 1. Availability assertions
    assert report.corridor_availability_pct >= 95.0
    assert report.inherent_availability_pct >= 95.0
    assert report.mtbf_hours > 0.0
    assert report.mttr_hours > 0.0

    # 2. Efficiency & Schedule assertions
    assert report.bundling_efficiency_pct > 0.0  # Savings / Raw Task Hours (1.25 / 4.0 = 31.25%)
    assert report.on_time_completion_rate_pct == 100.0
    assert report.critical_defect_clearance_rate_pct == 100.0
    assert report.total_scheduled_tasks == 2
    assert report.coordination_savings_hours == 1.25


def test_sectional_and_departmental_breakdowns():
    assets, tasks, assignments = _setup_metrics_scenario()
    calc = AssetAvailabilityMetricsCalculator()

    report: AssetAvailabilityReport = calc.calculate_metrics(
        assignments=assignments,
        tasks=tasks,
        assets=assets,
        horizon_hours=168.0,
    )

    assert "SEC-01" in report.section_metrics
    assert report.section_metrics["SEC-01"].tasks_scheduled == 2
    assert report.section_metrics["SEC-01"].total_possession_hours == 2.75

    assert Department.ENGINEERING in report.department_metrics
    assert Department.S_AND_T in report.department_metrics
    assert report.department_metrics[Department.ENGINEERING].tasks_scheduled == 1
    assert report.department_metrics[Department.S_AND_T].tasks_scheduled == 1
