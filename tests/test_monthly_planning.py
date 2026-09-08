"""Unit tests for the Monthly Planning Engine."""

from datetime import datetime, date, timedelta
import pytest

from src.exceptions import PlanningError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
)
from src.planning.monthly import MonthlyPlanningEngine, MonthlyPlan


def _create_monthly_scenario():
    start_date = date(2026, 9, 1)
    blocks: list[BlockWindow] = []
    tasks: list[MaintenanceTask] = []
    resources: list[Resource] = []

    res_start = datetime(2026, 9, 1, 0, 0)
    res_end = datetime(2026, 10, 15, 0, 0)
    resources.append(
        Resource(
            resource_id="RES-ENG-MONTH",
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
            resource_id="RES-SNT-MONTH",
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
            resource_id="RES-TRC-MONTH",
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
            resource_id="RES-TAMPING-MACH",
            department=Department.ENGINEERING,
            resource_type=ResourceType.TAMPING_MACHINE,
            capacity=1,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )

    # 4 weeks (28 days) of daily blocks
    for day_idx in range(28):
        curr_date = start_date + timedelta(days=day_idx)
        b_st = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=2)
        b_et = b_st + timedelta(hours=3)
        blocks.append(
            BlockWindow(
                block_id=f"BLK-M-D{day_idx}",
                section_id="SEC-01",
                date=curr_date,
                start_time=b_st,
                end_time=b_et,
                available=True,
            )
        )

    # Week 1 Task: High-priority Urgent Corrective
    tasks.append(
        MaintenanceTask(
            task_id="TSK-W1-ENG",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=5,
            priority_score=95.0,
            duration_hours=2.0,
            required_workers=4,
            required_machine="TampingMachine",
            deadline=datetime(2026, 9, 5, 12, 0),
            is_safety_critical=True,
        )
    )

    # Week 2 Task: S&T Routine Inspection
    tasks.append(
        MaintenanceTask(
            task_id="TSK-W2-SNT",
            asset_id="AST-02",
            section_id="SEC-01",
            department=Department.S_AND_T,
            maintenance_type="SignalInspection",
            severity=2,
            urgency=2,
            priority_score=60.0,
            duration_hours=1.5,
            required_workers=2,
            deadline=datetime(2026, 9, 14, 12, 0),
            is_safety_critical=False,
        )
    )

    # Week 3 Task: Traction Routine
    tasks.append(
        MaintenanceTask(
            task_id="TSK-W3-TRC",
            asset_id="AST-03",
            section_id="SEC-01",
            department=Department.TRACTION,
            maintenance_type="OHEInspection",
            severity=2,
            urgency=2,
            priority_score=55.0,
            duration_hours=1.5,
            required_workers=3,
            deadline=datetime(2026, 9, 21, 12, 0),
            is_safety_critical=False,
        )
    )

    return start_date, tasks, blocks, resources


def test_monthly_planning_end_to_end():
    start_date, tasks, blocks, resources = _create_monthly_scenario()
    monthly_planner = MonthlyPlanningEngine()

    month_plan: MonthlyPlan = monthly_planner.generate_monthly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        month_start_date=start_date,
        num_weeks=4,
        plan_id="TEST-MONTHLY-PLAN-01",
    )

    assert month_plan.plan_id == "TEST-MONTHLY-PLAN-01"
    assert month_plan.month_start_date == start_date
    assert month_plan.month_end_date == start_date + timedelta(days=27)
    assert len(month_plan.weekly_plans) == 4

    # Verification of tasks scheduled across the month
    assert month_plan.total_tasks_scheduled >= 3
    assert month_plan.committed_tasks_count >= 1  # Week 1
    assert month_plan.tentative_tasks_count >= 1  # Weeks 2+
    assert month_plan.corrective_tasks_count >= 1
    assert month_plan.preventive_tasks_count >= 1

    # Verify departmental hours
    for dept in Department:
        assert dept in month_plan.department_monthly_hours


def test_monthly_planning_empty_inputs_raises_error():
    planner = MonthlyPlanningEngine()
    with pytest.raises(PlanningError):
        planner.generate_monthly_plan(
            tasks=[],
            blocks=[],
            resources=[],
        )
