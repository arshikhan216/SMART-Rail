"""Performance and Scalability Benchmarking Tests for CP-SAT Block Planning."""

from datetime import datetime, date, timedelta
import time
import pytest

from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    PriorityLevel,
)
from src.block_planner.candidates import CandidateGenerationEngine
from src.block_planner.optimizer import BlockOptimizationSolver
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan


def _create_large_scale_corridor_scenario(num_sections: int = 5, days: int = 7):
    start_date = date(2026, 9, 8)
    base_time = datetime(2026, 9, 8, 0, 0)
    sections = [f"SEC-CORRIDOR-{i:02d}" for i in range(num_sections)]
    depts = [Department.ENGINEERING, Department.S_AND_T, Department.TRACTION]
    work_types = {
        Department.ENGINEERING: "TrackTamping",
        Department.S_AND_T: "SignalInspection",
        Department.TRACTION: "OHEInspection",
    }

    blocks: list[BlockWindow] = []
    tasks: list[MaintenanceTask] = []
    resources: list[Resource] = []

    # 1. Generate resources per department and section
    res_id = 1
    for sec in sections:
        for dept in depts:
            resources.append(
                Resource(
                    resource_id=f"RES-PERF-{res_id:03d}",
                    department=dept,
                    resource_type=ResourceType.CREW,
                    capacity=12,
                    available_from=base_time,
                    available_until=base_time + timedelta(days=days + 2),
                    section_id=sec,
                )
            )
            res_id += 1

    # 2. Generate 2 blocks per day per section
    b_id = 1
    for d in range(days):
        curr_date = start_date + timedelta(days=d)
        for sec in sections:
            # Night slot (02:00 - 05:00)
            st1 = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=2)
            blocks.append(
                BlockWindow(
                    block_id=f"BLK-PERF-{b_id:03d}",
                    section_id=sec,
                    date=curr_date,
                    start_time=st1,
                    end_time=st1 + timedelta(hours=3),
                    available=True,
                )
            )
            b_id += 1
            # Afternoon slot (13:00 - 15:30)
            st2 = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=13)
            blocks.append(
                BlockWindow(
                    block_id=f"BLK-PERF-{b_id:03d}",
                    section_id=sec,
                    date=curr_date,
                    start_time=st2,
                    end_time=st2 + timedelta(hours=2.5),
                    available=True,
                )
            )
            b_id += 1

    # 3. Generate 100+ tasks across sections and departments
    t_id = 1
    for sec in sections:
        for d in range(days):
            curr_date = start_date + timedelta(days=d)
            for dept in depts:
                tasks.append(
                    MaintenanceTask(
                        task_id=f"TSK-PERF-{t_id:04d}",
                        asset_id=f"AST-{sec}-{t_id:03d}",
                        section_id=sec,
                        department=dept,
                        maintenance_type=work_types[dept],
                        severity=4 if t_id % 5 == 0 else 3,
                        urgency=4 if t_id % 5 == 0 else 3,
                        priority_score=85.0 if t_id % 5 == 0 else 65.0,
                        duration_hours=2.0,
                        required_workers=4,
                        deadline=datetime.combine(curr_date + timedelta(days=2), datetime.min.time()),
                        is_safety_critical=(t_id % 5 == 0),
                    )
                )
                t_id += 1

    return start_date, tasks, blocks, resources


def test_large_scale_optimization_performance():
    """Benchmark CP-SAT solver latency on large 100+ task, multi-section corridor network."""
    start_date, tasks, blocks, resources = _create_large_scale_corridor_scenario(num_sections=4, days=7)
    assert len(tasks) >= 80
    assert len(blocks) >= 50

    cand_engine = CandidateGenerationEngine()
    t0 = time.perf_counter()
    candidates, summary = cand_engine.generate_candidates(tasks, blocks, resources)
    cand_time = time.perf_counter() - t0

    assert cand_time < 2.0  # Candidate generation under 2.0s
    assert summary.feasible_pairs_count > 0

    solver = BlockOptimizationSolver()
    t0 = time.perf_counter()
    result = solver.solve(tasks, blocks, resources, candidates)
    solve_time = time.perf_counter() - t0

    assert solve_time < 10.0  # Solve latency under 10.0 seconds
    assert result.status in ("OPTIMAL", "FEASIBLE")
    assert result.tasks_scheduled > 40
    assert result.coordination_savings_hours > 0.0


def test_weekly_engine_performance():
    """Benchmark full 7-day WeeklyPlanningEngine on multi-section scenario."""
    start_date, tasks, blocks, resources = _create_large_scale_corridor_scenario(num_sections=3, days=7)
    planner = WeeklyPlanningEngine()

    t0 = time.perf_counter()
    plan: WeeklyPlan = planner.generate_weekly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        week_start_date=start_date,
        strict_audit=True,
    )
    total_time = time.perf_counter() - t0

    assert total_time < 10.0
    assert plan.total_tasks_scheduled > 20
    assert len(plan.daily_plans) == 7
    assert all(r.is_satisfied for r in plan.audit_records)
