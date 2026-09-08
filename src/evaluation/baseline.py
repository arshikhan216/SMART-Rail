"""Baseline Comparison Planners (FCFS / Naive Manual and Greedy Priority) for benchmarking CP-SAT optimizer."""

from __future__ import annotations
from enum import Enum
import datetime as dt
import logging
import time
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.config import CONFIG
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    OptimizationResult,
    Department,
    ResourceType,
    Train,
    TrainMovement,
)
from src.coordination.coordinator import MultiDepartmentCoordinator
from src.train_impact.conflict_detector import TrainConflictDetector, TrainConflictReport
from src.block_planner.candidates import CandidateGenerationEngine
from src.block_planner.optimizer import BlockOptimizationSolver
from src.block_planner.constraints import ConstraintManager

logger = logging.getLogger(__name__)


class BaselinePlannerType(str, Enum):
    FCFS = "FCFS"                          # First-Come First-Served (Unweighted chronological)
    GREEDY_PRIORITY = "GREEDY_PRIORITY"    # Heuristic priority greedy allocation
    CP_SAT_OPTIMAL = "CP_SAT_OPTIMAL"      # Google OR-Tools exact CP-SAT optimizer


class BaselineComparisonRecord(BaseModel):
    """Performance evaluation metrics for a single planner."""
    planner_name: str
    planner_type: BaselinePlannerType
    tasks_scheduled: int = 0
    critical_tasks_scheduled: int = 0
    blocks_used: int = 0
    total_possession_hours: float = 0.0
    coordination_savings_hours: float = 0.0
    estimated_train_impact: float = 0.0
    asset_availability: float = 1.0
    solve_time_seconds: float = 0.0


class BenchmarkReport(BaseModel):
    """Comparative benchmarking report comparing CP-SAT with heuristic baselines."""
    dataset_name: str
    total_tasks: int
    total_blocks: int
    records: List[BaselineComparisonRecord] = Field(default_factory=list)
    coordination_savings_gain_vs_greedy_pct: float = 0.0
    train_impact_reduction_vs_fcfs_pct: float = 0.0
    summary: str = ""


class FCFSPlanner:
    """Naive First-Come First-Served manual dispatch baseline."""

    def __init__(self):
        self.coordinator = MultiDepartmentCoordinator()

    def solve(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        conflict_reports: Optional[Dict[str, TrainConflictReport]] = None,
    ) -> OptimizationResult:
        """Assign tasks sequentially in input arrival order without global bundling."""
        conflict_reports = conflict_reports or {}
        assigned_tasks_by_block: Dict[str, List[MaintenanceTask]] = {}
        unassigned_tasks: List[str] = []

        # Sort blocks chronologically
        sorted_blocks = sorted(blocks, key=lambda b: b.start_time)

        for task in tasks:
            assigned = False
            for block in sorted_blocks:
                if not block.available:
                    continue
                if block.section_id != task.section_id:
                    continue
                if block.end_time > task.deadline:
                    continue

                # Check current tasks in block
                existing_tasks = assigned_tasks_by_block.get(block.block_id, [])
                candidate_bundle = existing_tasks + [task]
                bundle_eval = self.coordinator.evaluate_bundle(candidate_bundle)

                if not bundle_eval.is_compatible:
                    continue
                if bundle_eval.coordinated_duration_hours > block.duration_hours:
                    continue

                # Feasible assignment found
                assigned_tasks_by_block.setdefault(block.block_id, []).append(task)
                assigned = True
                break

            if not assigned:
                unassigned_tasks.append(task.task_id)

        # Build ScheduleAssignments
        assignments: List[ScheduleAssignment] = []
        blocks_lookup = {b.block_id: b for b in blocks}
        total_savings = 0.0
        total_train_impact = 0.0

        for b_id, b_tasks in assigned_tasks_by_block.items():
            block = blocks_lookup[b_id]
            bundle = self.coordinator.evaluate_bundle(b_tasks)
            impact = conflict_reports.get(b_id, TrainConflictReport(
                block_id=b_id, section_id=block.section_id, block_start=block.start_time,
                block_end=block.end_time, duration_hours=block.duration_hours
            )).impact_score

            total_savings += bundle.saved_possession_hours
            total_train_impact += impact

            assignments.append(
                ScheduleAssignment(
                    assignment_id=f"FCFS-ASGN-{b_id}",
                    block_id=b_id,
                    task_ids=[t.task_id for t in b_tasks],
                    section_id=block.section_id,
                    departments=bundle.departments,
                    scheduled_start=block.start_time,
                    scheduled_end=block.start_time + dt.timedelta(hours=bundle.coordinated_duration_hours),
                    duration_hours=round(bundle.coordinated_duration_hours, 2),
                    expected_train_impact=round(impact, 2),
                    coordination_savings_hours=round(bundle.saved_possession_hours, 2),
                    explanation=f"FCFS assignment of {len(b_tasks)} tasks.",
                )
            )

        scheduled_count = sum(len(t_list) for t_list in assigned_tasks_by_block.values())
        critical_count = sum(
            1 for t_list in assigned_tasks_by_block.values() for t in t_list if t.is_safety_critical or t.urgency >= 4
        )

        return OptimizationResult(
            plan_id="FCFS-BASELINE-PLAN",
            status="FEASIBLE" if scheduled_count > 0 else "NO_SOLUTION",
            tasks_considered=len(tasks),
            tasks_scheduled=scheduled_count,
            critical_tasks_scheduled=critical_count,
            blocks_used=len(assignments),
            estimated_train_impact=round(total_train_impact, 2),
            coordination_savings_hours=round(total_savings, 2),
            asset_availability=round(scheduled_count / max(1, len(tasks)), 4),
            assignments=assignments,
            unassigned_tasks=unassigned_tasks,
        )


