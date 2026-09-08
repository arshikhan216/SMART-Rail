"""Unit tests for Chunk 9: Block Candidate Generation Engine."""

import datetime as dt
import pytest
from src.block_planner.candidates import CandidateGenerationEngine, CandidateSummary
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    CandidateAssignment,
)
from src.train_impact.conflict_detector import TrainConflictReport


@pytest.fixture
def sample_planning_context():
    task_feasible = MaintenanceTask(
        task_id="TSK-01",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=2.0,
        severity=3,
        urgency=3,
        deadline=dt.datetime(2026, 3, 10, 18, 0),
        required_workers=4,
        required_machine="DuomaticTampingMachine",
    )

    task_long = MaintenanceTask(
        task_id="TSK-02",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="MajorOverhaul",
        duration_hours=5.0,  # Too long for 3h block
        severity=4,
        urgency=4,
        deadline=dt.datetime(2026, 3, 10, 18, 0),
        required_workers=4,
    )

    task_expired = MaintenanceTask(
        task_id="TSK-03",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="Routine",
        duration_hours=1.5,
        severity=2,
        urgency=2,
        deadline=dt.datetime(2026, 3, 4, 12, 0),  # Prior to block
        required_workers=2,
    )

    block = BlockWindow(
        block_id="BLK-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),  # 3 hours
        available=True,
    )

    block_sec2 = BlockWindow(
        block_id="BLK-02",
        section_id="SEC-02",  # Different section
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),
        available=True,
    )

    crew = Resource(
        resource_id="RES-CREW-ENG",
        department=Department.ENGINEERING,
        resource_type=ResourceType.CREW,
        capacity=8,
        available_from=dt.datetime(2026, 3, 1, 0, 0),
        available_until=dt.datetime(2026, 3, 15, 23, 59),
        section_id="SEC-01",
    )

    machine = Resource(
        resource_id="RES-MACH-DUOMATIC",
        department=Department.ENGINEERING,
        resource_type=ResourceType.MACHINE,
        capacity=1,
        available_from=dt.datetime(2026, 3, 1, 0, 0),
        available_until=dt.datetime(2026, 3, 15, 23, 59),
        section_id="SEC-01",
    )

    return {
        "tasks": [task_feasible, task_long, task_expired],
        "blocks": [block, block_sec2],
        "resources": [crew, machine],
    }


def test_candidate_generation_feasibility_diagnostics(sample_planning_context):
    engine = CandidateGenerationEngine()

    candidates, summary = engine.generate_candidates(
        tasks=sample_planning_context["tasks"],
        blocks=sample_planning_context["blocks"],
        resources=sample_planning_context["resources"],
        include_infeasible=True,
    )

    assert summary.total_pairs_evaluated == 6  # 3 tasks * 2 blocks
    assert summary.feasible_pairs_count == 1   # Only task_feasible on BLK-01
    assert summary.infeasible_pairs_count == 5

    # Check breakdown categories
    assert "SECTION_MISMATCH" in summary.infeasible_reasons_breakdown
    assert "INSUFFICIENT_DURATION" in summary.infeasible_reasons_breakdown
    assert "DEADLINE_BREACH" in summary.infeasible_reasons_breakdown

    # Verify feasible candidate properties
    feasible_cands = [c for c in candidates if c.feasible]
    assert len(feasible_cands) == 1
    assert feasible_cands[0].task_id == "TSK-01"
    assert feasible_cands[0].block_id == "BLK-01"
    assert feasible_cands[0].reason_if_infeasible is None


def test_candidate_generation_missing_machine(sample_planning_context):
    engine = CandidateGenerationEngine()

    # Pass only crew without specialized machine
    candidates, summary = engine.generate_candidates(
        tasks=[sample_planning_context["tasks"][0]],  # TSK-01 needs Duomatic machine
        blocks=[sample_planning_context["blocks"][0]],
        resources=[sample_planning_context["resources"][0]],  # Only crew
        include_infeasible=True,
    )

    assert len(candidates) == 1
    assert not candidates[0].feasible
    assert "Required machine" in candidates[0].reason_if_infeasible
