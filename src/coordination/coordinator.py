"""Multi-department maintenance coordination and possession bundling engine."""

from __future__ import annotations
import datetime as dt
import itertools
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.config import CONFIG, CoordinationConfig
from src.schemas import MaintenanceTask, Department, BlockWindow

logger = logging.getLogger(__name__)


class TaskCoordinationBundle(BaseModel):
    """A bundle of cross-departmental tasks coordinated within a single possession."""
    bundle_id: str
    section_id: str
    task_ids: List[str]
    departments: List[Department]
    individual_total_duration_hours: float
    coordinated_duration_hours: float
    saved_possession_hours: float
    is_compatible: bool = True
    incompatibility_reason: Optional[str] = None
    explanation: str = ""


class MultiDepartmentCoordinator:
    """Evaluates cross-departmental work compatibility and calculates possession savings."""

    # Explicit mutually exclusive work rules (Safety Invariants)
    MUTUALLY_EXCLUSIVE_TYPES: Set[Tuple[str, str]] = {
        ("BallastCleaning", "SignalTesting"),
        ("SignalTesting", "BallastCleaning"),
        ("RailGrinding", "CableMeggering"),
        ("CableMeggering", "RailGrinding"),
        ("JointWelding", "ContactWireReplacement"),
        ("ContactWireReplacement", "JointWelding"),
    }

    def __init__(self, config: Optional[CoordinationConfig] = None):
        self.config = config or CONFIG.coordination

    def check_pairwise_compatibility(
        self,
        task_a: MaintenanceTask,
        task_b: MaintenanceTask,
    ) -> Tuple[bool, str]:
        """Check if two maintenance tasks can be safely co-scheduled in the same block."""
        # 1. Section Invariant
        if task_a.section_id != task_b.section_id:
            return False, f"Different sections ({task_a.section_id} != {task_b.section_id})"

        # 2. Mutually exclusive work types
        pair = (task_a.maintenance_type, task_b.maintenance_type)
        if pair in self.MUTUALLY_EXCLUSIVE_TYPES:
            return False, f"Safety conflict: Work types '{task_a.maintenance_type}' and '{task_b.maintenance_type}' are mutually exclusive"

        # 3. Department combinations
        depts = sorted([task_a.department.value, task_b.department.value])
        # If same department, routine check (e.g. 2 track tasks in same block)
        if task_a.department == task_b.department:
            return True, "Same department multi-tasking"

        # Check allowed cross-department configurations
        is_allowed = any(
            set(depts).issubset(set(allowed_combo))
            for allowed_combo in self.config.compatible_departments
        )
        if not is_allowed:
            return False, f"Department combination {depts} is not configured as safely compatible"

        return True, "Compatible cross-department coordination"

    def compute_bundle_duration(self, tasks: List[MaintenanceTask]) -> Tuple[float, float, float]:
        """
        Compute total individual duration, coordinated duration, and hours saved.
        Cross-departmental coordination: coordinated duration = max(task durations) + safety_buffer_minutes.
        Same-department tasks execute sequentially: coordinated duration = sum(task durations).
        """
        if not tasks:
            return 0.0, 0.0, 0.0

        individual_sum = sum(t.duration_hours for t in tasks)
        departments = set(t.department for t in tasks)

        # If all tasks are from the same department, they execute sequentially
        if len(departments) <= 1:
            return individual_sum, individual_sum, 0.0

        max_single = max(t.duration_hours for t in tasks)
        buffer_hours = self.config.safety_buffer_minutes / 60.0

        # Coordinated duration is max task duration plus buffer, capped at individual sum
        coordinated = min(individual_sum, max_single + (buffer_hours if len(tasks) > 1 else 0.0))
        coordinated = round(coordinated, 2)
        saved = round(max(0.0, individual_sum - coordinated), 2)

        return individual_sum, coordinated, saved


    def evaluate_bundle(self, tasks: List[MaintenanceTask]) -> TaskCoordinationBundle:
        """Evaluate a specific candidate set of tasks for coordination feasibility and savings."""
        if not tasks:
            raise ValueError("Empty task list provided for bundle evaluation.")

        sec_id = tasks[0].section_id
        task_ids = [t.task_id for t in tasks]
        departments = list(set(t.department for t in tasks))

        # Check size constraint
        if len(tasks) > self.config.max_tasks_per_block:
            return TaskCoordinationBundle(
                bundle_id=f"BNDL-{'-'.join(task_ids[:2])}",
                section_id=sec_id,
                task_ids=task_ids,
                departments=departments,
                individual_total_duration_hours=sum(t.duration_hours for t in tasks),
                coordinated_duration_hours=sum(t.duration_hours for t in tasks),
                saved_possession_hours=0.0,
                is_compatible=False,
                incompatibility_reason=f"Exceeds max tasks per block ({len(tasks)} > {self.config.max_tasks_per_block})",
            )

        # Check all pairwise compatibilities
        for t1, t2 in itertools.combinations(tasks, 2):
            ok, reason = self.check_pairwise_compatibility(t1, t2)
            if not ok:
                return TaskCoordinationBundle(
                    bundle_id=f"BNDL-{'-'.join(task_ids[:2])}",
                    section_id=sec_id,
                    task_ids=task_ids,
                    departments=departments,
                    individual_total_duration_hours=sum(t.duration_hours for t in tasks),
                    coordinated_duration_hours=sum(t.duration_hours for t in tasks),
                    saved_possession_hours=0.0,
                    is_compatible=False,
                    incompatibility_reason=reason,
                )

        indiv_sum, coord_dur, saved_hrs = self.compute_bundle_duration(tasks)

        explanation = (
            f"Coordinated {len(tasks)} tasks across {[d.value for d in departments]} in section {sec_id}. "
            f"Separate possessions: {indiv_sum:.1f}h -> Bundled: {coord_dur:.1f}h (Saved: {saved_hrs:.1f}h downtime)."
        )

        return TaskCoordinationBundle(
            bundle_id=f"BNDL-{'-'.join(task_ids[:2])}",
            section_id=sec_id,
            task_ids=task_ids,
            departments=departments,
            individual_total_duration_hours=indiv_sum,
            coordinated_duration_hours=coord_dur,
            saved_possession_hours=saved_hrs,
            is_compatible=True,
            explanation=explanation,
        )

    def find_all_opportunities(
        self,
        tasks: List[MaintenanceTask],
        max_bundle_size: int = 3,
    ) -> List[TaskCoordinationBundle]:
        """Find all valid coordinated multi-department bundles grouped by corridor section."""
        # Group tasks by section
        tasks_by_sec: Dict[str, List[MaintenanceTask]] = {}
        for t in tasks:
            tasks_by_sec.setdefault(t.section_id, []).append(t)

        bundles: List[TaskCoordinationBundle] = []

        for sec_id, sec_tasks in tasks_by_sec.items():
            if len(sec_tasks) < 2:
                continue

            # Evaluate 2-task and 3-task combinations
            for size in range(2, min(max_bundle_size, len(sec_tasks)) + 1):
                for task_combo in itertools.combinations(sec_tasks, size):
                    bundle = self.evaluate_bundle(list(task_combo))
                    if bundle.is_compatible and bundle.saved_possession_hours > 0:
                        bundles.append(bundle)

        logger.info(f"Identified {len(bundles)} valid multi-department coordination opportunities.")
        return bundles
