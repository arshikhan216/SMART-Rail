"""Unit tests for Chunk 11: CP-SAT Core Optimization Engine."""

import datetime as dt
import pytest
from src.block_planner.optimizer import BlockOptimizationSolver
from src.block_planner.candidates import CandidateGenerationEngine
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    OptimizationResult,
)


@pytest.fixture
def optimizer_test_context():
    # 2 tasks on SEC-01: one critical track tamping, one routine signal testing
    t_critical = MaintenanceTask(
        task_id="TSK-CRIT-01",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=2.0,
        severity=5,
        urgency=5,
        priority_score=95.0,
        deadline=dt.datetime(2026, 3, 10),
        required_workers=4,
        is_safety_critical=True,
    )

    t_signal = MaintenanceTask(
        task_id="TSK-SIG-01",
        asset_id="AST-02",
        section_id="SEC-01",
        department=Department.S_AND_T,
        maintenance_type="SignalTesting",
        duration_hours=1.0,
        severity=3,
        urgency=3,
        priority_score=60.0,
        deadline=dt.datetime(2026, 3, 10),
        required_workers=2,
    )

    # 1 block on SEC-01 of 3 hours duration
    block = BlockWindow(
        block_id="BLK-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),
        available=True,
    )

    crew_eng = Resource(
        resource_id="RES-ENG",
        department=Department.ENGINEERING,
        resource_type=ResourceType.CREW,
        capacity=6,
        available_from=dt.datetime(2026, 3, 1),
        available_until=dt.datetime(2026, 3, 15),
        section_id="SEC-01",
    )

    crew_sig = Resource(
        resource_id="RES-SIG",
        department=Department.S_AND_T,
        resource_type=ResourceType.CREW,
        capacity=4,
        available_from=dt.datetime(2026, 3, 1),
        available_until=dt.datetime(2026, 3, 15),
        section_id="SEC-01",
    )

    return {
        "tasks": [t_critical, t_signal],
        "blocks": [block],
        "resources": [crew_eng, crew_sig],
    }


def test_cpsat_solver_optimal_coordination(optimizer_test_context):
    tasks = optimizer_test_context["tasks"]
    blocks = optimizer_test_context["blocks"]
    resources = optimizer_test_context["resources"]

    cand_engine = CandidateGenerationEngine()
    candidates, _ = cand_engine.generate_candidates(tasks, blocks, resources)

    solver = BlockOptimizationSolver()
    result = solver.solve(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        feasible_candidates=candidates,
    )

    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.tasks_scheduled == 2
    assert result.critical_tasks_scheduled == 1
    assert result.blocks_used == 1
    assert result.coordination_savings_hours > 0.0
    assert len(result.assignments) == 1
    assert set(result.assignments[0].task_ids) == {"TSK-CRIT-01", "TSK-SIG-01"}


def test_cpsat_solver_respects_duration_limit(optimizer_test_context):
    # Add a 3rd task that exceeds block duration (3h block cannot fit 2h + 2h without coordination)
    t_heavy = MaintenanceTask(
        task_id="TSK-ENG-02",
        asset_id="AST-03",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="RailGrinding",
        duration_hours=2.5,
        severity=4,
        urgency=4,
        priority_score=70.0,
        deadline=dt.datetime(2026, 3, 10),
        required_workers=4,
    )

    tasks = [optimizer_test_context["tasks"][0], t_heavy]  # 2.0h + 2.5h = 4.5h > 3.0h block
    blocks = optimizer_test_context["blocks"]
    resources = optimizer_test_context["resources"]

    cand_engine = CandidateGenerationEngine()
    candidates, _ = cand_engine.generate_candidates(tasks, blocks, resources)

    solver = BlockOptimizationSolver()
    result = solver.solve(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        feasible_candidates=candidates,
    )

    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.tasks_scheduled == 1  # Can only schedule one
    # Must schedule the critical task over the lower priority one
    assert result.assignments[0].task_ids == ["TSK-CRIT-01"]
    assert "TSK-ENG-02" in result.unassigned_tasks