class GreedyPriorityPlanner:
    """Heuristic greedy priority allocation baseline."""

    def __init__(self):
        self.coordinator = MultiDepartmentCoordinator()

    def solve(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        conflict_reports: Optional[Dict[str, TrainConflictReport]] = None,
    ) -> OptimizationResult:
        """Assign tasks greedily ordered by priority score and train conflict minimization."""
        conflict_reports = conflict_reports or {}
        assigned_tasks_by_block: Dict[str, List[MaintenanceTask]] = {}
        unassigned_tasks: List[str] = []

        # Sort tasks descending by priority score and safety criticality
        sorted_tasks = sorted(
            tasks,
            key=lambda t: (t.is_safety_critical, t.priority_score or 0.0, t.urgency),
            reverse=True,
        )

        for task in sorted_tasks:
            assigned = False
            # Filter feasible candidate blocks
            candidate_blocks = [
                b for b in blocks
                if b.available and b.section_id == task.section_id and b.end_time <= task.deadline
            ]
            # Sort candidate blocks by train impact score ascending, then by duration fit
            candidate_blocks.sort(
                key=lambda b: (conflict_reports.get(b.block_id, None) and conflict_reports[b.block_id].impact_score or 0.0, b.duration_hours)
            )

            for block in candidate_blocks:
                existing_tasks = assigned_tasks_by_block.get(block.block_id, [])
                candidate_bundle = existing_tasks + [task]
                bundle_eval = self.coordinator.evaluate_bundle(candidate_bundle)

                if not bundle_eval.is_compatible:
                    continue
                if bundle_eval.coordinated_duration_hours > block.duration_hours:
                    continue

                assigned_tasks_by_block.setdefault(block.block_id, []).append(task)
                assigned = True
                break

            if not assigned:
                unassigned_tasks.append(task.task_id)

        assignments: List[ScheduleAssignment] = []
        blocks_lookup = {b.block_id: b for b in blocks}
        total_savings = 0.0
        total_train_impact = 0.0

        for b_id, b_tasks in assigned_tasks_by_block.items():
            block = blocks_lookup[b_id]
            bundle = self.coordinator.evaluate_bundle(b_tasks)
            impact = conflict_reports.get(b_id, TrainConflictReport(
                block_id=b_id, section_id=block.section_id, block_start=block.start_time,
                block_end=block.end_time, duration_hours=block.duration_hours
            )).impact_score

            total_savings += bundle.saved_possession_hours
            total_train_impact += impact

            assignments.append(
                ScheduleAssignment(
                    assignment_id=f"GREEDY-ASGN-{b_id}",
                    block_id=b_id,
                    task_ids=[t.task_id for t in b_tasks],
                    section_id=block.section_id,
                    departments=bundle.departments,
                    scheduled_start=block.start_time,
                    scheduled_end=block.start_time + dt.timedelta(hours=bundle.coordinated_duration_hours),
                    duration_hours=round(bundle.coordinated_duration_hours, 2),
                    expected_train_impact=round(impact, 2),
                    coordination_savings_hours=round(bundle.saved_possession_hours, 2),
                    explanation=f"Greedy assignment of {len(b_tasks)} priority tasks.",
                )
            )

        scheduled_count = sum(len(t_list) for t_list in assigned_tasks_by_block.values())
        critical_count = sum(
            1 for t_list in assigned_tasks_by_block.values() for t in t_list if t.is_safety_critical or t.urgency >= 4
        )

        return OptimizationResult(
            plan_id="GREEDY-BASELINE-PLAN",
            status="FEASIBLE" if scheduled_count > 0 else "NO_SOLUTION",
            tasks_considered=len(tasks),
            tasks_scheduled=scheduled_count,
            critical_tasks_scheduled=critical_count,
            blocks_used=len(assignments),
            estimated_train_impact=round(total_train_impact, 2),
            coordination_savings_hours=round(total_savings, 2),
            asset_availability=round(scheduled_count / max(1, len(tasks)), 4),
            assignments=assignments,
            unassigned_tasks=unassigned_tasks,
        )


