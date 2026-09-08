"""Explicit Hard and Soft Constraint Classification and Audit Engine."""

from __future__ import annotations
from enum import Enum
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.exceptions import InfeasibleScheduleError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    Department,
    ResourceType,
)
from src.coordination.coordinator import MultiDepartmentCoordinator

logger = logging.getLogger(__name__)


class ConstraintType(str, Enum):
    HARD = "HARD"  # Non-negotiable physical & safety invariant
    SOFT = "SOFT"  # Preference or penalized objective trade-off


class ConstraintCategory(str, Enum):
    SAFETY = "SAFETY"
    TEMPORAL = "TEMPORAL"
    RESOURCE = "RESOURCE"
    SECTION_INTEGRITY = "SECTION_INTEGRITY"
    TRAIN_PROTECTION = "TRAIN_PROTECTION"
    PREFERENCE = "PREFERENCE"
    COORDINATION = "COORDINATION"


class ConstraintDefinition(BaseModel):
    """Specification of a railway operational constraint."""
    name: str
    constraint_type: ConstraintType
    category: ConstraintCategory
    description: str
    is_mandatory: bool = True
    penalty_weight_key: Optional[str] = None


class ConstraintAuditRecord(BaseModel):
    """Result of auditing a specific constraint against a generated schedule."""
    constraint_name: str
    constraint_type: ConstraintType
    category: ConstraintCategory
    is_satisfied: bool
    violations_count: int = 0
    violation_details: List[str] = Field(default_factory=list)


