"""Weekly Rolling Block Planning Engine for Indian Railways maintenance operations."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.config import CONFIG
from src.exceptions import InfeasibleScheduleError, PlanningError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    OptimizationResult,
    Department,
    Train,
    TrainMovement,
)
from src.train_impact.conflict_detector import TrainConflictDetector, TrainConflictReport
from src.block_planner.candidates import CandidateGenerationEngine
from src.block_planner.optimizer import BlockOptimizationSolver
from src.block_planner.constraints import ConstraintManager, ConstraintAuditRecord

logger = logging.getLogger(__name__)


class DailyPlan(BaseModel):
    """Corridor maintenance schedule and performance metrics for a single calendar day."""
    date: dt.date
    day_name: str
    assignments: List[ScheduleAssignment] = Field(default_factory=list)
    tasks_scheduled: int = 0
    blocks_used: int = 0
    total_possession_hours: float = 0.0
    coordination_savings_hours: float = 0.0
    estimated_train_impact: float = 0.0
    department_hours: Dict[Department, float] = Field(default_factory=dict)
    is_feasibility_audited: bool = True


class DepartmentWeeklySummary(BaseModel):
    """Aggregate weekly maintenance performance summary for a railway department."""
    department: Department
    tasks_scheduled: int = 0
    total_hours: float = 0.0
    critical_tasks_scheduled: int = 0


class WeeklyPlan(BaseModel):
    """Comprehensive 7-day rolling maintenance block plan with departmental allocations."""
    plan_id: str
    week_start_date: dt.date
    week_end_date: dt.date
    daily_plans: List[DailyPlan] = Field(default_factory=list)
    total_tasks_considered: int = 0
    total_tasks_scheduled: int = 0
    total_unassigned_tasks: List[str] = Field(default_factory=list)
    total_blocks_used: int = 0
    total_possession_hours: float = 0.0
    total_coordination_savings_hours: float = 0.0
    overall_asset_availability: float = 1.0
    department_summaries: Dict[Department, DepartmentWeeklySummary] = Field(default_factory=dict)
    audit_records: List[ConstraintAuditRecord] = Field(default_factory=list)
    optimization_status: str = "OPTIMAL"
    warnings: List[str] = Field(default_factory=list)


class WeeklyPlanningEngine:
    """7-Day rolling horizon block planning and departmental coordination engine."""

    def __init__(
        self,
        optimizer: Optional[BlockOptimizationSolver] = None,
        candidate_engine: Optional[CandidateGenerationEngine] = None,
        constraint_manager: Optional[ConstraintManager] = None,
        conflict_detector: Optional[TrainConflictDetector] = None,
    ):
        self.optimizer = optimizer or BlockOptimizationSolver()
        self.candidate_engine = candidate_engine or CandidateGenerationEngine()
        self.constraint_manager = constraint_manager or ConstraintManager()
        self.conflict_detector = conflict_detector or TrainConflictDetector()

    def generate_weekly_plan(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        train_movements: Optional[List[TrainMovement]] = None,
        trains: Optional[List[Train]] = None,
        week_start_date: Optional[dt.date] = None,
        plan_id: Optional[str] = None,
        strict_audit: bool = True,
    ) -> WeeklyPlan:
        """Generate an optimal 7-day multi-department rolling block schedule."""
        if not blocks and not tasks:
            raise PlanningError("Cannot generate weekly plan with empty tasks and blocks.")

        # Determine 7-day window
        if week_start_date is None:
            if blocks:
                week_start_date = min(b.date for b in blocks)
            elif tasks:
                week_start_date = min(t.deadline.date() for t in tasks)
            else:
                week_start_date = dt.date.today()

        week_end_date = week_start_date + dt.timedelta(days=6)
        plan_id = plan_id or f"WEEKLY-PLAN-{week_start_date.strftime('%Y%m%d')}"

        logger.info("Generating weekly plan %s for horizon %s to %s", plan_id, week_start_date, week_end_date)

        # Filter blocks within the 7-day horizon
        horizon_blocks = [
            b for b in blocks if week_start_date <= b.date <= week_end_date and b.available
        ]

        # Filter tasks relevant for this horizon (deadline within or after week_start_date)
        horizon_tasks = [
            t for t in tasks if t.deadline.date() >= week_start_date
        ]

        # Step 1: Detect train conflicts across horizon blocks
        conflict_reports: Dict[str, TrainConflictReport] = {}
        if train_movements:
            train_dict = {t.train_id: t for t in (trains or [])}
            conflict_reports = self.conflict_detector.batch_detect_conflicts(
                horizon_blocks, train_movements, train_dict
            )

        # Step 2: Generate candidate assignments
        candidates, cand_summary = self.candidate_engine.generate_candidates(
            horizon_tasks, horizon_blocks, resources, conflict_reports, include_infeasible=False
        )

        logger.info(
            "Candidate generation complete: %d feasible pairs out of %d evaluated",
            cand_summary.feasible_pairs_count,
            cand_summary.total_pairs_evaluated,
        )

        # Step 3: Solve global CP-SAT model over the 7-day horizon
        opt_result: OptimizationResult = self.optimizer.solve(
            tasks=horizon_tasks,
            blocks=horizon_blocks,
            resources=resources,
            feasible_candidates=candidates,
            conflict_reports=conflict_reports,
            plan_id=plan_id,
        )

        # Step 4: Audit hard & soft constraints
        tasks_lookup = {t.task_id: t for t in horizon_tasks}
        blocks_lookup = {b.block_id: b for b in horizon_blocks}
        audit_records = self.constraint_manager.audit_schedule(
            assignments=opt_result.assignments,
            tasks_lookup=tasks_lookup,
            blocks_lookup=blocks_lookup,
            resources=resources,
            strict_fail_on_hard_violation=strict_audit,
        )

        # Step 5: Construct day-by-day schedules (7 days D0..D6)
        assignments_by_date: Dict[dt.date, List[ScheduleAssignment]] = {}
        for asgn in opt_result.assignments:
            block = blocks_lookup.get(asgn.block_id)
            if block:
                assignments_by_date.setdefault(block.date, []).append(asgn)

        daily_plans: List[DailyPlan] = []
        for i in range(7):
            curr_date = week_start_date + dt.timedelta(days=i)
            day_asgns = assignments_by_date.get(curr_date, [])

            # Aggregate daily department hours
            dept_hours: Dict[Department, float] = {d: 0.0 for d in Department}
            day_tasks_count = 0
            day_possession_hours = 0.0
            day_savings_hours = 0.0
            day_impact = 0.0

            for asgn in day_asgns:
                day_tasks_count += len(asgn.task_ids)
                day_possession_hours += asgn.duration_hours
                day_savings_hours += asgn.coordination_savings_hours
                day_impact += asgn.expected_train_impact
                for dept in asgn.departments:
                    dept_hours[dept] = round(dept_hours.get(dept, 0.0) + asgn.duration_hours, 2)

            daily_plans.append(
                DailyPlan(
                    date=curr_date,
                    day_name=curr_date.strftime("%A"),
                    assignments=day_asgns,
                    tasks_scheduled=day_tasks_count,
                    blocks_used=len(day_asgns),
                    total_possession_hours=round(day_possession_hours, 2),
                    coordination_savings_hours=round(day_savings_hours, 2),
                    estimated_train_impact=round(day_impact, 2),
                    department_hours=dept_hours,
                    is_feasibility_audited=True,
                )
            )

        # Step 6: Aggregate Department Weekly Summaries
        dept_summaries: Dict[Department, DepartmentWeeklySummary] = {
            d: DepartmentWeeklySummary(department=d) for d in Department
        }
        for asgn in opt_result.assignments:
            for t_id in asgn.task_ids:
                task = tasks_lookup.get(t_id)
                if task:
                    summ = dept_summaries[task.department]
                    summ.tasks_scheduled += 1
                    summ.total_hours = round(summ.total_hours + task.duration_hours, 2)
                    if task.is_safety_critical or task.urgency >= 4:
                        summ.critical_tasks_scheduled += 1

        total_possession_hours = sum(dp.total_possession_hours for dp in daily_plans)

        weekly_plan = WeeklyPlan(
            plan_id=plan_id,
            week_start_date=week_start_date,
            week_end_date=week_end_date,
            daily_plans=daily_plans,
            total_tasks_considered=len(horizon_tasks),
            total_tasks_scheduled=opt_result.tasks_scheduled,
            total_unassigned_tasks=opt_result.unassigned_tasks,
            total_blocks_used=opt_result.blocks_used,
            total_possession_hours=round(total_possession_hours, 2),
            total_coordination_savings_hours=round(opt_result.coordination_savings_hours, 2),
            overall_asset_availability=opt_result.asset_availability,
            department_summaries=dept_summaries,
            audit_records=audit_records,
            optimization_status=opt_result.status,
            warnings=opt_result.warnings,
        )

        return weekly_plan
