"""FastAPI Route Handlers exposing all AI and Optimization endpoints."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from src.schemas import (
    Asset,
    MaintenanceTask,
    BlockWindow,
    Resource,
    ScheduleAssignment,
    OptimizationResult,
    Department,
    Train,
    TrainMovement,
    RiskLevel,
    PriorityLevel,
)
from src.risk_engine.explain import RiskExplanation
from src.priority_engine.priority import PriorityBreakdown
from src.train_impact.conflict_detector import TrainConflictReport
from src.coordination.coordinator import TaskCoordinationBundle
from src.planning.weekly import WeeklyPlan
from src.planning.monthly import MonthlyPlan
from src.planning.replan import DisruptionEvent, ReplanResult
from src.evaluation.baseline import BenchmarkReport
from src.evaluation.metrics import AssetAvailabilityReport
from src.evaluation.report import ExplainableScheduleReport
from src.api.dependencies import ServiceContainer, get_services

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")


# ============================================================================
# Request & Response DTOs
# ============================================================================

class RiskPredictRequest(BaseModel):
    assets: List[Asset]


class RiskPredictResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    explanations: List[RiskExplanation]


class PriorityScoreRequest(BaseModel):
    tasks: List[MaintenanceTask]
    assets: Optional[List[Asset]] = None


class PriorityScoreResponse(BaseModel):
    results: List[PriorityBreakdown]


class TrainConflictRequest(BaseModel):
    blocks: List[BlockWindow]
    movements: List[TrainMovement]
    trains: Optional[List[Train]] = None


class TrainConflictResponse(BaseModel):
    reports: List[TrainConflictReport]


class CoordinationEvaluateRequest(BaseModel):
    tasks: List[MaintenanceTask]


class PlanOptimizeRequest(BaseModel):
    tasks: List[MaintenanceTask]
    blocks: List[BlockWindow]
    resources: List[Resource]
    movements: Optional[List[TrainMovement]] = None
    trains: Optional[List[Train]] = None
    plan_id: Optional[str] = None


class WeeklyPlanRequest(BaseModel):
    tasks: List[MaintenanceTask]
    blocks: List[BlockWindow]
    resources: List[Resource]
    movements: Optional[List[TrainMovement]] = None
    trains: Optional[List[Train]] = None
    week_start_date: Optional[dt.date] = None
    plan_id: Optional[str] = None


class MonthlyPlanRequest(BaseModel):
    tasks: List[MaintenanceTask]
    blocks: List[BlockWindow]
    resources: List[Resource]
    movements: Optional[List[TrainMovement]] = None
    trains: Optional[List[Train]] = None
    month_start_date: Optional[dt.date] = None
    num_weeks: int = 4
    plan_id: Optional[str] = None


class DynamicReplanRequest(BaseModel):
    event: DisruptionEvent
    current_plan: WeeklyPlan
    all_tasks: List[MaintenanceTask]
    all_blocks: List[BlockWindow]
    all_resources: List[Resource]
    movements: Optional[List[TrainMovement]] = None
    trains: Optional[List[Train]] = None


class BenchmarkRequest(BaseModel):
    tasks: List[MaintenanceTask]
    blocks: List[BlockWindow]
    resources: List[Resource]
    movements: Optional[List[TrainMovement]] = None
    trains: Optional[List[Train]] = None
    dataset_name: str = "Benchmark-Scenario"


class MetricsCalculateRequest(BaseModel):
    assignments: List[ScheduleAssignment]
    tasks: List[MaintenanceTask]
    assets: List[Asset]
    horizon_hours: float = 168.0


class ExplainableReportRequest(BaseModel):
    plan: WeeklyPlan
    tasks: List[MaintenanceTask]
    blocks: List[BlockWindow]


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/risk/predict", response_model=RiskPredictResponse, tags=["Asset Risk"])
def predict_asset_risk(
    req: RiskPredictRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Predict asset failure risk probability, risk level, and feature attribution."""
    if not req.assets:
        raise HTTPException(status_code=400, detail="No assets provided for risk prediction.")

    predictions = []
    explanations = []

    for asset in req.assets:
        if services.risk_predictor is not None:
            pred = services.risk_predictor.predict_single(asset)
            predictions.append(pred)
        else:
            # Fallback heuristic calculation if model artifact not preloaded
            pred_score = max(0.01, min(0.99, (100.0 - asset.condition_score) / 100.0))
            pred = {
                "asset_id": asset.asset_id,
                "predicted_risk_probability": round(pred_score, 4),
                "risk_level": RiskLevel.HIGH.value if pred_score > 0.6 else RiskLevel.LOW.value,
                "is_at_risk": pred_score > 0.5,
            }
            predictions.append(pred)

        prob = float(pred.get("risk_probability", pred.get("predicted_risk_probability", 0.5)))
        lvl = str(pred.get("risk_level", "LOW"))
        expl = services.risk_explainer.explain_asset(asset, risk_probability=prob, risk_level=lvl)
        explanations.append(expl)

    return RiskPredictResponse(predictions=predictions, explanations=explanations)


