"""Google OR-Tools CP-SAT mathematical optimization engine for railway block planning."""

from __future__ import annotations
import datetime as dt
import itertools
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from ortools.sat.python import cp_model
import numpy as np
import pandas as pd

from src.config import CONFIG, OptimizationConfig
from src.exceptions import OptimizationError
from src.schemas import (
    MaintenanceTask,
    BlockWindow,
    Resource,
    CandidateAssignment,
    ScheduleAssignment,
    OptimizationResult,
    Department,
    ResourceType,
)
from src.coordination.coordinator import MultiDepartmentCoordinator, TaskCoordinationBundle
from src.train_impact.conflict_detector import TrainConflictReport
from src.block_planner.objective import OptimizationObjectiveBuilder

logger = logging.getLogger(__name__)


class BlockOptimizationSolver:
    """Core CP-SAT mathematical optimizer for railway maintenance block scheduling."""

    def __init__(self, config: Optional[OptimizationConfig] = None):
        self.config = config or CONFIG.optimization
        self.coordinator = MultiDepartmentCoordinator()

    def solve(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        feasible_candidates: List[CandidateAssignment],
        conflict_reports: Optional[Dict[str, TrainConflictReport]] = None,
        plan_id: Optional[str] = None,
    ) -> OptimizationResult:
        """Formulate and solve integer linear constraint satisfaction problem."""
        if plan_id is None:
            plan_id = f"PLAN-{dt.datetime.now().strftime('%Y%m%d-%H%M%S')}"

        conflict_reports = conflict_reports or {}

        if not tasks:
            return OptimizationResult(
                plan_id=plan_id,
                status="OPTIMAL",
                tasks_considered=0,
                tasks_scheduled=0,
                warnings=["No maintenance tasks provided for scheduling."],
            )

        if not blocks:
            return OptimizationResult(
                plan_id=plan_id,
                status="INFEASIBLE",
                tasks_considered=len(tasks),
                tasks_scheduled=0,
                unassigned_tasks=[t.task_id for t in tasks],
                warnings=["No available block windows provided for scheduling."],
            )

        # Decompose multi-section problem into independent section solves for O(S) scalability
        sections = sorted(list(set(b.section_id for b in blocks)))
        if len(sections) > 1:
            time_per_section = max(0.2, min(1.0, float(self.config.solver_max_time_seconds) / len(sections)))
            sub_results: List[OptimizationResult] = []
            for sec in sections:
                sec_tasks = [t for t in tasks if t.section_id == sec]
                sec_blocks = [b for b in blocks if b.section_id == sec]
                sec_resources = [r for r in resources if r.section_id is None or r.section_id == sec]
                sec_block_ids = {b.block_id for b in sec_blocks}
                sec_candidates = [c for c in feasible_candidates if c.block_id in sec_block_ids]
                sec_conflicts = {b_id: r for b_id, r in conflict_reports.items() if b_id in sec_block_ids}

                sec_res = self._solve_single_section(
                    tasks=sec_tasks,
                    blocks=sec_blocks,
                    resources=sec_resources,
                    feasible_candidates=sec_candidates,
                    conflict_reports=sec_conflicts,
                    plan_id=f"{plan_id}-{sec}",
                    max_time_override=time_per_section,
                )
                sub_results.append(sec_res)

            all_assignments: List[ScheduleAssignment] = []
            all_unassigned: List[str] = []
            total_obj = 0.0
            total_tasks_scheduled = 0
            total_critical_scheduled = 0
            total_train_conflicts = 0
            total_train_impact = 0.0
            total_coordination_savings = 0.0
            all_warnings: List[str] = []
            overall_status = "OPTIMAL"

            for sr in sub_results:
                all_assignments.extend(sr.assignments)
                all_unassigned.extend(sr.unassigned_tasks)
                total_obj += sr.objective_value
                total_tasks_scheduled += sr.tasks_scheduled
                total_critical_scheduled += sr.critical_tasks_scheduled
                total_train_conflicts += sr.train_conflicts
                total_train_impact += sr.estimated_train_impact
                total_coordination_savings += sr.coordination_savings_hours
                all_warnings.extend(sr.warnings)
                if sr.status == "FEASIBLE" and overall_status == "OPTIMAL":
                    overall_status = "FEASIBLE"
                elif sr.status not in ("OPTIMAL", "FEASIBLE"):
                    overall_status = sr.status

            total_possession_downtime = sum(a.duration_hours for a in all_assignments)
            observation_hours = len(blocks) * 24.0 if blocks else 24.0
            availability = max(0.0, min(1.0, 1.0 - (total_possession_downtime / max(1.0, observation_hours))))

            return OptimizationResult(
                plan_id=plan_id,
                status=overall_status,
                objective_value=round(total_obj, 2),
                tasks_considered=len(tasks),
                tasks_scheduled=total_tasks_scheduled,
                critical_tasks_scheduled=total_critical_scheduled,
                blocks_used=len(all_assignments),
                train_conflicts=total_train_conflicts,
                estimated_train_impact=round(total_train_impact, 2),
                coordination_savings_hours=round(total_coordination_savings, 2),
                asset_availability=round(availability, 4),
                assignments=all_assignments,
                unassigned_tasks=all_unassigned,
                warnings=all_warnings,
            )

        return self._solve_single_section(
            tasks=tasks,
            blocks=blocks,
            resources=resources,
            feasible_candidates=feasible_candidates,
            conflict_reports=conflict_reports,
            plan_id=plan_id,
        )

    def _solve_single_section(
        self,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        resources: List[Resource],
        feasible_candidates: List[CandidateAssignment],
        conflict_reports: Optional[Dict[str, TrainConflictReport]] = None,
        plan_id: Optional[str] = None,
        max_time_override: Optional[float] = None,
    ) -> OptimizationResult:
        """Formulate and solve CP-SAT model for a single section network."""
        conflict_reports = conflict_reports or {}

        if not tasks:
            return OptimizationResult(
                plan_id=plan_id or "PLAN",
                status="OPTIMAL",
                tasks_considered=0,
                tasks_scheduled=0,
                warnings=["No maintenance tasks provided for scheduling."],
            )

        if not blocks:
            return OptimizationResult(
                plan_id=plan_id or "PLAN",
                status="INFEASIBLE",
                tasks_considered=len(tasks),
                tasks_scheduled=0,
                unassigned_tasks=[t.task_id for t in tasks],
                warnings=["No available block windows provided for scheduling."],
            )

        # Build Lookups
        task_map: Dict[str, MaintenanceTask] = {t.task_id: t for t in tasks}
        block_map: Dict[str, BlockWindow] = {b.block_id: b for b in blocks}
        
        # Precompute resource capacities per (department, block)
        crew_capacity_map: Dict[Tuple[Department, str], int] = {}
        machine_capacity_map: Dict[Tuple[str, str], int] = {}

        for b in blocks:
            for dept in Department:
                # Sum crew capacity available during this block window
                avail_crews = [
                    r for r in resources
                    if r.department == dept
                    and r.resource_type == ResourceType.CREW
                    and r.available_from <= b.start_time
                    and r.available_until >= b.end_time
                    and (r.section_id is None or r.section_id == b.section_id)
                ]
                crew_capacity_map[(dept, b.block_id)] = sum(c.capacity for c in avail_crews)

            # Machines
            avail_machines = [
                r for r in resources
                if r.resource_type in [ResourceType.MACHINE, ResourceType.TOWER_WAGON, ResourceType.TAMPING_MACHINE]
                and r.available_from <= b.start_time
                and r.available_until >= b.end_time
            ]
            for m in avail_machines:
                machine_capacity_map[(m.resource_id, b.block_id)] = m.capacity

        # Initialize CP-SAT Model
        model = cp_model.CpModel()

        # -------------------------------------------------------------
        # 1. Decision Variables (Sparse Formulation)
        # -------------------------------------------------------------
        # x[t_id, b_id] == 1 if task t is assigned to block b
        x: Dict[Tuple[str, str], cp_model.IntVar] = {}
        tasks_in_block: Dict[str, List[str]] = {b.block_id: [] for b in blocks}
        blocks_for_task: Dict[str, List[str]] = {t.task_id: [] for t in tasks}

        for cand in feasible_candidates:
            if not cand.feasible:
                continue
            t_id = cand.task_id
            b_id = cand.block_id
            if t_id in task_map and b_id in block_map:
                var = model.NewBoolVar(f"x_{t_id}_{b_id}")
                x[(t_id, b_id)] = var
                tasks_in_block[b_id].append(t_id)
                blocks_for_task[t_id].append(b_id)

        # Unserved indicator u[t_id] == 1 if task t is not assigned
        u: Dict[str, cp_model.IntVar] = {}
        for t in tasks:
            u[t.task_id] = model.NewBoolVar(f"u_{t.task_id}")

        # Block active indicator y[b_id] == 1 if block b is used
        y: Dict[str, cp_model.IntVar] = {}
        for b in blocks:
            y[b.block_id] = model.NewBoolVar(f"y_{b.block_id}")

        # Coordination pair variables c[t1, t2, b] == 1 if both t1 and t2 in block b
        c_pair: Dict[Tuple[str, str, str], cp_model.IntVar] = {}

        # -------------------------------------------------------------
        # 2. Hard Constraints
        # -------------------------------------------------------------
        # (C1) Single Assignment & Unserved Definition: sum_b x[t, b] + u[t] == 1
        for t in tasks:
            assigned_vars = [x[(t.task_id, b_id)] for b_id in blocks_for_task[t.task_id]]
            model.Add(sum(assigned_vars) + u[t.task_id] == 1)

        # (C2) Block Active Constraint: y[b] >= x[t, b]
        for b_id, t_ids in tasks_in_block.items():
            for t_id in t_ids:
                model.Add(y[b_id] >= x[(t_id, b_id)])
            # If no tasks assigned, block is inactive
            if t_ids:
                model.Add(sum(x[(t_id, b_id)] for t_id in t_ids) >= y[b_id])

        # (C3) Block Duration & Coordination Savings Constraint (scaled to integer tenths of hours)
        # sum_t (dur(t) * x) - sum_(t1,t2) (saving * c) <= block_dur * y
        SCALE = 10  # Scale float hours by 10 to keep exact integer arithmetic in CP-SAT

        for b in blocks:
            b_id = b.block_id
            assigned_t_ids = tasks_in_block[b_id]
            if not assigned_t_ids:
                continue

            # (C0) Max concurrent tasks per block constraint
            max_tasks = getattr(CONFIG.coordination, "max_tasks_per_block", 3)
            model.Add(sum(x[(t_id, b_id)] for t_id in assigned_t_ids) <= max_tasks * y[b_id])

            # If a task's duration + buffer exceeds block duration, it cannot be bundled with any other task in this block
            buffer_hrs = getattr(CONFIG.coordination, "safety_buffer_minutes", 15) / 60.0
            for t_id in assigned_t_ids:
                if task_map[t_id].duration_hours + buffer_hrs > b.duration_hours + 1e-3:
                    for other_id in assigned_t_ids:
                        if other_id != t_id:
                            model.Add(x[(t_id, b_id)] + x[(other_id, b_id)] <= 1)

            dur_terms = []
            for t_id in assigned_t_ids:
                task = task_map[t_id]
                dur_int = int(round(task.duration_hours * SCALE))
                dur_terms.append(dur_int * x[(t_id, b_id)])

            # Evaluate coordination opportunities within this block
            coord_saving_terms = []
            block_c_vars = []
            if len(assigned_t_ids) >= 2:
                # Top priority candidate tasks per block for bundling linearization
                sorted_assigned = sorted(
                    assigned_t_ids,
                    key=lambda tid: (task_map[tid].priority_score or 50.0, task_map[tid].is_safety_critical),
                    reverse=True,
                )
                eval_candidates = sorted_assigned[:min(len(sorted_assigned), 30)]

                for t1_id, t2_id in itertools.combinations(eval_candidates, 2):
                    t1 = task_map[t1_id]
                    t2 = task_map[t2_id]
                    if t1.department == t2.department:
                        continue

                    is_compat, _ = self.coordinator.check_pairwise_compatibility(t1, t2)
                    if is_compat:
                        _, _, saving_hrs = self.coordinator.compute_bundle_duration([t1, t2])
                        if saving_hrs > 0:
                            c_var = model.NewBoolVar(f"coord_{t1_id}_{t2_id}_{b_id}")
                            c_pair[(t1_id, t2_id, b_id)] = c_var
                            block_c_vars.append(c_var)
                            # Linearization of c == x1 AND x2
                            model.Add(c_var <= x[(t1_id, b_id)])
                            model.Add(c_var <= x[(t2_id, b_id)])
                            model.Add(c_var >= x[(t1_id, b_id)] + x[(t2_id, b_id)] - 1)

                            saving_int = int(round(saving_hrs * SCALE))
                            coord_saving_terms.append(saving_int * c_var)
                    else:
                        # Safety Conflict (Mutually Exclusive work types): x1 + x2 <= 1
                        model.Add(x[(t1_id, b_id)] + x[(t2_id, b_id)] <= 1)

            if block_c_vars:
                # Valid inequality: at most max_tasks*(max_tasks-1)/2 pairs in one block
                model.Add(sum(block_c_vars) <= 3 * y[b_id])

            block_dur_int = int(round(b.duration_hours * SCALE))
            model.Add(sum(dur_terms) - sum(coord_saving_terms) <= block_dur_int * y[b_id])

        # (C4) Department Crew Capacity Constraints per Block
        for b in blocks:
            b_id = b.block_id
            for dept in Department:
                dept_tasks_in_block = [
                    t_id for t_id in tasks_in_block[b_id]
                    if task_map[t_id].department == dept
                ]
                if dept_tasks_in_block:
                    crew_cap = crew_capacity_map.get((dept, b_id), 0)
                    model.Add(
                        sum(task_map[t_id].required_workers * x[(t_id, b_id)] for t_id in dept_tasks_in_block)
                        <= crew_cap * y[b_id]
                    )

        # -------------------------------------------------------------
        # 3. Objective Function Formulation (via ObjectiveBuilder)
        # -------------------------------------------------------------
        obj_builder = OptimizationObjectiveBuilder(weights=self.config.weights)
        obj_builder.build_objective(
            model=model,
            tasks=tasks,
            blocks=blocks,
            x=x,
            u=u,
            y=y,
            c_pair=c_pair,
            blocks_for_task=blocks_for_task,
            conflict_reports=conflict_reports,
            task_map=task_map,
        )

        # -------------------------------------------------------------
        # 4. Solver Execution
        # -------------------------------------------------------------
        solver = cp_model.CpSolver()
        time_limit = float(max_time_override) if max_time_override is not None else float(self.config.solver_max_time_seconds)
        solver.parameters.max_time_in_seconds = time_limit
        solver.parameters.num_search_workers = int(self.config.num_workers)
        solver.parameters.relative_gap_limit = float(getattr(self.config, "relative_gap_limit", 0.01))
        solver.parameters.log_search_progress = bool(getattr(self.config, "log_search_progress", False))


        logger.info(f"Starting CP-SAT solver (MaxTime: {self.config.solver_max_time_seconds}s, Workers: {self.config.num_workers})...")
        solve_status = solver.Solve(model)
        status_name = solver.StatusName(solve_status)
        logger.info(f"CP-SAT solver finished with status: {status_name} (Objective: {solver.ObjectiveValue():.2f})")

        if solve_status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            return OptimizationResult(
                plan_id=plan_id,
                status=status_name,
                tasks_considered=len(tasks),
                tasks_scheduled=0,
                unassigned_tasks=[t.task_id for t in tasks],
                warnings=[f"CP-SAT solver failed to find a feasible solution. Status: {status_name}"],
            )

        # -------------------------------------------------------------
        # 5. Extract Schedule Assignments & Metrics
        # -------------------------------------------------------------
        assignments: List[ScheduleAssignment] = []
        scheduled_task_ids: Set[str] = set()
        critical_scheduled = 0
        total_train_impact = 0.0
        total_coordination_savings = 0.0
        total_train_conflicts = 0

        asgn_idx = 1
        for b in blocks:
            b_id = b.block_id
            if solver.Value(y[b_id]) == 1:
                assigned_to_b = [
                    t_id for t_id in tasks_in_block[b_id]
                    if solver.Value(x[(t_id, b_id)]) == 1
                ]
                if assigned_to_b:
                    b_tasks = [task_map[t_id] for t_id in assigned_to_b]
                    departments = list(set(t.department for t in b_tasks))
                    combined_priority = sum(t.priority_score or 50.0 for t in b_tasks)
                    
                    # Savings
                    bundle = self.coordinator.evaluate_bundle(b_tasks)
                    total_coordination_savings += bundle.saved_possession_hours

                    # Train impact
                    rep = conflict_reports.get(b_id)
                    b_impact = rep.impact_score if rep else 0.0
                    b_conflicts = rep.total_conflicting_trains if rep else 0
                    total_train_impact += b_impact
                    total_train_conflicts += b_conflicts

                    scheduled_task_ids.update(assigned_to_b)
                    for t in b_tasks:
                        if t.is_safety_critical:
                            critical_scheduled += 1

                    explanation = (
                        f"Block {b_id} on {b.section_id} ({b.start_time.strftime('%H:%M')}-{b.end_time.strftime('%H:%M')}): "
                        f"Assigned {len(assigned_to_b)} tasks across {[d.value for d in departments]}. "
                        f"Total Priority: {combined_priority:.1f}, Train Impact: {b_impact:.1f}, "
                        f"Coordination Savings: {bundle.saved_possession_hours:.1f}h."
                    )

                    assignments.append(ScheduleAssignment(
                        assignment_id=f"ASGN-{asgn_idx:04d}",
                        block_id=b_id,
                        task_ids=assigned_to_b,
                        section_id=b.section_id,
                        departments=departments,
                        scheduled_start=b.start_time,
                        scheduled_end=b.end_time,
                        duration_hours=bundle.coordinated_duration_hours,
                        expected_train_impact=b_impact,
                        combined_priority_score=round(combined_priority, 2),
                        coordination_savings_hours=bundle.saved_possession_hours,
                        explanation=explanation,
                    ))
                    asgn_idx += 1

        unassigned = [t.task_id for t in tasks if t.task_id not in scheduled_task_ids]

        # Asset Availability Proxy (1 - Possession Downtime / Total Horizon Capacity)
        total_possession_downtime = sum(a.duration_hours for a in assignments)
        observation_hours = len(blocks) * 24.0 if blocks else 24.0
        availability = max(0.0, min(1.0, 1.0 - (total_possession_downtime / max(1.0, observation_hours))))

        return OptimizationResult(
            plan_id=plan_id,
            status=status_name,
            objective_value=round(float(solver.ObjectiveValue()), 2),
            tasks_considered=len(tasks),
            tasks_scheduled=len(scheduled_task_ids),
            critical_tasks_scheduled=critical_scheduled,
            blocks_used=len(assignments),
            train_conflicts=total_train_conflicts,
            estimated_train_impact=round(total_train_impact, 2),
            coordination_savings_hours=round(total_coordination_savings, 2),
            asset_availability=round(availability, 4),
            assignments=assignments,
            unassigned_tasks=unassigned,
            warnings=[],
        )
