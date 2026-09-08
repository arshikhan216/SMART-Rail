"""Configurable mathematical objective builder for CP-SAT Block Optimization."""

from __future__ import annotations
import logging
from typing import Dict, List, Optional, Tuple, Any
from ortools.sat.python import cp_model
from pydantic import BaseModel, Field

from src.config import CONFIG, OptimizationWeightsConfig
from src.schemas import MaintenanceTask, BlockWindow

logger = logging.getLogger(__name__)


class ObjectiveComponentReport(BaseModel):
    """Auditable breakdown of an individual objective term contribution."""
    component_name: str
    term_type: str  # GAIN or PENALTY
    configured_weight: float
    raw_metric_value: float
    weighted_contribution: float
    description: str


class ObjectiveEvaluationReport(BaseModel):
    """Complete multi-objective evaluation summary post-optimization."""
    total_objective_value: float
    components: List[ObjectiveComponentReport] = Field(default_factory=list)
    mathematical_summary: str = ""


class OptimizationObjectiveBuilder:
    """
    Builds the linearized multi-objective function for OR-Tools CP-SAT.
    
    Mathematical Formulation:
    Maximize:
        + sum_{t, b} (w_prio * P_t * x_{t,b})
        + sum_{t1, t2, b} (w_coord * c_{t1,t2,b})
        + sum_{t1, t2, b} (w_avail * s_{1,2} * c_{t1,t2,b})
        - sum_{b} (w_train * I_b * y_b)
        - sum_{b} (w_down * D_b * y_b)
        - sum_{t} (w_def * (P_t / 100) * u_t)
        - sum_{t in Critical} (w_crit * u_t)
        - sum_{t, b} (w_res * workers_t * x_{t,b})
    """

    SCALE = 10  # Precision multiplier for integer conversion

    def __init__(self, weights: Optional[OptimizationWeightsConfig] = None):
        self.weights = weights or CONFIG.optimization.weights

    def build_objective(
        self,
        model: cp_model.CpModel,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        x: Dict[Tuple[str, str], cp_model.IntVar],
        u: Dict[str, cp_model.IntVar],
        y: Dict[str, cp_model.IntVar],
        c_pair: Dict[Tuple[str, str, str], cp_model.IntVar],
        blocks_for_task: Dict[str, List[str]],
        conflict_reports: Dict[str, Any],
        task_map: Dict[str, MaintenanceTask],
    ) -> List[Any]:
        """Formulate and attach linear objective expression to the CP-SAT model."""
        obj_terms = []
        w = self.weights

        # 1. Maintenance Priority Gain Term
        for t in tasks:
            t_id = t.task_id
            p_score = t.priority_score if t.priority_score is not None else 50.0
            p_gain_int = int(round(p_score * w.priority_gain))

            for b_id in blocks_for_task[t_id]:
                if (t_id, b_id) in x:
                    obj_terms.append(p_gain_int * x[(t_id, b_id)])

        # 2. Multi-Department Coordination Benefit Term
        coord_bonus_int = int(round(w.coordination_bonus * 100))
        for (t1_id, t2_id, b_id), c_var in c_pair.items():
            obj_terms.append(coord_bonus_int * c_var)

        # 3. Train Disruption Impact Penalty Term
        for b in blocks:
            b_id = b.block_id
            if b_id in y:
                rep = conflict_reports.get(b_id)
                impact = rep.impact_score if rep else 0.0
                impact_penalty_int = int(round(impact * w.train_impact_penalty * self.SCALE))
                obj_terms.append(-impact_penalty_int * y[b_id])

        # 4. Infrastructure Possession Downtime Penalty Term
        for b in blocks:
            b_id = b.block_id
            if b_id in y:
                downtime_penalty_int = int(round(b.duration_hours * w.downtime_penalty * self.SCALE))
                obj_terms.append(-downtime_penalty_int * y[b_id])

        # 5. Deferred Maintenance & Critical Task Unserved Penalty Terms
        for t in tasks:
            t_id = t.task_id
            p_score = t.priority_score if t.priority_score is not None else 50.0
            deferral_int = int(round(w.deferral_penalty * (p_score / 100.0) * self.SCALE))
            
            # Additional heavy penalty if safety critical task is left unserved
            critical_int = int(round(w.unserved_critical_penalty * self.SCALE)) if t.is_safety_critical else 0
            
            total_unserved_penalty = deferral_int + critical_int
            obj_terms.append(-total_unserved_penalty * u[t_id])

        # 6. Resource Headcount Friction Penalty Term
        for (t_id, b_id), var in x.items():
            task = task_map[t_id]
            res_penalty_int = int(round(task.required_workers * w.resource_penalty))
            obj_terms.append(-res_penalty_int * var)

        model.Maximize(sum(obj_terms))
        return obj_terms

    def evaluate_solution(
        self,
        solver: cp_model.CpSolver,
        tasks: List[MaintenanceTask],
        blocks: List[BlockWindow],
        x: Dict[Tuple[str, str], cp_model.IntVar],
        u: Dict[str, cp_model.IntVar],
        y: Dict[str, cp_model.IntVar],
        c_pair: Dict[Tuple[str, str, str], cp_model.IntVar],
        conflict_reports: Dict[str, Any],
        task_map: Dict[str, MaintenanceTask],
    ) -> ObjectiveEvaluationReport:
        """Produce an auditable breakdown of objective component contributions."""
        w = self.weights
        components: List[ObjectiveComponentReport] = []

        # 1. Priority Gain
        total_prio_gain = sum(
            (t.priority_score or 50.0) * w.priority_gain
            for t in tasks
            for b in blocks
            if (t.task_id, b.block_id) in x and solver.Value(x[(t.task_id, b.block_id)]) == 1
        )
        components.append(ObjectiveComponentReport(
            component_name="Priority Gain",
            term_type="GAIN",
            configured_weight=w.priority_gain,
            raw_metric_value=round(total_prio_gain / max(1.0, w.priority_gain), 2),
            weighted_contribution=round(total_prio_gain, 2),
            description="Accumulated priority points of scheduled maintenance tasks.",
        ))

        # 2. Coordination Bonus
        active_coords = sum(
            1 for c_var in c_pair.values() if solver.Value(c_var) == 1
        )
        coord_contrib = active_coords * (w.coordination_bonus * 100)
        components.append(ObjectiveComponentReport(
            component_name="Coordination Bonus",
            term_type="GAIN",
            configured_weight=w.coordination_bonus,
            raw_metric_value=float(active_coords),
            weighted_contribution=round(coord_contrib, 2),
            description="Reward for bundling multi-department tasks into shared block possessions.",
        ))

        # 3. Train Impact Penalty
        active_blocks = [b for b in blocks if b.block_id in y and solver.Value(y[b.block_id]) == 1]
        total_train_impact = sum(
            conflict_reports[b.block_id].impact_score for b in active_blocks if b.block_id in conflict_reports
        )
        train_impact_contrib = total_train_impact * w.train_impact_penalty * self.SCALE
        components.append(ObjectiveComponentReport(
            component_name="Train Disruption Penalty",
            term_type="PENALTY",
            configured_weight=w.train_impact_penalty,
            raw_metric_value=round(total_train_impact, 2),
            weighted_contribution=-round(train_impact_contrib, 2),
            description="Operational penalty for train conflicts and timetable delays.",
        ))

        # 4. Critical Task Penalties
        unserved_critical = sum(
            1 for t in tasks if t.is_safety_critical and solver.Value(u[t.task_id]) == 1
        )
        crit_contrib = unserved_critical * (w.unserved_critical_penalty * self.SCALE)
        components.append(ObjectiveComponentReport(
            component_name="Unserved Critical Penalty",
            term_type="PENALTY",
            configured_weight=w.unserved_critical_penalty,
            raw_metric_value=float(unserved_critical),
            weighted_contribution=-round(crit_contrib, 2),
            description="Severe penalty for deferring safety-critical infrastructure work.",
        ))

        total_obj = solver.ObjectiveValue()
        summary = (
            f"Objective Value: {total_obj:.2f} | Priority Gains: +{total_prio_gain:.1f}, "
            f"Coordination Bonus: +{coord_contrib:.1f}, Train Impact: -{train_impact_contrib:.1f}, "
            f"Unserved Critical: -{crit_contrib:.1f}."
        )

        return ObjectiveEvaluationReport(
            total_objective_value=round(float(total_obj), 2),
            components=components,
            mathematical_summary=summary,
        )
