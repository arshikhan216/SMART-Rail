"""Unit tests for the Weekly Planning Engine."""

from datetime import datetime, date, timedelta
import pytest

from src.exceptions import PlanningError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    PriorityLevel,
)
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan, DailyPlan


def _create_synthetic_weekly_scenario():
    start_date = date(2026, 9, 8)
    blocks: list[BlockWindow] = []
    tasks: list[MaintenanceTask] = []
    resources: list[Resource] = []

    # 1. Create resources
    res_start = datetime(2026, 9, 8, 0, 0)
    res_end = datetime(2026, 9, 16, 0, 0)
    resources.append(
        Resource(
            resource_id="RES-ENG-1",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )
    resources.append(
        Resource(
            resource_id="RES-SNT-1",
            department=Department.S_AND_T,
            resource_type=ResourceType.CREW,
            capacity=6,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )
    resources.append(
        Resource(
            resource_id="RES-TRC-1",
            department=Department.TRACTION,
            resource_type=ResourceType.CREW,
            capacity=6,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )
    resources.append(
        Resource(
            resource_id="RES-MACH-1",
            department=Department.ENGINEERING,
            resource_type=ResourceType.TAMPING_MACHINE,
            capacity=1,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )

    # 2. Create 7 days of block windows (2 blocks per day on SEC-01)
    for day_idx in range(7):
        curr_date = start_date + timedelta(days=day_idx)
        # Block 1: 02:00 to 05:00 (Night window, 3h)
        b1_st = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=2)
        b1_et = b1_st + timedelta(hours=3)
        blocks.append(
            BlockWindow(
                block_id=f"BLK-D{day_idx}-NIGHT",
                section_id="SEC-01",
                date=curr_date,
                start_time=b1_st,
                end_time=b1_et,
                available=True,
            )
        )
        # Block 2: 12:00 to 14:00 (Afternoon window, 2h)
        b2_st = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=12)
        b2_et = b2_st + timedelta(hours=2)
        blocks.append(
            BlockWindow(
                block_id=f"BLK-D{day_idx}-AFT",
                section_id="SEC-01",
                date=curr_date,
                start_time=b2_st,
                end_time=b2_et,
                available=True,
            )
        )

    # 3. Create tasks across departments
    # Task 1: High priority Engineering Track Tamping
    tasks.append(
        MaintenanceTask(
            task_id="TSK-ENG-01",
            asset_id="AST-TRK-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=4,
            priority_score=90.0,
            duration_hours=2.5,
            required_workers=4,
            required_machine="TampingMachine",
            deadline=datetime(2026, 9, 11, 18, 0),
            is_safety_critical=True,
        )
    )
    # Task 2: High priority Signal Inspection
    tasks.append(
        MaintenanceTask(
            task_id="TSK-SNT-01",
            asset_id="AST-SIG-01",
            section_id="SEC-01",
            department=Department.S_AND_T,
            maintenance_type="SignalInspection",
            severity=4,
            urgency=3,
            priority_score=80.0,
            duration_hours=1.5,
            required_workers=2,
            deadline=datetime(2026, 9, 12, 18, 0),
        )
    )
    # Task 3: Traction OHE Inspection
    tasks.append(
        MaintenanceTask(
            task_id="TSK-TRC-01",
            asset_id="AST-OHE-01",
            section_id="SEC-01",
            department=Department.TRACTION,
            maintenance_type="OHEInspection",
            severity=3,
            urgency=3,
            priority_score=75.0,
            duration_hours=1.5,
            required_workers=3,
            deadline=datetime(2026, 9, 14, 18, 0),
        )
    )

    return start_date, tasks, blocks, resources


def test_weekly_planning_end_to_end():
    start_date, tasks, blocks, resources = _create_synthetic_weekly_scenario()
    planner = WeeklyPlanningEngine()

    plan: WeeklyPlan = planner.generate_weekly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        week_start_date=start_date,
        plan_id="TEST-WEEKLY-PLAN-01",
        strict_audit=True,
    )

    assert plan.plan_id == "TEST-WEEKLY-PLAN-01"
    assert plan.week_start_date == start_date
    assert plan.week_end_date == start_date + timedelta(days=6)
    assert len(plan.daily_plans) == 7

    # Ensure all days are represented in chronological order
    for idx, dp in enumerate(plan.daily_plans):
        assert dp.date == start_date + timedelta(days=idx)
        assert dp.is_feasibility_audited is True

    # At least some tasks should be scheduled
    assert plan.total_tasks_scheduled > 0
    assert plan.total_blocks_used > 0
    assert len(plan.audit_records) > 0
    assert all(r.is_satisfied for r in plan.audit_records)

    # Check departmental breakdown
    for dept in Department:
        assert dept in plan.department_summaries


def test_weekly_planning_empty_inputs_raises_error():
    planner = WeeklyPlanningEngine()
    with pytest.raises(PlanningError):
        planner.generate_weekly_plan(
            tasks=[],
            blocks=[],
            resources=[],
        )
