"""Block Candidate Generation Engine with granular feasibility diagnostics."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
import pandas as pd
from pydantic import BaseModel, Field

from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    CandidateAssignment,
    Department,
    ResourceType,
)
from src.train_impact.conflict_detector import TrainConflictReport
from src.train_impact.predict import TrainDelayPredictor

logger = logging.getLogger(__name__)


class CandidateSummary(BaseModel):
    """Summary metrics of the candidate generation phase."""
    total_pairs_evaluated: int = 0
    feasible_pairs_count: int = 0
    infeasible_pairs_count: int = 0
    infeasible_reasons_breakdown: Dict[str, int] = Field(default_factory=dict)


class CandidateGenerationEngine:
    """Evaluates task-block candidate compatibility prior to mathematical optimization."""

    def __init__(self, delay_predictor: Optional[TrainDelayPredictor] = None):
        self.delay_predictor = delay_predictor

    def generate_candidates(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        conflict_reports: Optional[Dict[str, TrainConflictReport]] = None,
        include_infeasible: bool = True,
    ) -> Tuple[List[CandidateAssignment], CandidateSummary]:
        """Generate and evaluate candidate assignments for all task-block pairings."""
        conflict_reports = conflict_reports or {}
        all_candidates: List[CandidateAssignment] = []
        summary = CandidateSummary()

        # Build fast lookup indexes
        blocks_by_section: Dict[str, List[BlockWindow]] = {}
        for b in blocks:
            blocks_by_section.setdefault(b.section_id, []).append(b)

        # Index resources by department and section
        resources_by_dept: Dict[Department, List[Resource]] = {}
        for r in resources:
            resources_by_dept.setdefault(r.department, []).append(r)

        for task in tasks:
            # Evaluate against blocks in same section
            relevant_blocks = blocks_by_section.get(task.section_id, [])
            
            # If checking all pairings for diagnostic completeness
            candidate_blocks = blocks if include_infeasible else relevant_blocks

            for block in candidate_blocks:
                summary.total_pairs_evaluated += 1
                reasons: List[str] = []
                is_feasible = True
                duration_feasible = True
                resource_feasible = True

                # 1. Section Compatibility
                if task.section_id != block.section_id:
                    is_feasible = False
                    reason = f"Section mismatch: Task requires {task.section_id}, block is on {block.section_id}"
                    reasons.append(reason)
                    summary.infeasible_reasons_breakdown["SECTION_MISMATCH"] = (
                        summary.infeasible_reasons_breakdown.get("SECTION_MISMATCH", 0) + 1
                    )

                # 2. Block Availability
                if not block.available:
                    is_feasible = False
                    reason = f"Block {block.block_id} is unavailable/closed"
                    reasons.append(reason)
                    summary.infeasible_reasons_breakdown["BLOCK_UNAVAILABLE"] = (
                        summary.infeasible_reasons_breakdown.get("BLOCK_UNAVAILABLE", 0) + 1
                    )

                # 3. Duration Feasibility
                if block.duration_hours < task.duration_hours:
                    is_feasible = False
                    duration_feasible = False
                    reason = (
                        f"Insufficient duration: Task needs {task.duration_hours}h, "
                        f"block duration is {block.duration_hours}h"
                    )
                    reasons.append(reason)
                    summary.infeasible_reasons_breakdown["INSUFFICIENT_DURATION"] = (
                        summary.infeasible_reasons_breakdown.get("INSUFFICIENT_DURATION", 0) + 1
                    )

                # 4. Mandatory Deadline Compliance
                if block.end_time > task.deadline:
                    is_feasible = False
                    reason = (
                        f"Deadline breach: Block ends at {block.end_time.strftime('%Y-%m-%d %H:%M')}, "
                        f"task deadline is {task.deadline.strftime('%Y-%m-%d %H:%M')}"
                    )
                    reasons.append(reason)
                    summary.infeasible_reasons_breakdown["DEADLINE_BREACH"] = (
                        summary.infeasible_reasons_breakdown.get("DEADLINE_BREACH", 0) + 1
                    )

                # 5. Resource Availability Feasibility
                res_ok, res_reason = self._check_resource_feasibility(task, block, resources_by_dept.get(task.department, []))
                if not res_ok:
                    is_feasible = False
                    resource_feasible = False
                    reasons.append(res_reason)
                    summary.infeasible_reasons_breakdown["RESOURCE_UNAVAILABLE"] = (
                        summary.infeasible_reasons_breakdown.get("RESOURCE_UNAVAILABLE", 0) + 1
                    )

                # 6. Train Conflict Impact
                impact = 0.0
                if block.block_id in conflict_reports:
                    impact = conflict_reports[block.block_id].impact_score

                if is_feasible:
                    summary.feasible_pairs_count += 1
                else:
                    summary.infeasible_pairs_count += 1

                candidate = CandidateAssignment(
                    task_id=task.task_id,
                    block_id=block.block_id,
                    section_id=task.section_id,
                    feasible=is_feasible,
                    reason_if_infeasible="; ".join(reasons) if reasons else None,
                    train_impact=impact,
                    resource_feasible=resource_feasible,
                    duration_feasible=duration_feasible,
                )

                if is_feasible or include_infeasible:
                    all_candidates.append(candidate)

        logger.info(
            f"Candidate generation complete: {summary.feasible_pairs_count} feasible pairs "
            f"({summary.infeasible_pairs_count} infeasible) from {summary.total_pairs_evaluated} combinations."
        )
        return all_candidates, summary

    def _check_resource_feasibility(
        self,
        task: MaintenanceTask,
        block: BlockWindow,
        dept_resources: List[Resource],
    ) -> Tuple[bool, str]:
        """Verify if adequate crew capacity and required machinery exist in that temporal window."""
        if not dept_resources:
            return False, f"No resources registered for department {task.department.value}"

        # 1. Crew check
        crews = [
            r for r in dept_resources
            if r.resource_type == ResourceType.CREW
            and r.available_from <= block.start_time
            and r.available_until >= block.end_time
            and (r.section_id is None or r.section_id == block.section_id)
        ]
        total_crew_capacity = sum(c.capacity for c in crews)
        if total_crew_capacity < task.required_workers:
            return False, (
                f"Insufficient crew capacity: Task needs {task.required_workers} workers, "
                f"available in window is {total_crew_capacity}"
            )

        # 2. Specialized Machinery check
        if task.required_machine:
            matching_machines = [
                r for r in dept_resources
                if r.resource_type in [ResourceType.MACHINE, ResourceType.TOWER_WAGON, ResourceType.TAMPING_MACHINE]
                and r.available_from <= block.start_time
                and r.available_until >= block.end_time
            ]
            if not matching_machines:
                return False, f"Required machine '{task.required_machine}' is unavailable during block window"

        return True, ""
