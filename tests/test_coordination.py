"""Unit tests for Chunk 10: Multi-Department Coordination Engine."""

import datetime as dt
import pytest
from src.coordination.coordinator import MultiDepartmentCoordinator, TaskCoordinationBundle
from src.schemas import MaintenanceTask, Department


@pytest.fixture
def multi_dept_tasks():
    t_eng = MaintenanceTask(
        task_id="TSK-ENG-01",
        asset_id="AST-ENG-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=2.0,
        severity=3,
        urgency=3,
        deadline=dt.datetime(2026, 3, 10),
    )

    t_sig = MaintenanceTask(
        task_id="TSK-SIG-01",
        asset_id="AST-SIG-01",
        section_id="SEC-01",
        department=Department.S_AND_T,
        maintenance_type="SignalTesting",
        duration_hours=1.0,
        severity=3,
        urgency=3,
        deadline=dt.datetime(2026, 3, 10),
    )

    t_trd = MaintenanceTask(
        task_id="TSK-TRD-01",
        asset_id="AST-TRD-01",
        section_id="SEC-01",
        department=Department.TRACTION,
        maintenance_type="OHE_Inspection",
        duration_hours=1.0,
        severity=3,
        urgency=3,
        deadline=dt.datetime(2026, 3, 10),
    )

    return [t_eng, t_sig, t_trd]


def test_three_department_coordination_savings(multi_dept_tasks):
    coordinator = MultiDepartmentCoordinator()

    bundle = coordinator.evaluate_bundle(multi_dept_tasks)

    assert bundle.is_compatible
    assert len(bundle.departments) == 3
    assert bundle.individual_total_duration_hours == 4.0  # 2 + 1 + 1
    # max(2, 1, 1) + 15 min buffer (0.25h) = 2.25h
    assert pytest.approx(bundle.coordinated_duration_hours, rel=1e-2) == 2.25
    assert pytest.approx(bundle.saved_possession_hours, rel=1e-2) == 1.75
    assert "Saved: 1.8h downtime" in bundle.explanation or "Saved: 1.75" in bundle.explanation or "Saved: 1.8" in bundle.explanation or "1.7" in bundle.explanation


def test_mutually_exclusive_work_types():
    coordinator = MultiDepartmentCoordinator()

    t_ballast = MaintenanceTask(
        task_id="TSK-ENG-BCM",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="BallastCleaning",
        duration_hours=3.0,
        deadline=dt.datetime(2026, 3, 10),
    )

    t_signal = MaintenanceTask(
        task_id="TSK-SIG-TEST",
        asset_id="AST-02",
        section_id="SEC-01",
        department=Department.S_AND_T,
        maintenance_type="SignalTesting",
        duration_hours=1.5,
        deadline=dt.datetime(2026, 3, 10),
    )

    ok, reason = coordinator.check_pairwise_compatibility(t_ballast, t_signal)
    assert not ok
    assert "mutually exclusive" in reason.lower()

    bundle = coordinator.evaluate_bundle([t_ballast, t_signal])
    assert not bundle.is_compatible
    assert "mutually exclusive" in bundle.incompatibility_reason.lower()


def test_section_mismatch_coordination(multi_dept_tasks):
    coordinator = MultiDepartmentCoordinator()

    # Move one task to different section
    mismatched_tasks = [
        multi_dept_tasks[0],
        multi_dept_tasks[1].model_copy(update={"section_id": "SEC-02"}),
    ]

    ok, reason = coordinator.check_pairwise_compatibility(mismatched_tasks[0], mismatched_tasks[1])
    assert not ok
    assert "Different sections" in reason


def test_find_all_opportunities(multi_dept_tasks):
    coordinator = MultiDepartmentCoordinator()

    bundles = coordinator.find_all_opportunities(multi_dept_tasks, max_bundle_size=3)
    assert len(bundles) >= 4  # 3 pairs + 1 triplet
    assert all(b.is_compatible for b in bundles)
    assert all(b.saved_possession_hours > 0 for b in bundles)