class BaselineComparator:
    """Benchmarking suite evaluating CP-SAT against FCFS and Greedy Priority baselines."""

    def __init__(self):
        self.fcfs = FCFSPlanner()
        self.greedy = GreedyPriorityPlanner()
        self.cpsat = BlockOptimizationSolver()
        self.candidate_engine = CandidateGenerationEngine()
        self.conflict_detector = TrainConflictDetector()
        self.constraint_manager = ConstraintManager()

    def compare(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        train_movements: Optional[List[TrainMovement]] = None,
        trains: Optional[List[Train]] = None,
        dataset_name: str = "IndianRailways-Bench-01",
    ) -> BenchmarkReport:
        """Run all three planners on the exact same dataset and compute comparative gains."""
        conflict_reports: Dict[str, TrainConflictReport] = {}
        if train_movements:
            train_dict = {t.train_id: t for t in (trains or [])}
            conflict_reports = self.conflict_detector.batch_detect_conflicts(blocks, train_movements, train_dict)

        # 1. Evaluate FCFS
        t0 = time.perf_counter()
        fcfs_res = self.fcfs.solve(tasks, blocks, resources, conflict_reports)
        fcfs_time = time.perf_counter() - t0

        fcfs_record = BaselineComparisonRecord(
            planner_name="First-Come First-Served (FCFS)",
            planner_type=BaselinePlannerType.FCFS,
            tasks_scheduled=fcfs_res.tasks_scheduled,
            critical_tasks_scheduled=fcfs_res.critical_tasks_scheduled,
            blocks_used=fcfs_res.blocks_used,
            total_possession_hours=sum(a.duration_hours for a in fcfs_res.assignments),
            coordination_savings_hours=fcfs_res.coordination_savings_hours,
            estimated_train_impact=fcfs_res.estimated_train_impact,
            asset_availability=fcfs_res.asset_availability,
            solve_time_seconds=round(fcfs_time, 4),
        )

        # 2. Evaluate Greedy Priority
        t0 = time.perf_counter()
        greedy_res = self.greedy.solve(tasks, blocks, resources, conflict_reports)
        greedy_time = time.perf_counter() - t0

        greedy_record = BaselineComparisonRecord(
            planner_name="Greedy Priority Heuristic",
            planner_type=BaselinePlannerType.GREEDY_PRIORITY,
            tasks_scheduled=greedy_res.tasks_scheduled,
            critical_tasks_scheduled=greedy_res.critical_tasks_scheduled,
            blocks_used=greedy_res.blocks_used,
            total_possession_hours=sum(a.duration_hours for a in greedy_res.assignments),
            coordination_savings_hours=greedy_res.coordination_savings_hours,
            estimated_train_impact=greedy_res.estimated_train_impact,
            asset_availability=greedy_res.asset_availability,
            solve_time_seconds=round(greedy_time, 4),
        )

        # 3. Evaluate CP-SAT Optimal
        candidates, _ = self.candidate_engine.generate_candidates(tasks, blocks, resources, conflict_reports)
        t0 = time.perf_counter()
        cpsat_res = self.cpsat.solve(tasks, blocks, resources, candidates, conflict_reports)
        cpsat_time = time.perf_counter() - t0

        cpsat_record = BaselineComparisonRecord(
            planner_name="CP-SAT Integer Optimizer (Proposed)",
            planner_type=BaselinePlannerType.CP_SAT_OPTIMAL,
            tasks_scheduled=cpsat_res.tasks_scheduled,
            critical_tasks_scheduled=cpsat_res.critical_tasks_scheduled,
            blocks_used=cpsat_res.blocks_used,
            total_possession_hours=sum(a.duration_hours for a in cpsat_res.assignments),
            coordination_savings_hours=cpsat_res.coordination_savings_hours,
            estimated_train_impact=cpsat_res.estimated_train_impact,
            asset_availability=cpsat_res.asset_availability,
            solve_time_seconds=round(cpsat_time, 4),
        )

        # Calculate percentage improvements
        coord_gain = 0.0
        if greedy_record.coordination_savings_hours > 0:
            coord_gain = round(
                ((cpsat_record.coordination_savings_hours - greedy_record.coordination_savings_hours)
                 / greedy_record.coordination_savings_hours) * 100, 2
            )
        elif cpsat_record.coordination_savings_hours > 0:
            coord_gain = 100.0

        train_impact_reduction = 0.0
        if fcfs_record.estimated_train_impact > 0:
            train_impact_reduction = round(
                ((fcfs_record.estimated_train_impact - cpsat_record.estimated_train_impact)
                 / fcfs_record.estimated_train_impact) * 100, 2
            )

        summary = (
            f"CP-SAT achieved {cpsat_record.tasks_scheduled}/{len(tasks)} scheduled tasks "
            f"with {cpsat_record.coordination_savings_hours}h saved via multi-department coordination "
            f"({coord_gain}% gain over Greedy). Solve runtime: {cpsat_record.solve_time_seconds}s."
        )

        return BenchmarkReport(
            dataset_name=dataset_name,
            total_tasks=len(tasks),
            total_blocks=len(blocks),
            records=[fcfs_record, greedy_record, cpsat_record],
            coordination_savings_gain_vs_greedy_pct=coord_gain,
            train_impact_reduction_vs_fcfs_pct=train_impact_reduction,
            summary=summary,
        )
