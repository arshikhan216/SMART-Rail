"""Unit tests for the Explainable Optimization Reporting Engine."""

from datetime import datetime, date, timedelta
import pytest

from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    CandidateAssignment,
)
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan
from src.evaluation.report import (
    OptimizationReportGenerator,
    ExplainableScheduleReport,
    BlockExplanation,
    TaskExplanation,
)
from src.evaluation.metrics import AssetAvailabilityReport


def test_generate_explainable_report_scheduled_and_deferred():
    now = datetime(2026, 9, 8, 10, 0)
    start_date = now.date()

    # 1. Blocks: 1 block of 3h
    blocks = [
        BlockWindow(
            block_id="BLK-01",
            section_id="SEC-01",
            date=start_date,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=5),
            duration_hours=3.0,
            available=True,
        )
    ]

    # 2. Resources
    resources = [
        Resource(
            resource_id="RES-ENG",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        ),
        Resource(
            resource_id="RES-SNT",
            department=Department.S_AND_T,
            resource_type=ResourceType.CREW,
            capacity=6,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        ),
    ]

    # 3. Tasks: 2 schedulable + 1 unserviceable (needs 5h on 3h block)
    tasks = [
        MaintenanceTask(
            task_id="T-ENG-01",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=5,
            priority_score=95.0,
            duration_hours=2.0,
            required_workers=4,
            deadline=now + timedelta(hours=24),
            is_safety_critical=True,
        ),
        MaintenanceTask(
            task_id="T-SNT-01",
            asset_id="AST-02",
            section_id="SEC-01",
            department=Department.S_AND_T,
            maintenance_type="SignalInspection",
            severity=3,
            urgency=3,
            priority_score=75.0,
            duration_hours=1.5,
            required_workers=2,
            deadline=now + timedelta(hours=24),
            is_safety_critical=False,
        ),
        MaintenanceTask(
            task_id="T-ENG-OVERSIZE",
            asset_id="AST-03",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackRelaying",
            severity=2,
            urgency=2,
            priority_score=40.0,
            duration_hours=5.0,  # Cannot fit into 3.0h block
            required_workers=8,
            deadline=now + timedelta(hours=24),
            is_safety_critical=False,
        ),
    ]

    planner = WeeklyPlanningEngine()
    plan: WeeklyPlan = planner.generate_weekly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        week_start_date=start_date,
        plan_id="TEST-EXPLAIN-PLAN",
    )

    generator = OptimizationReportGenerator()
    report: ExplainableScheduleReport = generator.generate_report(
        plan=plan,
        tasks=tasks,
        blocks=blocks,
    )

    assert report.plan_id == "TEST-EXPLAIN-PLAN"
    assert "Plan [TEST-EXPLAIN-PLAN]" in report.executive_summary
    assert report.tasks_scheduled_count == 2
    assert report.tasks_deferred_count == 1

    # Check block explanations
    assert len(report.block_explanations) == 1
    blk_exp = report.block_explanations[0]
    assert blk_exp.block_id == "BLK-01"
    assert "T-ENG-01" in blk_exp.tasks_bundled
    assert "T-SNT-01" in blk_exp.tasks_bundled
    assert blk_exp.hours_saved > 0.0
    assert "Bundled 2 multi-departmental tasks" in blk_exp.narrative

    # Check task explanations
    assert len(report.task_explanations) == 3
    t_over = next(te for te in report.task_explanations if te.task_id == "T-ENG-OVERSIZE")
    assert not t_over.is_scheduled
    assert len(t_over.reasons) > 0
    assert "T-ENG-OVERSIZE" in report.unassigned_diagnostics
