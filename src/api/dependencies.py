"""FastAPI Dependency Injection and Service Container."""

from __future__ import annotations
import logging
from typing import Optional

from src.risk_engine.predict import AssetRiskPredictor
from src.risk_engine.explain import RiskExplainer
from src.priority_engine.priority import MaintenancePriorityEngine
from src.train_impact.conflict_detector import TrainConflictDetector
from src.train_impact.predict import TrainDelayPredictor
from src.coordination.coordinator import MultiDepartmentCoordinator
from src.block_planner.candidates import CandidateGenerationEngine
from src.block_planner.optimizer import BlockOptimizationSolver
from src.block_planner.constraints import ConstraintManager
from src.planning.weekly import WeeklyPlanningEngine
from src.planning.monthly import MonthlyPlanningEngine
from src.planning.replan import DynamicReplanningEngine
from src.evaluation.baseline import BaselineComparator
from src.evaluation.metrics import AssetAvailabilityMetricsCalculator
from src.evaluation.report import OptimizationReportGenerator

logger = logging.getLogger(__name__)


class ServiceContainer:
    """Singleton registry for all Hybrid AI and Optimization service engines."""

    def __init__(self):
        logger.info("Initializing AI Railway Block Planning Service Container...")
        try:
            self.risk_predictor = AssetRiskPredictor()
        except Exception as e:
            logger.warning("AssetRiskPredictor initialization without saved model artifact: %s", e)
            self.risk_predictor = None

        self.risk_explainer = RiskExplainer()
        self.priority_engine = MaintenancePriorityEngine()
        self.conflict_detector = TrainConflictDetector()
        
        try:
            self.delay_predictor = TrainDelayPredictor()
        except Exception:
            self.delay_predictor = None

        self.coordinator = MultiDepartmentCoordinator()
        self.candidate_engine = CandidateGenerationEngine(delay_predictor=self.delay_predictor)
        self.constraint_manager = ConstraintManager()
        self.optimizer = BlockOptimizationSolver()
        self.weekly_engine = WeeklyPlanningEngine(
            optimizer=self.optimizer,
            candidate_engine=self.candidate_engine,
            constraint_manager=self.constraint_manager,
            conflict_detector=self.conflict_detector,
        )
        self.monthly_engine = MonthlyPlanningEngine(weekly_engine=self.weekly_engine)
        self.replanning_engine = DynamicReplanningEngine(weekly_engine=self.weekly_engine)
        self.baseline_comparator = BaselineComparator()
        self.metrics_calculator = AssetAvailabilityMetricsCalculator()
        self.report_generator = OptimizationReportGenerator()
        logger.info("Service Container initialized successfully.")


# Global service container instance
SERVICES = ServiceContainer()


def get_services() -> ServiceContainer:
    """Dependency provider for FastAPI route endpoints."""
    return SERVICES
