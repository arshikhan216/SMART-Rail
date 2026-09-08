"""Monthly Rolling-Horizon Block Planning Engine for Indian Railways maintenance operations."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.config import CONFIG
from src.exceptions import PlanningError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    Department,
    Train,
    TrainMovement,
)
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan

logger = logging.getLogger(__name__)


class MonthlyPlan(BaseModel):
    """30-Day strategic rolling-horizon maintenance block plan."""
    plan_id: str
    month_start_date: dt.date
    month_end_date: dt.date
    weekly_plans: List[WeeklyPlan] = Field(default_factory=list)
    total_tasks_considered: int = 0
    total_tasks_scheduled: int = 0
    committed_tasks_count: int = 0  # Week 1 frozen commitments
    tentative_tasks_count: int = 0  # Weeks 2-4 flexible allocations
    total_unassigned_tasks: List[str] = Field(default_factory=list)
    total_blocks_used: int = 0
    total_possession_hours: float = 0.0
    total_coordination_savings_hours: float = 0.0
    average_asset_availability: float = 1.0
    department_monthly_hours: Dict[Department, float] = Field(default_factory=dict)
    preventive_tasks_count: int = 0
    corrective_tasks_count: int = 0
    status: str = "OPTIMAL"
    warnings: List[str] = Field(default_factory=list)


class MonthlyPlanningEngine:
    """30-Day rolling-horizon planner with committed near-term and flexible long-term horizons."""

    def __init__(self, weekly_engine: Optional[WeeklyPlanningEngine] = None):
        self.weekly_engine = weekly_engine or WeeklyPlanningEngine()

    def generate_monthly_plan(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        train_movements: Optional[List[TrainMovement]] = None,
        trains: Optional[List[Train]] = None,
        month_start_date: Optional[dt.date] = None,
        num_weeks: int = 4,
        plan_id: Optional[str] = None,
    ) -> MonthlyPlan:
        """Generate a 4-week (28-30 day) rolling schedule across Indian Railways corridors."""
        if not tasks and not blocks:
            raise PlanningError("Cannot generate monthly plan with empty tasks and blocks.")

        if month_start_date is None:
            if blocks:
                month_start_date = min(b.date for b in blocks)
            elif tasks:
                month_start_date = min(t.deadline.date() for t in tasks)
            else:
                month_start_date = dt.date.today()

        month_end_date = month_start_date + dt.timedelta(days=(num_weeks * 7) - 1)
        plan_id = plan_id or f"MONTHLY-PLAN-{month_start_date.strftime('%Y%m%d')}"

        logger.info(
            "Generating monthly plan %s from %s to %s (%d weeks)",
            plan_id,
            month_start_date,
            month_end_date,
            num_weeks,
        )

        remaining_tasks_dict = {t.task_id: t for t in tasks}
        weekly_plans: List[WeeklyPlan] = []
        all_scheduled_task_ids: Set[str] = set()

        # Rolling 7-day iteration across the month
        for week_idx in range(num_weeks):
            w_start = month_start_date + dt.timedelta(days=week_idx * 7)
            w_end = w_start + dt.timedelta(days=6)

            # Filter blocks within this specific week
            w_blocks = [b for b in blocks if w_start <= b.date <= w_end and b.available]

            # Stage tasks for this week:
            # 1. Urgent / safety-critical tasks are considered immediately.
            # 2. Routine tasks maturing (deadline <= w_end) or carried over from prior weeks are staged.
            # 3. In the final week, all remaining tasks are considered.
            if week_idx == num_weeks - 1:
                active_tasks = list(remaining_tasks_dict.values())
            else:
                active_tasks = [
                    t for t in remaining_tasks_dict.values()
                    if t.is_safety_critical or t.urgency >= 4 or t.deadline.date() <= w_end
                ]

            if not active_tasks or not w_blocks:
                logger.info("No active tasks or blocks for week %d (%s to %s)", week_idx + 1, w_start, w_end)
                empty_plan = WeeklyPlan(
                    plan_id=f"{plan_id}-W{week_idx + 1}",
                    week_start_date=w_start,
                    week_end_date=w_end,
                    daily_plans=[],
                    optimization_status="NO_WORK",
                )
                weekly_plans.append(empty_plan)
                continue

            # Run weekly optimizer for this rolling batch
            w_plan = self.weekly_engine.generate_weekly_plan(
                tasks=active_tasks,
                blocks=w_blocks,
                resources=resources,
                train_movements=train_movements,
                trains=trains,
                week_start_date=w_start,
                plan_id=f"{plan_id}-W{week_idx + 1}",
                strict_audit=True,
            )
            weekly_plans.append(w_plan)

            # Retire scheduled tasks from remaining pool for subsequent weeks
            for dp in w_plan.daily_plans:
                for asgn in dp.assignments:
                    for tid in asgn.task_ids:
                        all_scheduled_task_ids.add(tid)
                        remaining_tasks_dict.pop(tid, None)

        # Aggregate Monthly Metrics
        total_tasks_scheduled = sum(wp.total_tasks_scheduled for wp in weekly_plans)
        total_blocks_used = sum(wp.total_blocks_used for wp in weekly_plans)
        total_possession_hours = sum(wp.total_possession_hours for wp in weekly_plans)
        total_coordination_savings = sum(wp.total_coordination_savings_hours for wp in weekly_plans)

        # Committed (Week 1) vs Tentative (Weeks 2+)
        committed_count = weekly_plans[0].total_tasks_scheduled if weekly_plans else 0
        tentative_count = max(0, total_tasks_scheduled - committed_count)

        # Department monthly hours breakdown
        dept_hours: Dict[Department, float] = {d: 0.0 for d in Department}
        for wp in weekly_plans:
            for dept, summ in wp.department_summaries.items():
                dept_hours[dept] = round(dept_hours.get(dept, 0.0) + summ.total_hours, 2)

        # Preventive vs Corrective breakdown
        tasks_lookup = {t.task_id: t for t in tasks}
        preventive_count = 0
        corrective_count = 0
        for tid in all_scheduled_task_ids:
            task = tasks_lookup.get(tid)
            if task:
                if task.is_safety_critical or task.urgency >= 4:
                    corrective_count += 1
                else:
                    preventive_count += 1

        # Average asset availability across weekly periods
        availabilities = [wp.overall_asset_availability for wp in weekly_plans if wp.daily_plans]
        avg_availability = round(sum(availabilities) / len(availabilities), 4) if availabilities else 1.0

        unassigned_ids = [t_id for t_id in remaining_tasks_dict.keys()]

        return MonthlyPlan(
            plan_id=plan_id,
            month_start_date=month_start_date,
            month_end_date=month_end_date,
            weekly_plans=weekly_plans,
            total_tasks_considered=len(tasks),
            total_tasks_scheduled=total_tasks_scheduled,
            committed_tasks_count=committed_count,
            tentative_tasks_count=tentative_count,
            total_unassigned_tasks=unassigned_ids,
            total_blocks_used=total_blocks_used,
            total_possession_hours=round(total_possession_hours, 2),
            total_coordination_savings_hours=round(total_coordination_savings, 2),
            average_asset_availability=avg_availability,
            department_monthly_hours=dept_hours,
            preventive_tasks_count=preventive_count,
            corrective_tasks_count=corrective_count,
            status="OPTIMAL" if unassigned_ids == [] else "PARTIALLY_SCHEDULED",
        )