class ConstraintManager:
    """Classifies, registers, and audits hard physical invariants vs soft preferences."""

    HARD_CONSTRAINTS = [
        ConstraintDefinition(
            name="SectionIntegrity",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.SECTION_INTEGRITY,
            description="Task section must exactly match block section.",
        ),
        ConstraintDefinition(
            name="BlockAvailability",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.TEMPORAL,
            description="Tasks can only be scheduled in active/available block windows.",
        ),
        ConstraintDefinition(
            name="DurationCapacity",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.TEMPORAL,
            description="Coordinated duration of assigned tasks must not exceed block duration.",
        ),
        ConstraintDefinition(
            name="CrewCapacity",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.RESOURCE,
            description="Total required workers per department must not exceed crew capacity in block window.",
        ),
        ConstraintDefinition(
            name="SpecializedMachinery",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.RESOURCE,
            description="Required specialized machinery must be operational and available in window.",
        ),
        ConstraintDefinition(
            name="MutuallyExclusiveSafety",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.SAFETY,
            description="Mutually hazardous work types cannot co-occur in the same physical block.",
        ),
        ConstraintDefinition(
            name="MandatoryDeadline",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.TEMPORAL,
            description="Block possession must finish prior to the task mandated deadline.",
        ),
    ]

    SOFT_CONSTRAINTS = [
        ConstraintDefinition(
            name="TrainImpactMinimization",
            constraint_type=ConstraintType.SOFT,
            category=ConstraintCategory.TRAIN_PROTECTION,
            description="Penalize scheduling blocks during high-density train traffic windows.",
            penalty_weight_key="train_impact_penalty",
        ),
        ConstraintDefinition(
            name="MultiDepartmentCoordination",
            constraint_type=ConstraintType.SOFT,
            category=ConstraintCategory.COORDINATION,
            description="Reward bundling multiple departmental tasks into a single possession.",
            penalty_weight_key="coordination_bonus",
        ),
        ConstraintDefinition(
            name="DowntimeMinimization",
            constraint_type=ConstraintType.SOFT,
            category=ConstraintCategory.PREFERENCE,
            description="Penalize excessive corridor possession hours.",
            penalty_weight_key="downtime_penalty",
        ),
        ConstraintDefinition(
            name="DeferralMinimization",
            constraint_type=ConstraintType.SOFT,
            category=ConstraintCategory.PREFERENCE,
            description="Penalize leaving high-priority routine tasks unserved.",
            penalty_weight_key="deferral_penalty",
        ),
    ]

    def __init__(self):
        self.coordinator = MultiDepartmentCoordinator()

    def audit_schedule(
        self,
        assignments: List[ScheduleAssignment],
        tasks_lookup: Dict[str, MaintenanceTask],
        blocks_lookup: Dict[str, BlockWindow],
        resources: List[Resource],
        strict_fail_on_hard_violation: bool = True,
    ) -> List[ConstraintAuditRecord]:
        """Perform comprehensive post-optimization audit verifying zero hard constraint breaches."""
        audit_records: List[ConstraintAuditRecord] = []

        # Audit 1: Section Integrity
        sec_violations = []
        for asgn in assignments:
            block = blocks_lookup.get(asgn.block_id)
            if not block or asgn.section_id != block.section_id:
                sec_violations.append(f"Assignment {asgn.assignment_id} section {asgn.section_id} != block section {block.section_id if block else 'None'}")
            for t_id in asgn.task_ids:
                task = tasks_lookup.get(t_id)
                if task and task.section_id != asgn.section_id:
                    sec_violations.append(f"Task {t_id} (sec {task.section_id}) assigned to block on sec {asgn.section_id}")
        audit_records.append(ConstraintAuditRecord(
            constraint_name="SectionIntegrity",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.SECTION_INTEGRITY,
            is_satisfied=len(sec_violations) == 0,
            violations_count=len(sec_violations),
            violation_details=sec_violations,
        ))

        # Audit 2: Block Availability & Duration Capacity
        dur_violations = []
        for asgn in assignments:
            block = blocks_lookup.get(asgn.block_id)
            if not block:
                dur_violations.append(f"Block {asgn.block_id} not found.")
                continue
            if not block.available:
                dur_violations.append(f"Block {asgn.block_id} is marked unavailable.")

            b_tasks = [tasks_lookup[t_id] for t_id in asgn.task_ids if t_id in tasks_lookup]
            bundle = self.coordinator.evaluate_bundle(b_tasks)
            if bundle.coordinated_duration_hours > block.duration_hours + 1e-3:
                dur_violations.append(
                    f"Block {asgn.block_id} duration ({block.duration_hours}h) exceeded by tasks ({bundle.coordinated_duration_hours}h)"
                )
        audit_records.append(ConstraintAuditRecord(
            constraint_name="DurationCapacity",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.TEMPORAL,
            is_satisfied=len(dur_violations) == 0,
            violations_count=len(dur_violations),
            violation_details=dur_violations,
        ))

        # Audit 3: Mutually Exclusive Safety
        safety_violations = []
        for asgn in assignments:
            b_tasks = [tasks_lookup[t_id] for t_id in asgn.task_ids if t_id in tasks_lookup]
            bundle = self.coordinator.evaluate_bundle(b_tasks)
            if not bundle.is_compatible:
                safety_violations.append(f"Assignment {asgn.assignment_id} safety violation: {bundle.incompatibility_reason}")
        audit_records.append(ConstraintAuditRecord(
            constraint_name="MutuallyExclusiveSafety",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.SAFETY,
            is_satisfied=len(safety_violations) == 0,
            violations_count=len(safety_violations),
            violation_details=safety_violations,
        ))

        # Audit 4: Mandatory Deadline
        deadline_violations = []
        for asgn in assignments:
            block = blocks_lookup.get(asgn.block_id)
            if not block:
                continue
            for t_id in asgn.task_ids:
                task = tasks_lookup.get(t_id)
                if task and block.end_time > task.deadline:
                    deadline_violations.append(
                        f"Task {t_id} deadline {task.deadline.strftime('%Y-%m-%d %H:%M')} breached by block end {block.end_time.strftime('%Y-%m-%d %H:%M')}"
                    )
        audit_records.append(ConstraintAuditRecord(
            constraint_name="MandatoryDeadline",
            constraint_type=ConstraintType.HARD,
            category=ConstraintCategory.TEMPORAL,
            is_satisfied=len(deadline_violations) == 0,
            violations_count=len(deadline_violations),
            violation_details=deadline_violations,
        ))

        # Check for fatal hard constraint violations
        hard_failures = [rec for rec in audit_records if rec.constraint_type == ConstraintType.HARD and not rec.is_satisfied]
        if hard_failures and strict_fail_on_hard_violation:
            failure_msgs = [f"[{h.constraint_name}] {'; '.join(h.violation_details)}" for h in hard_failures]
            raise InfeasibleScheduleError(
                f"Schedule audit failed with {len(hard_failures)} hard invariant violations: {failure_msgs}",
                details={"failures": [h.model_dump() for h in hard_failures]},
            )

        return audit_records
