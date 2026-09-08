"""End-to-End and Edge Case Testing Suite for AI Railway Block Planning System."""

from datetime import datetime, date, timedelta
import pytest
from fastapi.testclient import TestClient

from src.schemas import (
    Asset,
    MaintenanceTask,
    BlockWindow,
    Resource,
    Department,
    ResourceType,
    Train,
    TrainMovement,
    TrainType,
    TrainDirection,
)
from src.block_planner.optimizer import BlockOptimizationSolver
from src.block_planner.candidates import CandidateGenerationEngine
from src.planning.weekly import WeeklyPlanningEngine, WeeklyPlan
from src.evaluation.metrics import AssetAvailabilityMetricsCalculator
from src.evaluation.report import OptimizationReportGenerator
from src.api.main import app

client = TestClient(app)


def test_edge_case_zero_available_blocks():
    """Verify solver handles 0 available blocks gracefully without crashing."""
    now = datetime(2026, 9, 8, 10, 0)
    tasks = [
        MaintenanceTask(
            task_id="T-01",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=5,
            priority_score=95.0,
            duration_hours=2.0,
            deadline=now + timedelta(hours=24),
            is_safety_critical=True,
        )
    ]
    # Blocks exist but available=False
    blocks = [
        BlockWindow(
            block_id="BLK-CLOSED",
            section_id="SEC-01",
            date=now.date(),
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=5),
            available=False,
        )
    ]
    resources = [
        Resource(
            resource_id="RES-01",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        )
    ]

    planner = WeeklyPlanningEngine()
    plan = planner.generate_weekly_plan(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        week_start_date=now.date(),
    )

    assert plan.total_tasks_scheduled == 0
    assert len(plan.total_unassigned_tasks) == 1
    assert "T-01" in plan.total_unassigned_tasks


def test_edge_case_extreme_oversubscription():
    """Verify optimizer strictly prioritizes safety-critical tasks when demand >> capacity."""
    now = datetime(2026, 9, 8, 10, 0)
    # Only 1 block of 2 hours on SEC-01
    blocks = [
        BlockWindow(
            block_id="BLK-CAP-LIMITED",
            section_id="SEC-01",
            date=now.date(),
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=4),
            duration_hours=2.0,
            available=True,
        )
    ]
    resources = [
        Resource(
            resource_id="RES-01",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        )
    ]

    # 20 tasks competing for 1 block slot
    tasks = []
    # 1 critical task
    tasks.append(
        MaintenanceTask(
            task_id="T-CRITICAL",
            asset_id="AST-CRIT",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="TrackTamping",
            severity=5,
            urgency=5,
            priority_score=99.0,
            duration_hours=2.0,
            deadline=now + timedelta(hours=24),
            is_safety_critical=True,
        )
    )
    # 19 routine tasks
    for i in range(1, 20):
        tasks.append(
            MaintenanceTask(
                task_id=f"T-ROUTINE-{i:02d}",
                asset_id=f"AST-{i:02d}",
                section_id="SEC-01",
                department=Department.ENGINEERING,
                maintenance_type="TrackTamping",
                severity=2,
                urgency=2,
                priority_score=40.0 + i,
                duration_hours=2.0,
                deadline=now + timedelta(hours=24),
                is_safety_critical=False,
            )
        )

    cand_engine = CandidateGenerationEngine()
    candidates, _ = cand_engine.generate_candidates(tasks, blocks, resources)

    solver = BlockOptimizationSolver()
    result = solver.solve(tasks, blocks, resources, candidates)

    assert result.status == "OPTIMAL"
    assert result.tasks_scheduled == 1
    assert result.critical_tasks_scheduled == 1
    assert "T-CRITICAL" in result.assignments[0].task_ids
    assert len(result.unassigned_tasks) == 19


def test_edge_case_resource_machine_deficit():
    """Verify tasks requiring missing specialized machinery are identified as infeasible."""
    now = datetime(2026, 9, 8, 10, 0)
    tasks = [
        MaintenanceTask(
            task_id="T-NEED-BCM",
            asset_id="AST-01",
            section_id="SEC-01",
            department=Department.ENGINEERING,
            maintenance_type="BallastCleaning",
            severity=4,
            urgency=4,
            priority_score=85.0,
            duration_hours=3.0,
            required_workers=6,
            required_machine="BallastCleaningMachine",
            deadline=now + timedelta(hours=24),
        )
    ]
    blocks = [
        BlockWindow(
            block_id="BLK-01",
            section_id="SEC-01",
            date=now.date(),
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=6),
            duration_hours=4.0,
            available=True,
        )
    ]
    # Only human crew is provided, no BCM machine
    resources = [
        Resource(
            resource_id="RES-CREW-ONLY",
            department=Department.ENGINEERING,
            resource_type=ResourceType.CREW,
            capacity=10,
            available_from=now,
            available_until=now + timedelta(hours=48),
            section_id="SEC-01",
        )
    ]

    cand_engine = CandidateGenerationEngine()
    candidates, summary = cand_engine.generate_candidates(tasks, blocks, resources)

    assert summary.feasible_pairs_count == 0
    assert summary.infeasible_pairs_count == 1
    assert not candidates[0].feasible
    assert "BallastCleaningMachine" in candidates[0].reason_if_infeasible and "unavailable" in candidates[0].reason_if_infeasible



