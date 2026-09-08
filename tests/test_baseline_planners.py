"""Unit tests for Baseline Comparison Planners (FCFS, Greedy Priority, CP-SAT Benchmark)."""

from datetime import datetime, date, timedelta
import pytest

from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    PriorityLevel,
)
from src.evaluation.baseline import (
    FCFSPlanner,
    GreedyPriorityPlanner,
    BaselineComparator,
    BenchmarkReport,
    BaselinePlannerType,
)


def _setup_benchmark_scenario():
    now = datetime(2026, 9, 8, 10, 0)
    blocks = [
        BlockWindow(
            block_id="BLK-01",
            section_id="SEC-01",
            date=now.date(),
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=6),
            available=True,
        ),
        BlockWindow(
            block_id="BLK-02",
            section_id="SEC-01",
            date=now.date(),
            start_time=now + timedelta(hours=8),
            end_time=now + timedelta(hours=11),
            available=True,
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
            duration_hours=2.0,
            required_workers=4,
            deadline=now + timedelta(hours=24),
            is_safety_critical=True,
        ),
        MaintenanceTask(
            task_id="T-SNT",
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
            task_id="T-TRC",
            asset_id="AST-03",
            section_id="SEC-01",
            department=Department.TRACTION,
            maintenance_type="OHEInspection",
            severity=4,
            urgency=4,
            priority_score=85.0,
            duration_hours=1.5,
            required_workers=3,
            deadline=now + timedelta(hours=24),
            is_safety_critical=False,
        ),
    ]

    resources = [
        Resource(
            resource_id="RES-01",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        ),
        Resource(
            resource_id="RES-02",
            department=Department.S_AND_T,
            resource_type=ResourceType.CREW,
            capacity=6,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        ),
        Resource(
            resource_id="RES-03",
            department=Department.TRACTION,
            resource_type=ResourceType.CREW,
            capacity=6,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        ),
    ]

    return tasks, blocks, resources


def test_fcfs_planner_execution():
    tasks, blocks, resources = _setup_benchmark_scenario()
    fcfs = FCFSPlanner()
    res = fcfs.solve(tasks, blocks, resources)

    assert res.status == "FEASIBLE"
    assert res.tasks_scheduled > 0
    assert len(res.assignments) > 0


def test_greedy_priority_planner_execution():
    tasks, blocks, resources = _setup_benchmark_scenario()
    greedy = GreedyPriorityPlanner()
    res = greedy.solve(tasks, blocks, resources)

    assert res.status == "FEASIBLE"
    assert res.tasks_scheduled > 0
    assert res.critical_tasks_scheduled >= 1


def test_baseline_comparator_end_to_end():
    tasks, blocks, resources = _setup_benchmark_scenario()
    comparator = BaselineComparator()

    report: BenchmarkReport = comparator.compare(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        dataset_name="Test-Corridor-Bench",
    )

    assert report.dataset_name == "Test-Corridor-Bench"
    assert len(report.records) == 3

    planner_types = [r.planner_type for r in report.records]
    assert BaselinePlannerType.FCFS in planner_types
    assert BaselinePlannerType.GREEDY_PRIORITY in planner_types
    assert BaselinePlannerType.CP_SAT_OPTIMAL in planner_types

    cpsat_rec = next(r for r in report.records if r.planner_type == BaselinePlannerType.CP_SAT_OPTIMAL)
    assert cpsat_rec.tasks_scheduled == 3
    assert cpsat_rec.critical_tasks_scheduled >= 1
    assert cpsat_rec.coordination_savings_hours > 0.0
    assert cpsat_rec.solve_time_seconds >= 0.0