@router.post("/priority/score", response_model=PriorityScoreResponse, tags=["Priority Scoring"])
def calculate_task_priority(
    req: PriorityScoreRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Calculate 0-100 normalized priority score with multi-factor component breakdown."""
    if not req.tasks:
        raise HTTPException(status_code=400, detail="No tasks provided for priority scoring.")

    assets_lookup = {a.asset_id: a for a in (req.assets or [])}
    results = []
    for t in req.tasks:
        asset = assets_lookup.get(t.asset_id)
        crit = asset.criticality if asset else 3
        risk = t.risk_score if t.risk_score is not None else 0.5
        breakdown = services.priority_engine.calculate_priority(
            t, risk_probability=risk, asset_criticality=crit
        )
        results.append(breakdown)
    return PriorityScoreResponse(results=results)



@router.post("/train-impact/conflicts", response_model=TrainConflictResponse, tags=["Train Protection"])
def detect_train_conflicts(
    req: TrainConflictRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Detect passenger/freight train conflicts and calculate delay penalties for proposed blocks."""
    train_dict = {t.train_id: t for t in (req.trains or [])}
    reports_dict = services.conflict_detector.batch_detect_conflicts(
        req.blocks, req.movements, train_dict
    )
    return TrainConflictResponse(reports=list(reports_dict.values()))


@router.post("/coordination/evaluate", response_model=TaskCoordinationBundle, tags=["Possession Coordination"])
def evaluate_coordination_bundle(
    req: CoordinationEvaluateRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Evaluate cross-departmental compatibility and calculate track possession savings."""
    if not req.tasks:
        raise HTTPException(status_code=400, detail="No tasks provided for coordination evaluation.")
    bundle = services.coordinator.evaluate_bundle(req.tasks)
    return bundle


@router.post("/plan/optimize", response_model=OptimizationResult, tags=["CP-SAT Optimization"])
def solve_block_optimization(
    req: PlanOptimizeRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Execute core Google OR-Tools CP-SAT integer optimization solver."""
    train_dict = {t.train_id: t for t in (req.trains or [])}
    conflict_reports = {}
    if req.movements:
        conflict_reports = services.conflict_detector.batch_detect_conflicts(
            req.blocks, req.movements, train_dict
        )

    candidates, _ = services.candidate_engine.generate_candidates(
        req.tasks, req.blocks, req.resources, conflict_reports
    )

    opt_result = services.optimizer.solve(
        tasks=req.tasks,
        blocks=req.blocks,
        resources=req.resources,
        feasible_candidates=candidates,
        conflict_reports=conflict_reports,
        plan_id=req.plan_id,
    )
    return opt_result


@router.post("/plan/weekly", response_model=WeeklyPlan, tags=["Planning Engines"])
def generate_weekly_plan(
    req: WeeklyPlanRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Generate 7-day multi-department rolling block schedule with daily allocations."""
    plan = services.weekly_engine.generate_weekly_plan(
        tasks=req.tasks,
        blocks=req.blocks,
        resources=req.resources,
        train_movements=req.movements,
        trains=req.trains,
        week_start_date=req.week_start_date,
        plan_id=req.plan_id,
        strict_audit=True,
    )
    return plan


@router.post("/plan/monthly", response_model=MonthlyPlan, tags=["Planning Engines"])
def generate_monthly_plan(
    req: MonthlyPlanRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Generate 30-day (4-week) rolling-horizon schedule with committed near-term vs flexible long-term."""
    plan = services.monthly_engine.generate_monthly_plan(
        tasks=req.tasks,
        blocks=req.blocks,
        resources=req.resources,
        train_movements=req.movements,
        trains=req.trains,
        month_start_date=req.month_start_date,
        num_weeks=req.num_weeks,
        plan_id=req.plan_id,
    )
    return plan


@router.post("/plan/replan", response_model=ReplanResult, tags=["Dynamic Replanning"])
def handle_disruption_replan(
    req: DynamicReplanRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Handle live disruption event with minimal-perturbation schedule re-optimization."""
    result = services.replanning_engine.handle_disruption(
        event=req.event,
        current_plan=req.current_plan,
        all_tasks=req.all_tasks,
        all_blocks=req.all_blocks,
        all_resources=req.all_resources,
        train_movements=req.movements,
        trains=req.trains,
    )
    return result


@router.post("/evaluation/benchmark", response_model=BenchmarkReport, tags=["Evaluation & Benchmarks"])
def run_benchmark_comparison(
    req: BenchmarkRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Benchmark CP-SAT optimizer against FCFS and Greedy Priority baselines."""
    report = services.baseline_comparator.compare(
        tasks=req.tasks,
        blocks=req.blocks,
        resources=req.resources,
        train_movements=req.movements,
        trains=req.trains,
        dataset_name=req.dataset_name,
    )
    return report


@router.post("/evaluation/metrics", response_model=AssetAvailabilityReport, tags=["Evaluation & Benchmarks"])
def calculate_asset_availability_metrics(
    req: MetricsCalculateRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Calculate corridor availability percentage, MTBF/MTTR, and cross-departmental bundling efficiency."""
    report = services.metrics_calculator.calculate_metrics(
        assignments=req.assignments,
        tasks=req.tasks,
        assets=req.assets,
        horizon_hours=req.horizon_hours,
    )
    return report


@router.post("/evaluation/report", response_model=ExplainableScheduleReport, tags=["Evaluation & Benchmarks"])
def generate_explainable_optimization_report(
    req: ExplainableReportRequest,
    services: ServiceContainer = Depends(get_services),
):
    """Generate human-readable explainability narrative for Section Controllers and DRMs."""
    report = services.report_generator.generate_report(
        plan=req.plan,
        tasks=req.tasks,
        blocks=req.blocks,
    )
    return report
