"""Unit tests for the Dynamic Replanning Engine."""

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
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan
from src.planning.replan import (
    DynamicReplanningEngine,
    DisruptionEvent,
    DisruptionEventType,
    ReplanResult,
)


def _setup_base_weekly_scenario():
    start_date = date(2026, 9, 8)
    blocks: list[BlockWindow] = []
    tasks: list[MaintenanceTask] = []
    resources: list[Resource] = []

    res_start = datetime(2026, 9, 8, 0, 0)
    res_end = datetime(2026, 9, 16, 0, 0)
    resources.append(
        Resource(
            resource_id="RES-ENG-CREW",
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
            resource_id="RES-SNT-CREW",
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
            resource_id="RES-TAMPING-1",
            department=Department.ENGINEERING,
            resource_type=ResourceType.TAMPING_MACHINE,
            capacity=1,
            available_from=res_start,
            available_until=res_end,
            section_id="SEC-01",
        )
    )

    # 7 days of blocks: 2 per day
    for day_idx in range(7):
        curr_date = start_date + timedelta(days=day_idx)
        b1_st = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=2)
        b1_et = b1_st + timedelta(hours=3)
        blocks.append(
            BlockWindow(
                block_id=f"BLK-D{day_idx}-01",
                section_id="SEC-01",
                date=curr_date,
                start_time=b1_st,
                end_time=b1_et,
                available=True,
            )
        )
        b2_st = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=14)
        b2_et = b2_st + timedelta(hours=2)
        blocks.append(
            BlockWindow(
                block_id=f"BLK-D{day_idx}-02",
                section_id="SEC-01",
                date=curr_date,
                start_time=b2_st,
                end_time=b2_et,
                available=True,
            )
        )

    # Routine task on Day 2
    tasks.append(
        MaintenanceTask(
            task_id="TSK-ROUTINE-01",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=3,
            urgency=3,
            priority_score=70.0,
            duration_hours=2.0,
            required_workers=4,
            required_machine="TampingMachine",
            deadline=datetime(2026, 9, 14, 18, 0),
            is_safety_critical=False,
        )
    )

    planner = WeeklyPlanningEngine()
    initial_plan = planner.generate_weekly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        week_start_date=start_date,
        plan_id="INITIAL-WEEKLY-PLAN",
    )

    return start_date, tasks, blocks, resources, initial_plan


def test_replan_new_critical_defect():
    start_date, tasks, blocks, resources, initial_plan = _setup_base_weekly_scenario()
    replan_engine = DynamicReplanningEngine()

    # Emergency fracture defect arrives on Day 1
    emergency_task = MaintenanceTask(
        task_id="TSK-EMERGENCY-FRACTURE",
        asset_id="AST-02",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        severity=5,
        urgency=5,
        priority_score=99.0,
        duration_hours=2.0,
        required_workers=4,
        required_machine="TampingMachine",
        deadline=datetime(2026, 9, 9, 23, 59),
        is_safety_critical=True,
    )

    event = DisruptionEvent(
        event_id="EVT-001",
        event_type=DisruptionEventType.NEW_CRITICAL_DEFECT,
        timestamp=datetime(2026, 9, 8, 8, 30),
        affected_section_id="SEC-01",
        description="Emergency rail fracture reported at KM 102/4",
        new_tasks=[emergency_task],
    )

    result: ReplanResult = replan_engine.handle_disruption(
        event=event,
        current_plan=initial_plan,
        all_tasks=tasks,
        all_blocks=blocks,
        all_resources=resources,
    )

    assert result.replan_id.startswith("REPLAN-NEW_CRITICAL_DEFECT")
    assert result.updated_plan.total_tasks_scheduled >= 2
    # Ensure emergency task was successfully scheduled
    scheduled_task_ids = [
        t_id
        for dp in result.updated_plan.daily_plans
        for asgn in dp.assignments
        for t_id in asgn.task_ids
    ]
    assert "TSK-EMERGENCY-FRACTURE" in scheduled_task_ids


def test_replan_cancelled_block():
    start_date, tasks, blocks, resources, initial_plan = _setup_base_weekly_scenario()
    replan_engine = DynamicReplanningEngine()

    # Cancel Day 0 block
    event = DisruptionEvent(
        event_id="EVT-002",
        event_type=DisruptionEventType.BLOCK_CANCELLED,
        timestamp=datetime(2026, 9, 8, 1, 0),
        affected_section_id="SEC-01",
        description="Heavy freight crossing forced cancellation of BLK-D0-01",
        affected_block_ids=["BLK-D0-01"],
    )

    result: ReplanResult = replan_engine.handle_disruption(
        event=event,
        current_plan=initial_plan,
        all_tasks=tasks,
        all_blocks=blocks,
        all_resources=resources,
    )

    assert result.replan_id.startswith("REPLAN-BLOCK_CANCELLED")
    # All hard constraints must still pass audit
    assert all(r.is_satisfied for r in result.updated_plan.audit_records)
    # The cancelled block must not have any assignments
    for dp in result.updated_plan.daily_plans:
        for asgn in dp.assignments:
            assert asgn.block_id != "BLK-D0-01"
