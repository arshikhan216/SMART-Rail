"""Unit tests for Chunk 12: Optimization Objective Builder."""

import datetime as dt
import pytest
from ortools.sat.python import cp_model

from src.config import OptimizationWeightsConfig
from src.block_planner.objective import (
    OptimizationObjectiveBuilder,
    ObjectiveEvaluationReport,
)
from src.schemas import MaintenanceTask, BlockWindow, Department


def test_objective_builder_terms_creation():
    weights = OptimizationWeightsConfig(
        priority_gain=100.0,
        coordination_bonus=50.0,
        train_impact_penalty=25.0,
        downtime_penalty=10.0,
        deferral_penalty=60.0,
        unserved_critical_penalty=1500.0,
    )
    builder = OptimizationObjectiveBuilder(weights=weights)

    model = cp_model.CpModel()
    t1 = MaintenanceTask(
        task_id="TSK-01",
        asset_id="AST-01",
        section_id="SEC-01",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=2.0,
        priority_score=80.0,
        deadline=dt.datetime(2026, 3, 10),
        is_safety_critical=True,
    )

    b1 = BlockWindow(
        block_id="BLK-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),
        available=True,
    )

    x = {("TSK-01", "BLK-01"): model.NewBoolVar("x_01_01")}
    u = {"TSK-01": model.NewBoolVar("u_01")}
    y = {"BLK-01": model.NewBoolVar("y_01")}
    c_pair = {}

    terms = builder.build_objective(
        model=model,
        tasks=[t1],
        blocks=[b1],
        x=x,
        u=u,
        y=y,
        c_pair=c_pair,
        blocks_for_task={"TSK-01": ["BLK-01"]},
        conflict_reports={},
        task_map={"TSK-01": t1},
    )

    assert len(terms) > 0

    # Solve minimal model to verify evaluation report
    model.Add(x[("TSK-01", "BLK-01")] + u["TSK-01"] == 1)
    model.Add(y["BLK-01"] >= x[("TSK-01", "BLK-01")])

    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    assert status == cp_model.OPTIMAL

    eval_report = builder.evaluate_solution(
        solver=solver,
        tasks=[t1],
        blocks=[b1],
        x=x,
        u=u,
        y=y,
        c_pair=c_pair,
        conflict_reports={},
        task_map={"TSK-01": t1},
    )

    assert isinstance(eval_report, ObjectiveEvaluationReport)
    assert len(eval_report.components) == 4
    assert "Objective Value:" in eval_report.mathematical_summary
