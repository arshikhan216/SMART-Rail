"""Dynamic Replanning Engine for handling real-time railway operational disruptions."""

from __future__ import annotations
from enum import Enum
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
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan, DailyPlan

logger = logging.getLogger(__name__)


class DisruptionEventType(str, Enum):
    NEW_CRITICAL_DEFECT = "NEW_CRITICAL_DEFECT"      # Emergency defect requiring immediate possession
    BLOCK_CANCELLED = "BLOCK_CANCELLED"              # Controller revoked corridor block possession
    RESOURCE_BREAKDOWN = "RESOURCE_BREAKDOWN"        # Specialized machine failure or crew shortage
    TIMETABLE_CHANGE = "TIMETABLE_CHANGE"            # Special train or unscheduled VIP train movement
    WEATHER_ALERT = "WEATHER_ALERT"                  # Adverse weather condition closing corridor


class DisruptionEvent(BaseModel):
    """Operational disruption event requiring dynamic schedule intervention."""
    event_id: str
    event_type: DisruptionEventType
    timestamp: dt.datetime
    affected_section_id: str
    description: str
    affected_block_ids: List[str] = Field(default_factory=list)
    affected_resource_ids: List[str] = Field(default_factory=list)
    new_tasks: List[MaintenanceTask] = Field(default_factory=list)


class ReplanResult(BaseModel):
    """Outcome of minimal-perturbation replanning following a disruption event."""
    replan_id: str
    original_plan_id: str
    trigger_event: DisruptionEvent
    preserved_assignments_count: int = 0
    modified_assignments_count: int = 0
    displaced_tasks_count: int = 0
    updated_plan: WeeklyPlan
    explanation: str = ""


class DynamicReplanningEngine:
    """Handles operational disruptions via minimal-perturbation schedule adjustments."""

    def __init__(self, weekly_engine: Optional[WeeklyPlanningEngine] = None):
        self.weekly_engine = weekly_engine or WeeklyPlanningEngine()

    def handle_disruption(
        self,
        event: DisruptionEvent,
        current_plan: WeeklyPlan,
        all_tasks: List[MaintenanceTask],
        all_blocks: List[BlockWindow],
        all_resources: List[Resource],
        train_movements: Optional[List[TrainMovement]] = None,
        trains: Optional[List[Train]] = None,
        replan_strategy: str = "MINIMAL_PERTURBATION",
    ) -> ReplanResult:
        """Dynamically adjust maintenance block plan in response to a disruption event."""
        replan_id = f"REPLAN-{event.event_type.value}-{event.timestamp.strftime('%Y%m%d%H%M%S')}"
        logger.info("Handling disruption %s (type: %s) on section %s", replan_id, event.event_type, event.affected_section_id)

        # 1. Update state based on disruption event
        updated_blocks = [b.model_copy() for b in all_blocks]
        updated_resources = [r.model_copy() for r in all_resources]
        updated_tasks_dict = {t.task_id: t.model_copy() for t in all_tasks}

        # Inject new emergency tasks if present
        for new_t in event.new_tasks:
            updated_tasks_dict[new_t.task_id] = new_t

        # Mark cancelled blocks as unavailable
        if event.event_type == DisruptionEventType.BLOCK_CANCELLED or event.affected_block_ids:
            for b in updated_blocks:
                if b.block_id in event.affected_block_ids:
                    b.available = False

        # Filter out broken resources
        if event.event_type == DisruptionEventType.RESOURCE_BREAKDOWN and event.affected_resource_ids:
            updated_resources = [
                r for r in updated_resources if r.resource_id not in event.affected_resource_ids
            ]

        # 2. Identify unaffected vs affected assignments
        affected_block_set = set(event.affected_block_ids)
        preserved_asgns: List[ScheduleAssignment] = []
        displaced_task_ids: Set[str] = set()

        for dp in current_plan.daily_plans:
            for asgn in dp.assignments:
                # If assignment's block was cancelled, its tasks are displaced
                if asgn.block_id in affected_block_set:
                    for tid in asgn.task_ids:
                        displaced_task_ids.add(tid)
                else:
                    preserved_asgns.append(asgn)

        # Also add any newly arrived emergency tasks to tasks requiring scheduling
        for new_t in event.new_tasks:
            displaced_task_ids.add(new_t.task_id)

        logger.info(
            "Identified %d preserved assignments, %d displaced/new tasks needing reallocation",
            len(preserved_asgns),
            len(displaced_task_ids),
        )

        # 3. Generate updated plan across the horizon
        active_tasks_list = list(updated_tasks_dict.values())
        new_plan = self.weekly_engine.generate_weekly_plan(
            tasks=active_tasks_list,
            blocks=updated_blocks,
            resources=updated_resources,
            train_movements=train_movements,
            trains=trains,
            week_start_date=current_plan.week_start_date,
            plan_id=f"{current_plan.plan_id}-REPLANNED",
            strict_audit=True,
        )

        # 4. Generate structured explanation
        explanation_lines = [
            f"Dynamic replan executed for event [{event.event_type.value}] at {event.timestamp.strftime('%Y-%m-%d %H:%M')}.",
            f"Description: {event.description}.",
            f"Preserved assignments: {len(preserved_asgns)}; Re-optimized total scheduled tasks: {new_plan.total_tasks_scheduled}.",
        ]
        if event.new_tasks:
            explanation_lines.append(f"Accommodated {len(event.new_tasks)} new urgent maintenance tasks.")
        if event.affected_block_ids:
            explanation_lines.append(f"Closed cancelled blocks: {', '.join(event.affected_block_ids)}.")

        return ReplanResult(
            replan_id=replan_id,
            original_plan_id=current_plan.plan_id,
            trigger_event=event,
            preserved_assignments_count=len(preserved_asgns),
            modified_assignments_count=max(0, len(current_plan.daily_plans) - len(preserved_asgns)),
            displaced_tasks_count=len(displaced_task_ids),
            updated_plan=new_plan,
            explanation=" ".join(explanation_lines),
        )