def test_full_pipeline_end_to_end_integration():
    """Test full AI + CP-SAT + Evaluation + Reporting pipeline via FastAPI REST client."""
    now = datetime(2026, 9, 8, 10, 0)
    start_date_str = "2026-09-08"

    asset_payload = {
        "asset_id": "AST-E2E-01",
        "asset_type": "TrackSegment",
        "department": "ENGINEERING",
        "section_id": "SEC-E2E-01",
        "location": "KM 50/2",
        "criticality": 5,
        "installation_date": "2016-01-01",
        "age_years": 10.5,
        "condition_score": 55.0,
        "traffic_load": 45.0,
    }

    task1 = {
        "task_id": "TSK-E2E-ENG",
        "asset_id": "AST-E2E-01",
        "section_id": "SEC-E2E-01",
        "department": "ENGINEERING",
        "maintenance_type": "TrackTamping",
        "severity": 5,
        "urgency": 5,
        "duration_hours": 2.0,
        "deadline": (now + timedelta(hours=48)).isoformat(),
        "required_workers": 4,
    }
    task2 = {
        "task_id": "TSK-E2E-SNT",
        "asset_id": "AST-E2E-01",
        "section_id": "SEC-E2E-01",
        "department": "S_AND_T",
        "maintenance_type": "SignalInspection",
        "severity": 4,
        "urgency": 4,
        "duration_hours": 1.5,
        "deadline": (now + timedelta(hours=48)).isoformat(),
        "required_workers": 2,
    }

    block1 = {
        "block_id": "BLK-E2E-01",
        "section_id": "SEC-E2E-01",
        "date": start_date_str,
        "start_time": (now + timedelta(hours=2)).isoformat(),
        "end_time": (now + timedelta(hours=6)).isoformat(),
        "available": True,
    }

    res_eng = {
        "resource_id": "RES-E2E-ENG",
        "department": "ENGINEERING",
        "resource_type": "CREW",
        "capacity": 10,
        "available_from": now.isoformat(),
        "available_until": (now + timedelta(hours=72)).isoformat(),
        "section_id": "SEC-E2E-01",
    }
    res_snt = {
        "resource_id": "RES-E2E-SNT",
        "department": "S_AND_T",
        "resource_type": "CREW",
        "capacity": 6,
        "available_from": now.isoformat(),
        "available_until": (now + timedelta(hours=72)).isoformat(),
        "section_id": "SEC-E2E-01",
    }

    # Step 1: Risk Prediction
    risk_res = client.post("/api/v1/risk/predict", json={"assets": [asset_payload]})
    assert risk_res.status_code == 200
    assert len(risk_res.json()["predictions"]) == 1

    # Step 2: Priority Scoring
    priority_res = client.post("/api/v1/priority/score", json={"tasks": [task1, task2], "assets": [asset_payload]})
    assert priority_res.status_code == 200
    assert len(priority_res.json()["results"]) == 2

    # Step 3: Coordination Evaluation
    coord_res = client.post("/api/v1/coordination/evaluate", json={"tasks": [task1, task2]})
    assert coord_res.status_code == 200
    assert coord_res.json()["is_compatible"] is True
    assert coord_res.json()["saved_possession_hours"] > 0.0

    # Step 4: Weekly Plan Generation
    plan_payload = {
        "tasks": [task1, task2],
        "blocks": [block1],
        "resources": [res_eng, res_snt],
        "week_start_date": start_date_str,
        "plan_id": "E2E-INTEGRATION-PLAN-01",
    }
    weekly_res = client.post("/api/v1/plan/weekly", json=plan_payload)
    assert weekly_res.status_code == 200
    weekly_plan = weekly_res.json()
    assert weekly_plan["total_tasks_scheduled"] == 2
    assert weekly_plan["total_coordination_savings_hours"] > 0.0

    # Step 5: Explainable Report Generation
    report_res = client.post(
        "/api/v1/evaluation/report",
        json={"plan": weekly_plan, "tasks": [task1, task2], "blocks": [block1]},
    )
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert "Plan [E2E-INTEGRATION-PLAN-01]" in report_data["executive_summary"]
    assert report_data["tasks_scheduled_count"] == 2
    assert len(report_data["block_explanations"]) == 1
