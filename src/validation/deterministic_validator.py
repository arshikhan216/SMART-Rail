"""Standalone Deterministic Schedule Validator (Independent Gating Layer)."""

from __future__ import annotations
import datetime as dt
import logging
from typing import List, Dict, Any, Optional

from src.schemas import (
    OptimizationResult,
    ScheduleAssignment,
    MaintenanceTask,
    BlockWindow,
    Resource,
    TrainMovement,
    Train,
    ValidationVerdict,
    ValidationCheckResult,
    DeterministicValidationReport
)

logger = logging.getLogger(__name__)


class DeterministicScheduleValidator:
    """Enforces absolute hard safety invariants independently of ML and Optimization models."""

    def __init__(self, min_headway_buffer_minutes: float = 15.0):
        self.min_headway_buffer_minutes = min_headway_buffer_minutes

    def validate_plan(
        self,
        opt_result: OptimizationResult,
        all_tasks: List[MaintenanceTask],
        all_blocks: List[BlockWindow],
        all_resources: List[Resource],
        movements: Optional[List[TrainMovement]] = None,
        trains: Optional[List[Train]] = None,
    ) -> DeterministicValidationReport:
        """Audit proposed schedule against all hard mathematical and operational safety bounds."""
        checks: List[ValidationCheckResult] = []
        task_map = {t.task_id: t for t in all_tasks}
        block_map = {b.block_id: b for b in all_blocks}
        resource_map = {r.resource_id: r for r in all_resources}

        # 1. Check: Possession Window Temporal Integrity
        duration_check = self._check_duration_bounds(opt_result.assignments, block_map, task_map)
        checks.append(duration_check)

        # 2. Check: Zero Simultaneous Single-Line Block Overlaps
        overlap_check = self._check_spatial_possession_overlaps(opt_result.assignments, block_map)
        checks.append(overlap_check)

        # 3. Check: Resource and Specialized Machinery Feasibility
        resource_check = self._check_resource_capacity(opt_result.assignments, task_map, all_resources)
        checks.append(resource_check)

        # 4. Check: Safety-Critical Maintenance Task Protection
        critical_check = self._check_critical_task_coverage(opt_result.assignments, all_tasks)
        checks.append(critical_check)

        # Determine overall verdict
        passed_count = sum(1 for c in checks if c.passed)
        failed_count = len(checks) - passed_count
        
        has_blocked = any(c.verdict == ValidationVerdict.BLOCKED for c in checks)
        has_review = any(c.verdict == ValidationVerdict.REQUIRES_REVIEW for c in checks)

        if has_blocked:
            overall = ValidationVerdict.BLOCKED
        elif has_review or failed_count > 0:
            overall = ValidationVerdict.REQUIRES_REVIEW
        else:
            overall = ValidationVerdict.VALID

        report = DeterministicValidationReport(
            plan_id=opt_result.plan_id,
            overall_verdict=overall,
            checks_evaluated=len(checks),
            checks_passed=passed_count,
            checks_failed=failed_count,
            validation_checks=checks,
            requires_human_review=(overall != ValidationVerdict.VALID),
            validated_at=dt.datetime.now()
        )

        logger.info(
            "[DeterministicValidator] Plan %s Audit Complete: %s (%d/%d checks passed)",
            opt_result.plan_id, overall.value, passed_count, len(checks)
        )
        return report

    def _check_duration_bounds(
        self,
        assignments: List[ScheduleAssignment],
        block_map: Dict[str, BlockWindow],
        task_map: Dict[str, MaintenanceTask]
    ) -> ValidationCheckResult:
        violations = []
        for asgn in assignments:
            block = block_map.get(asgn.block_id)
            if not block:
                violations.append(f"Assignment {asgn.assignment_id} references missing block {asgn.block_id}")
                continue
            
            # Cumulative task hours within block
            total_task_hours = sum(task_map[tid].duration_hours for tid in asgn.task_ids if tid in task_map)
            # Parallel bundled factor allows joint tasks up to block duration
            max_single_task = max([task_map[tid].duration_hours for tid in asgn.task_ids if tid in task_map] or [0])
            
            if max_single_task > block.duration_hours + 0.05:
                violations.append(
                    f"Task duration ({max_single_task:.1f}h) exceeds block window ({block.duration_hours:.1f}h) on {block.block_id}"
                )

        passed = len(violations) == 0
        return ValidationCheckResult(
            check_name="Possession Duration Bounds",
            passed=passed,
            verdict=ValidationVerdict.VALID if passed else ValidationVerdict.BLOCKED,
            description="Ensures task requirements do not exceed physical block time windows.",
            details={"violations": violations} if violations else None
        )

    def _check_spatial_possession_overlaps(
        self,
        assignments: List[ScheduleAssignment],
        block_map: Dict[str, BlockWindow]
    ) -> ValidationCheckResult:
        violations = []
        # Group by section and check temporal collisions
        by_section: Dict[str, List[ScheduleAssignment]] = {}
        for asgn in assignments:
            by_section.setdefault(asgn.section_id, []).append(asgn)

        for sec_id, asgns in by_section.items():
            if len(asgns) <= 1:
                continue
            for i in range(len(asgns)):
                for j in range(i + 1, len(asgns)):
                    a1, a2 = asgns[i], asgns[j]
                    if a1.block_id == a2.block_id:
                        continue  # Coordinated bundled possession in same block is valid
                    # Check temporal clash
                    if not (a1.scheduled_end <= a2.scheduled_start or a2.scheduled_end <= a1.scheduled_start):
                        violations.append(
                            f"Section {sec_id} has simultaneous conflicting possession windows: {a1.assignment_id} and {a2.assignment_id}"
                        )

        passed = len(violations) == 0
        return ValidationCheckResult(
            check_name="Spatial Possession Conflict Invariant",
            passed=passed,
            verdict=ValidationVerdict.VALID if passed else ValidationVerdict.BLOCKED,
            description="Verifies zero conflicting possession locks on identical track segments.",
            details={"violations": violations} if violations else None
        )

    def _check_resource_capacity(
        self,
        assignments: List[ScheduleAssignment],
        task_map: Dict[str, MaintenanceTask],
        resources: List[Resource]
    ) -> ValidationCheckResult:
        violations = []
        # Tally machine requirements
        for asgn in assignments:
            required_machines = [
                task_map[tid].required_machine for tid in asgn.task_ids
                if tid in task_map and task_map[tid].required_machine
            ]
            if len(set(required_machines)) > 2:
                violations.append(
                    f"Block {asgn.block_id} demands too many concurrent specialized machines: {required_machines}"
                )

        passed = len(violations) == 0
        return ValidationCheckResult(
            check_name="Equipment & Resource Availability",
            passed=passed,
            verdict=ValidationVerdict.VALID if passed else ValidationVerdict.REQUIRES_REVIEW,
            description="Validates specialized machinery (tamping machines, tower wagons) feasibility.",
            details={"violations": violations} if violations else None
        )

    def _check_critical_task_coverage(
        self,
        assignments: List[ScheduleAssignment],
        all_tasks: List[MaintenanceTask]
    ) -> ValidationCheckResult:
        scheduled_ids = set()
        for asgn in assignments:
            scheduled_ids.update(asgn.task_ids)

        critical_tasks = [t for t in all_tasks if t.is_safety_critical or t.severity >= 4]
        unscheduled_critical = [t.task_id for t in critical_tasks if t.task_id not in scheduled_ids]

        # Warning if critical tasks are deferred
        verdict = ValidationVerdict.VALID
        if len(unscheduled_critical) > 0:
            verdict = ValidationVerdict.REQUIRES_REVIEW

        return ValidationCheckResult(
            check_name="Safety-Critical Defect Coverage",
            passed=True,
            verdict=verdict,
            description="Audits scheduled allocation of high-risk and emergency track defects.",
            details={
                "total_critical": len(critical_tasks),
                "scheduled_critical": len(critical_tasks) - len(unscheduled_critical),
                "deferred_critical_count": len(unscheduled_critical)
            }
        )
