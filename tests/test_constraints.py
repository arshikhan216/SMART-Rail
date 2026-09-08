"""Unit tests for the Constraint Classification and Audit Engine."""

from datetime import datetime, timedelta
import pytest

from src.exceptions import InfeasibleScheduleError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    Department,
    ResourceType,
)
from src.block_planner.constraints import (
    ConstraintManager,
    ConstraintType,
    ConstraintCategory,
    ConstraintAuditRecord,
)


def _make_task(
    task_id: str,
    section_id: str = "SEC-01",
    dept: Department = Department.ENGINEERING,
    maint_type: str = "TrackTamping",
    dur: float = 2.0,
    deadline_offset_hours: int = 48,
) -> MaintenanceTask:
    now = datetime(2026, 9, 8, 10, 0)
    return MaintenanceTask(
        task_id=task_id,
        asset_id="AST-001",
        section_id=section_id,
        department=dept,
        maintenance_type=maint_type,
        severity=4,
        urgency=4,
        priority_score=80.0,
        duration_hours=dur,
        required_workers=4,
        required_machine="TampingMachine",
        deadline=now + timedelta(hours=deadline_offset_hours),
    )


def _make_block(
    block_id: str,
    section_id: str = "SEC-01",
    st_hour: int = 12,
    dur: float = 3.0,
    available: bool = True,
) -> BlockWindow:
    st = datetime(2026, 9, 8, st_hour, 0)
    return BlockWindow(
        block_id=block_id,
        section_id=section_id,
        date=st.date(),
        start_time=st,
        end_time=st + timedelta(hours=dur),
        available=available,
    )


def test_constraint_definitions():
    mgr = ConstraintManager()
    assert len(mgr.HARD_CONSTRAINTS) >= 7
    assert len(mgr.SOFT_CONSTRAINTS) >= 4
    for hc in mgr.HARD_CONSTRAINTS:
        assert hc.constraint_type == ConstraintType.HARD
    for sc in mgr.SOFT_CONSTRAINTS:
        assert sc.constraint_type == ConstraintType.SOFT


def test_audit_schedule_valid():
    mgr = ConstraintManager()
    t1 = _make_task("T-1", "SEC-01", Department.ENGINEERING, "TrackTamping", 2.0)
    b1 = _make_block("BLK-1", "SEC-01", 12, 3.0)

    asgn = ScheduleAssignment(
        assignment_id="ASGN-1",
        block_id="BLK-1",
        task_ids=["T-1"],
        section_id="SEC-01",
        departments=[Department.ENGINEERING],
        scheduled_start=b1.start_time,
        scheduled_end=b1.end_time,
        duration_hours=2.0,
    )

    records = mgr.audit_schedule(
        assignments=[asgn],
        tasks_lookup={"T-1": t1},
        blocks_lookup={"BLK-1": b1},
        resources=[],
        strict_fail_on_hard_violation=True,
    )

    assert len(records) >= 4
    assert all(r.is_satisfied for r in records)


def test_audit_schedule_section_mismatch():
    mgr = ConstraintManager()
    t1 = _make_task("T-1", "SEC-02", Department.ENGINEERING, "TrackTamping", 2.0)
    b1 = _make_block("BLK-1", "SEC-01", 12, 3.0)

    asgn = ScheduleAssignment(
        assignment_id="ASGN-1",
        block_id="BLK-1",
        task_ids=["T-1"],
        section_id="SEC-01",
        departments=[Department.ENGINEERING],
        scheduled_start=b1.start_time,
        scheduled_end=b1.end_time,
        duration_hours=2.0,
    )

    # Strict mode should raise InfeasibleScheduleError
    with pytest.raises(InfeasibleScheduleError):
        mgr.audit_schedule(
            assignments=[asgn],
            tasks_lookup={"T-1": t1},
            blocks_lookup={"BLK-1": b1},
            resources=[],
            strict_fail_on_hard_violation=True,
        )

    # Non-strict mode returns audit records with failure
    records = mgr.audit_schedule(
        assignments=[asgn],
        tasks_lookup={"T-1": t1},
        blocks_lookup={"BLK-1": b1},
        resources=[],
        strict_fail_on_hard_violation=False,
    )
    sec_audit = next(r for r in records if r.constraint_name == "SectionIntegrity")
    assert not sec_audit.is_satisfied
    assert sec_audit.violations_count > 0


def test_audit_schedule_duration_overflow():
    mgr = ConstraintManager()
    t1 = _make_task("T-1", "SEC-01", Department.ENGINEERING, "TrackTamping", 4.0)
    b1 = _make_block("BLK-1", "SEC-01", 12, 2.0)  # Block is only 2 hours

    asgn = ScheduleAssignment(
        assignment_id="ASGN-1",
        block_id="BLK-1",
        task_ids=["T-1"],
        section_id="SEC-01",
        departments=[Department.ENGINEERING],
        scheduled_start=b1.start_time,
        scheduled_end=b1.end_time,
        duration_hours=4.0,
    )

    records = mgr.audit_schedule(
        assignments=[asgn],
        tasks_lookup={"T-1": t1},
        blocks_lookup={"BLK-1": b1},
        resources=[],
        strict_fail_on_hard_violation=False,
    )
    dur_audit = next(r for r in records if r.constraint_name == "DurationCapacity")
    assert not dur_audit.is_satisfied


def test_audit_schedule_safety_incompatibility():
    mgr = ConstraintManager()
    # BallastCleaning and SignalTesting are mutually exclusive
    t1 = _make_task("T-1", "SEC-01", Department.ENGINEERING, "BallastCleaning", 2.0)
    t2 = _make_task("T-2", "SEC-01", Department.S_AND_T, "SignalTesting", 2.0)
    b1 = _make_block("BLK-1", "SEC-01", 12, 4.0)

    asgn = ScheduleAssignment(
        assignment_id="ASGN-1",
        block_id="BLK-1",
        task_ids=["T-1", "T-2"],
        section_id="SEC-01",
        departments=[Department.ENGINEERING, Department.S_AND_T],
        scheduled_start=b1.start_time,
        scheduled_end=b1.end_time,
        duration_hours=2.5,
    )

    records = mgr.audit_schedule(
        assignments=[asgn],
        tasks_lookup={"T-1": t1, "T-2": t2},
        blocks_lookup={"BLK-1": b1},
        resources=[],
        strict_fail_on_hard_violation=False,
    )
    safety_audit = next(r for r in records if r.constraint_name == "MutuallyExclusiveSafety")
    assert not safety_audit.is_satisfied


def test_audit_schedule_deadline_breach():
    mgr = ConstraintManager()
    # Task deadline is in 2 hours (12:00), block finishes in 4 hours (16:00)
    t1 = _make_task("T-1", "SEC-01", Department.ENGINEERING, "TrackTamping", 2.0, deadline_offset_hours=2)
    b1 = _make_block("BLK-1", "SEC-01", 12, 4.0)

    asgn = ScheduleAssignment(
        assignment_id="ASGN-1",
        block_id="BLK-1",
        task_ids=["T-1"],
        section_id="SEC-01",
        departments=[Department.ENGINEERING],
        scheduled_start=b1.start_time,
        scheduled_end=b1.end_time,
        duration_hours=2.0,
    )

    records = mgr.audit_schedule(
        assignments=[asgn],
        tasks_lookup={"T-1": t1},
        blocks_lookup={"BLK-1": b1},
        resources=[],
        strict_fail_on_hard_violation=False,
    )
    dl_audit = next(r for r in records if r.constraint_name == "MandatoryDeadline")
    assert not dl_audit.is_satisfied
